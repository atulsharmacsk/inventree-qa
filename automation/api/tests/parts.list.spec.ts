import { checkPartList, expectPartsListed } from '../src/checks';
import { PART_FLAGS, type NewPart, type PartFilters, type PartList } from '../../shared/models';
import { newCategory, newPart, newStockItem, newStockLocation, uniqueName } from '../src/test-data';
import { expect, test } from './fixtures';

// Manual cases: test-cases/api/parts-list.md
// Every request is scoped to a test-owned category or a unique token, so other records do not affect the results.

type SearchRow = { field: string; partFields: (token: string) => Partial<NewPart> };

const SEARCH_ROWS: SearchRow[] = [
  { field: 'name', partFields: (token) => ({ name: `${token}-name` }) },
  { field: 'IPN', partFields: (token) => ({ IPN: `${token}-ipn` }) },
  { field: 'description', partFields: (token) => ({ description: `${token}-description` }) },
  { field: 'keywords', partFields: (token) => ({ keywords: `${token}-keywords` }) },
];

test.describe('Parts list', () => {
  test.use({ role: 'SUPERUSER' });

  test.describe('Pagination', () => {
    test('API-LIST-001: first page with limit', async ({ parts, categories }) => {
      const { category, created } = await test.step('Setup: a category with three parts', async () => {
        const category = await categories.createOrFail(newCategory());
        const created = [];
        for (let index = 0; index < 3; index++) created.push(await parts.createOrFail(newPart({ category: category.pk })));
        return { category, created };
      });

      const response = await test.step('GET /api/part/ with category and limit=2', async () => {
        return await parts.listFiltered({ category: category.pk, limit: 2 });
      });

      await test.step('Check count is 3, two parts of the category are returned, next is a URI, and previous is null', async () => {
        expect(response.status()).toBe(200);
        const body = (await response.json()) as PartList;
        checkPartList(body);
        expect(body.count).toBe(3);
        expect(body.results).toHaveLength(2);
        const createdIds = created.map((part) => part.pk);
        for (const part of body.results) expect(createdIds).toContain(part.pk);
        expect(body.next).toEqual(expect.any(String));
        expect(body.previous).toBeNull();
      });
    });

    test('API-LIST-002: last page with offset', async ({ parts, categories }) => {
      const { category, created } = await test.step('Setup: a category with three parts', async () => {
        const category = await categories.createOrFail(newCategory());
        const created = [];
        for (let index = 0; index < 3; index++) created.push(await parts.createOrFail(newPart({ category: category.pk })));
        return { category, created };
      });

      const [firstResponse, lastResponse] = await test.step('GET /api/part/ with limit=2 and offset=0, then offset=2', async () => {
        return [
          await parts.listFiltered({ category: category.pk, limit: 2, offset: 0 }),
          await parts.listFiltered({ category: category.pk, limit: 2, offset: 2 }),
        ];
      });

      await test.step('Check the last page has one result, next null, previous a URI, and the pages share no part', async () => {
        expect(firstResponse.status()).toBe(200);
        expect(lastResponse.status()).toBe(200);
        const first = (await firstResponse.json()) as PartList;
        const last = (await lastResponse.json()) as PartList;
        checkPartList(first);
        checkPartList(last);
        expect(last.count).toBe(3);
        expect(last.results).toHaveLength(1);
        expect(last.next).toBeNull();
        expect(last.previous).toEqual(expect.any(String));
        const ids = [...first.results, ...last.results].map((part) => part.pk);
        expect(new Set(ids).size).toBe(3);
        expect([...ids].sort()).toEqual(created.map((part) => part.pk).sort());
      });
    });

    test('API-LIST-003: offset beyond the last record', async ({ parts, categories }) => {
      const category = await test.step('Setup: a category with three parts', async () => {
        const category = await categories.createOrFail(newCategory());
        for (let index = 0; index < 3; index++) await parts.createOrFail(newPart({ category: category.pk }));
        return category;
      });

      const response = await test.step('GET /api/part/ with category, limit=2, and offset=10', async () => {
        return await parts.listFiltered({ category: category.pk, limit: 2, offset: 10 });
      });

      await test.step('Check 200 with empty results, count 3, and next null', async () => {
        expect(response.status()).toBe(200);
        const body = (await response.json()) as PartList;
        checkPartList(body);
        expect(body.results).toEqual([]);
        expect(body.count).toBe(3);
        expect(body.next).toBeNull();
      });
    });
    // Application finding (OQ-LIST-02): without `limit` the server returns a bare array, not the documented paginated object.
    test.fixme('API-LIST-004: request without limit (application finding: the response is an unpaginated array)', async ({ parts, categories }) => {
      const category = await test.step('Setup: a category with one part', async () => {
        const category = await categories.createOrFail(newCategory());
        await parts.createOrFail(newPart({ category: category.pk }));
        return category;
      });

      const response = await test.step('GET /api/part/ with the category and no limit', async () => {
        return await parts.listWithoutLimit({ category: category.pk });
      });

      await test.step('Check the response is the documented paginated list', async () => {
        expect(response.status()).toBe(200);
        checkPartList(await response.json());
      });
    });
  });

  test.describe('Search', () => {
    for (const { field, partFields } of SEARCH_ROWS) {
      test(`API-LIST-005: search matches the part ${field}`, async ({ parts }) => {
        const token = uniqueName('pw-list');
        const part = await test.step(`Setup: POST /api/part/ with the token in ${field}`, async () => {
          return await parts.createOrFail(newPart(partFields(token)));
        });

        const response = await test.step(`GET /api/part/ with search=${token}`, async () => {
          return await parts.listFiltered({ search: token });
        });

        await test.step(`Check only the part with the token in ${field} is returned`, async () => {
          await expectPartsListed(response, [part]);
        });
      });
    }

    test('API-LIST-005: search matches the category name', async ({ parts, categories }) => {
      const token = uniqueName('pw-list');
      const part = await test.step('Setup: a category named with the token and a part in it', async () => {
        const category = await categories.createOrFail(newCategory({ name: token }));
        return await parts.createOrFail(newPart({ category: category.pk }));
      });

      const response = await test.step(`GET /api/part/ with search=${token}`, async () => {
        return await parts.listFiltered({ search: token });
      });

      await test.step('Check only the part in that category is returned', async () => {
        await expectPartsListed(response, [part]);
      });
    });

    test('API-LIST-006: search with no match', async ({ parts }) => {
      const token = uniqueName('pw-list-none');

      const response = await test.step(`GET /api/part/ with search=${token}`, async () => {
        return await parts.listFiltered({ search: token });
      });

      await test.step('Check count is 0 and results is empty', async () => {
        await expectPartsListed(response, []);
      });
    });
  });

  test.describe('Filtering', () => {
    for (const flag of PART_FLAGS) {
      test(`API-LIST-007: filter by flag ${flag}`, async ({ parts, categories }) => {
        const { category, flagged, unflagged } = await test.step(`Setup: a category with one part with ${flag}=true and one with ${flag}=false`, async () => {
          const category = await categories.createOrFail(newCategory());
          const flagged = await parts.createOrFail(newPart({ category: category.pk, [flag]: true }));
          const unflagged = await parts.createOrFail(newPart({ category: category.pk, [flag]: false }));
          return { category, flagged, unflagged };
        });

        for (const [value, expected] of [
          [true, flagged],
          [false, unflagged],
        ] as const) {
          const response = await test.step(`GET /api/part/ with ${flag}=${value}`, async () => {
            return await parts.listFiltered({ category: category.pk, [flag]: value });
          });

          await test.step(`Check only the part with ${flag}=${value} is returned`, async () => {
            const body = await expectPartsListed(response, [expected]);
            expect(body.results.every((part) => part[flag] === value)).toBe(true);
          });
        }
      });
    }

    test('API-LIST-008: category filter with and without cascade', async ({ parts, categories }) => {
      const { parent, child, inParent, inChild } = await test.step('Setup: a category with a sub-category, and a part in each', async () => {
        const parent = await categories.createOrFail(newCategory());
        const child = await categories.createOrFail(newCategory({ parent: parent.pk }));
        const inParent = await parts.createOrFail(newPart({ category: parent.pk }));
        const inChild = await parts.createOrFail(newPart({ category: child.pk }));
        return { parent, child, inParent, inChild };
      });

      const rows: { filters: PartFilters; expected: typeof inParent[] }[] = [
        { filters: { category: parent.pk, cascade: true }, expected: [inParent, inChild] },
        { filters: { category: parent.pk, cascade: false }, expected: [inParent] },
        { filters: { category: child.pk, cascade: true }, expected: [inChild] },
      ];

      for (const { filters, expected } of rows) {
        const response = await test.step(`GET /api/part/ with category=${filters.category} and cascade=${filters.cascade}`, async () => {
          return await parts.listFiltered(filters);
        });

        await test.step(`Check ${expected.length} part(s) are returned`, async () => {
          await expectPartsListed(response, expected);
        });
      }
    });

    // Application finding (OQ-LIST-06): with the default cascade=true, category=null returns every part, not only uncategorized ones.
    test.fixme('API-LIST-009: parts without a category (application finding: category=null returns all parts)', async ({ parts, categories }) => {
      const token = uniqueName('pw-list');
      const { uncategorized } = await test.step('Setup: a part with no category and a part in a category, sharing a name token', async () => {
        const category = await categories.createOrFail(newCategory());
        const uncategorized = await parts.createOrFail(newPart({ name: `${token}-uncategorized` }));
        await parts.createOrFail(newPart({ name: `${token}-categorized`, category: category.pk }));
        return { uncategorized };
      });

      const response = await test.step('GET /api/part/ with category=null and the token', async () => {
        return await parts.listFiltered({ category: 'null', search: token });
      });

      await test.step('Check only the part without a category is returned', async () => {
        await expectPartsListed(response, [uncategorized]);
      });
    });

    test('API-LIST-010: exact and regular-expression text filters', async ({ parts, categories }) => {
      const token = uniqueName('pw-list');
      const { category, alpha, beta } = await test.step('Setup: a category with two parts whose IPNs share a prefix', async () => {
        const category = await categories.createOrFail(newCategory());
        const alpha = await parts.createOrFail(newPart({ category: category.pk, name: `${token}-alpha`, IPN: `${token}-100` }));
        const beta = await parts.createOrFail(newPart({ category: category.pk, name: `${token}-beta`, IPN: `${token}-1000` }));
        return { category, alpha, beta };
      });

      const rows: { filters: PartFilters; expected: typeof alpha[] }[] = [
        { filters: { IPN: `${token}-100` }, expected: [alpha] },
        { filters: { IPN_regex: '100$' }, expected: [alpha] },
        { filters: { IPN_regex: '-100' }, expected: [alpha, beta] },
        { filters: { name_regex: 'beta$' }, expected: [beta] },
      ];

      for (const { filters, expected } of rows) {
        const response = await test.step(`GET /api/part/ with ${JSON.stringify(filters)}`, async () => {
          return await parts.listFiltered({ category: category.pk, ...filters });
        });

        await test.step(`Check ${expected.length} part(s) are returned`, async () => {
          await expectPartsListed(response, expected);
        });
      }
    });

    test('API-LIST-011: filter by whether an IPN is set', async ({ parts, categories }) => {
      const { category, withIpn, withoutIpn } = await test.step('Setup: a category with a part with an IPN and one without', async () => {
        const category = await categories.createOrFail(newCategory());
        const withIpn = await parts.createOrFail(newPart({ category: category.pk, IPN: uniqueName('IPN') }));
        const withoutIpn = await parts.createOrFail(newPart({ category: category.pk }));
        return { category, withIpn, withoutIpn };
      });

      for (const [hasIpn, expected] of [
        [true, withIpn],
        [false, withoutIpn],
      ] as const) {
        const response = await test.step(`GET /api/part/ with has_ipn=${hasIpn}`, async () => {
          return await parts.listFiltered({ category: category.pk, has_ipn: hasIpn });
        });

        await test.step(`Check only the part ${hasIpn ? 'with' : 'without'} an IPN is returned`, async () => {
          await expectPartsListed(response, [expected]);
        });
      }
    });

    // Whether `low_stock` includes a part with no stock at all is OQ-LIST-05, so that part is not asserted.
    test('API-LIST-012: stock and low-stock filters', async ({ parts, categories, stockLocations, stockItems }) => {
      const minimumStock = 10;
      const { category, lowStock, atMinimum } = await test.step('Setup: parts with minimum stock 10 and no stock, stock 5, and stock 10', async () => {
        const category = await categories.createOrFail(newCategory());
        const location = await stockLocations.createOrFail(newStockLocation());
        await parts.createOrFail(newPart({ category: category.pk, minimum_stock: minimumStock }));
        const lowStock = await parts.createOrFail(newPart({ category: category.pk, minimum_stock: minimumStock }));
        const atMinimum = await parts.createOrFail(newPart({ category: category.pk, minimum_stock: minimumStock }));
        await stockItems.createOrFail(newStockItem(lowStock.pk, { quantity: 5, location: location.pk }));
        await stockItems.createOrFail(newStockItem(atMinimum.pk, { quantity: minimumStock, location: location.pk }));
        return { category, lowStock, atMinimum };
      });

      const hasStockResponse = await test.step('GET /api/part/ with has_stock=true', async () => {
        return await parts.listFiltered({ category: category.pk, has_stock: true });
      });

      await test.step('Check only the parts with stock are returned', async () => {
        await expectPartsListed(hasStockResponse, [lowStock, atMinimum]);
      });

      const lowStockResponse = await test.step('GET /api/part/ with low_stock=true', async () => {
        return await parts.listFiltered({ category: category.pk, low_stock: true });
      });

      await test.step('Check the part below its minimum is returned and the part at its minimum is not', async () => {
        expect(lowStockResponse.status()).toBe(200);
        const body = (await lowStockResponse.json()) as PartList;
        checkPartList(body);
        const ids = body.results.map((part) => part.pk);
        expect(ids).toContain(lowStock.pk);
        expect(ids).not.toContain(atMinimum.pk);
      });
    });

    test('API-LIST-013: exclude parts by ID', async ({ parts, categories }) => {
      const { category, kept, excluded } = await test.step('Setup: a category with three parts', async () => {
        const category = await categories.createOrFail(newCategory());
        const first = await parts.createOrFail(newPart({ category: category.pk }));
        const second = await parts.createOrFail(newPart({ category: category.pk }));
        const kept = await parts.createOrFail(newPart({ category: category.pk }));
        return { category, kept, excluded: [first, second] };
      });
      const excludeId = excluded.map((part) => part.pk).join(',');

      const response = await test.step(`GET /api/part/ with exclude_id=${excludeId}`, async () => {
        return await parts.listFiltered({ category: category.pk, exclude_id: excludeId });
      });

      await test.step('Check only the part that was not excluded is returned', async () => {
        await expectPartsListed(response, [kept]);
      });
    });

    // OQ-LIST-04 (confirmed by the user): both filters compare with creation_date and exclude the given day.
    test('API-LIST-014: filter by creation date', async ({ parts, categories }) => {
      const { category, part } = await test.step('Setup: a category with one part', async () => {
        const category = await categories.createOrFail(newCategory());
        return { category, part: await parts.createOrFail(newPart({ category: category.pk })) };
      });
      // Dates come from the server's creation_date, so the runner's time zone does not matter.
      const shiftDays = (date: string, days: number): string => {
        const shifted = new Date(`${date}T00:00:00Z`);
        shifted.setUTCDate(shifted.getUTCDate() + days);
        return shifted.toISOString().slice(0, 10);
      };
      const created = part.creation_date;
      const rows: { filters: PartFilters; included: boolean }[] = [
        { filters: { created_after: shiftDays(created, -1) }, included: true },
        { filters: { created_after: created }, included: false },
        { filters: { created_before: shiftDays(created, 1) }, included: true },
        { filters: { created_before: created }, included: false },
      ];

      for (const { filters, included } of rows) {
        await test.step(`GET /api/part/ with ${JSON.stringify(filters)} ${included ? 'includes' : 'excludes'} the part`, async () => {
          await expectPartsListed(await parts.listFiltered({ category: category.pk, ...filters }), included ? [part] : []);
        });
      }
    });
  });

  test.describe('Ordering and combination', () => {
    // OQ-LIST-03 (confirmed by the user): `name` and `-name` sort by name; unknown ordering fields are ignored.
    for (const { ordering, expected } of [
      { ordering: 'name', expected: ['a', 'b', 'c'] },
      { ordering: '-name', expected: ['c', 'b', 'a'] },
    ]) {
      test(`API-LIST-015: order by ${ordering}`, async ({ parts, categories }) => {
        const token = uniqueName('pw-list');
        const category = await test.step('Setup: a category with parts <token>-b, <token>-a, <token>-c, created in that order', async () => {
          const category = await categories.createOrFail(newCategory());
          for (const suffix of ['b', 'a', 'c']) await parts.createOrFail(newPart({ category: category.pk, name: `${token}-${suffix}` }));
          return category;
        });

        const response = await test.step(`GET /api/part/ with category and ordering=${ordering}`, async () => {
          return await parts.listFiltered({ category: category.pk, ordering });
        });

        await test.step(`Check the parts come back as ${expected.join(', ')}`, async () => {
          expect(response.status()).toBe(200);
          const body = (await response.json()) as PartList;
          checkPartList(body);
          expect(body.results.map((part) => part.name)).toEqual(expected.map((suffix) => `${token}-${suffix}`));
        });
      });
    }

    test('API-LIST-016: combined filters must all match', async ({ parts, categories }) => {
      const token = uniqueName('pw-list');
      const { category, match } = await test.step('Setup: three parts that differ in the assembly flag and the name token', async () => {
        const category = await categories.createOrFail(newCategory());
        const match = await parts.createOrFail(newPart({ category: category.pk, name: `${token}-match-a`, assembly: true }));
        await parts.createOrFail(newPart({ category: category.pk, name: `${token}-other-b`, assembly: true }));
        await parts.createOrFail(newPart({ category: category.pk, name: `${token}-match-c`, assembly: false }));
        return { category, match };
      });

      const response = await test.step(`GET /api/part/ with category, assembly=true and search=${token}-match`, async () => {
        return await parts.listFiltered({ category: category.pk, assembly: true, search: `${token}-match` });
      });

      await test.step('Check only the assembly whose name contains the token is returned', async () => {
        await expectPartsListed(response, [match]);
      });
    });
  });
});
