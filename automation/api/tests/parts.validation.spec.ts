import { checkCategoryShape, checkPartShape, expectPartsListed } from '../src/checks';
import type { Category, Part } from '../../shared/models';
import {
  CATEGORY_TEXT_LIMITS,
  MULTI_BYTE_CHARACTER,
  PART_TEXT_LIMITS,
  PART_WRITE_ONLY_FIELDS,
  newCategory,
  newCompany,
  newPart,
  newStockLocation,
  newSupplierPart,
  textOfLength,
  uniqueName,
} from '../src/test-data';
import { expect, test } from './fixtures';

// Manual cases: test-cases/api/field-validation.md
// Rejected values return 400 on the local instance (OQ-VAL-01, confirmed by the user, 2026-10-30).

/** Part fields with a maximum length, including `units` (which is only checked over its limit). */
const PART_OVER_LENGTH_ROWS = [...PART_TEXT_LIMITS, { field: 'units', maxLength: 20 }];

/** Category fields with a maximum length, including `icon` (which is only checked over its limit, OQ-VAL-04). */
const CATEGORY_OVER_LENGTH_ROWS = [...CATEGORY_TEXT_LIMITS, { field: 'icon', maxLength: 100 }];

/** A string of exactly `length` characters that starts with `token`. */
const startingWith = (token: string, length: number): string => (token + 'x'.repeat(length)).slice(0, length);

/** A URI of exactly `length` characters. */
const linkOfLength = (length: number): string => startingWith('https://example.com/', length);

test.describe('Field-level validation', () => {
  test.use({ role: 'SUPERUSER' });

  test.describe('Required fields', () => {
    test('API-VAL-001: create a part without name', async ({ parts }) => {
      const token = uniqueName('pw-val');

      const response = await test.step('POST /api/part/ with only a description', async () => {
        return await parts.createInvalid({ description: token });
      });

      await test.step('Check the request is rejected with 400 and no part was created', async () => {
        expect(response.status()).toBe(400);
        await expectPartsListed(await parts.listFiltered({ search: token }), []);
      });
    });

    test('API-VAL-002: create a category without name', async ({ categories }) => {
      const token = uniqueName('pw-val');

      const response = await test.step('POST /api/part/category/ with only a description', async () => {
        return await categories.createInvalid({ description: token });
      });

      await test.step('Check the request is rejected with 400 and no category was created', async () => {
        expect(response.status()).toBe(400);
        expect((await categories.listOrFail({ search: token })).count).toBe(0);
      });
    });

    // OQ-VAL-03: blank names are rejected after whitespace is trimmed.
    for (const name of ['', '   ']) {
      const label = name ? 'a whitespace-only' : 'an empty';

      test(`API-VAL-003: part with ${label} name`, async ({ parts }) => {
        const token = uniqueName('pw-val');

        const response = await test.step(`POST /api/part/ with ${label} name`, async () => {
          return await parts.createInvalid({ name, description: token });
        });

        await test.step('Check 400 with a name error and no part was created', async () => {
          expect(response.status()).toBe(400);
          expect(await response.json()).toHaveProperty('name');
          await expectPartsListed(await parts.listFiltered({ search: token }), []);
        });
      });

      test(`API-VAL-003: category with ${label} name`, async ({ categories }) => {
        const token = uniqueName('pw-val');

        const response = await test.step(`POST /api/part/category/ with ${label} name`, async () => {
          return await categories.createInvalid({ name, description: token });
        });

        await test.step('Check 400 with a name error and no category was created', async () => {
          expect(response.status()).toBe(400);
          expect(await response.json()).toHaveProperty('name');
          expect((await categories.listOrFail({ search: token })).count).toBe(0);
        });
      });
    }

    test('API-VAL-004: full update without name', async ({ parts, categories }) => {
      const { part, category } = await test.step('Setup: a part and a category with a known name and description', async () => {
        return {
          part: await parts.createOrFail(newPart({ description: 'Original part description' })),
          category: await categories.createOrFail(newCategory({ description: 'Original category description' })),
        };
      });

      const partResponse = await test.step('PUT /api/part/{id}/ with only a description', async () => {
        return await parts.replaceInvalid(part.pk, { description: 'Changed' });
      });
      const categoryResponse = await test.step('PUT /api/part/category/{id}/ with only a description', async () => {
        return await categories.replaceInvalid(category.pk, { description: 'Changed' });
      });

      await test.step('Check both requests return 400 and both records keep their name and description', async () => {
        expect(partResponse.status()).toBe(400);
        expect(categoryResponse.status()).toBe(400);
        const storedPart = await parts.getOrFail(part.pk);
        expect([storedPart.name, storedPart.description]).toEqual([part.name, part.description]);
        const storedCategory = await categories.getOrFail(category.pk);
        expect([storedCategory.name, storedCategory.description]).toEqual([category.name, category.description]);
      });
    });
  });

  test.describe('Maximum lengths', () => {
    for (const { field, maxLength } of PART_TEXT_LIMITS) {
      test(`API-VAL-005: part ${field} at its maximum length ${maxLength}`, async ({ parts }) => {
        const value = textOfLength(maxLength);
        const partToCreate = field === 'name' ? newPart({ name: value }) : newPart({ [field]: value });

        const response = await test.step(`POST /api/part/ with a ${maxLength}-character ${field}`, async () => {
          return await parts.create(partToCreate);
        });

        const created = await test.step('Check POST /api/part/ returns 201 and a valid part', async () => {
          expect(response.status()).toBe(201);
          const body = (await response.json()) as Part;
          checkPartShape(body);
          return body;
        });

        await test.step(`Check GET /api/part/{id}/ returns 200 with ${field} exactly as sent`, async () => {
          const readResponse = await parts.get(created.pk);
          expect(readResponse.status()).toBe(200);
          const stored = (await readResponse.json()) as Part;
          checkPartShape(stored);
          expect(stored[field]).toBe(value);
          expect(stored[field]).toHaveLength(maxLength);
        });
      });
    }

    for (const { field, maxLength } of PART_OVER_LENGTH_ROWS) {
      test(`API-VAL-006: part ${field} one character over the maximum ${maxLength}`, async ({ parts }) => {
        const token = uniqueName('pw-val');
        const value = field === 'description' ? startingWith(token, maxLength + 1) : 'x'.repeat(maxLength + 1);

        const response = await test.step(`POST /api/part/ with a ${maxLength + 1}-character ${field}`, async () => {
          return await parts.createInvalid({ name: uniqueName('pw-part'), description: token, [field]: value });
        });

        await test.step('Check the request is rejected with 400 and no part was created', async () => {
          expect(response.status()).toBe(400);
          await expectPartsListed(await parts.listFiltered({ search: token }), []);
        });
      });
    }

    test('API-VAL-007: over-length value on a partial update', async ({ parts }) => {
      const created = await test.step('Setup: POST /api/part/', async () => {
        return await parts.createOrFail(newPart({ description: 'Original description' }));
      });

      const response = await test.step('PATCH /api/part/{id}/ with a 101-character name', async () => {
        return await parts.updateInvalid(created.pk, { name: 'x'.repeat(101) });
      });

      await test.step('Check the request returns 400 and the name is unchanged', async () => {
        expect(response.status()).toBe(400);
        expect((await parts.getOrFail(created.pk)).name).toBe(created.name);
      });
    });

    for (const { field, maxLength } of CATEGORY_TEXT_LIMITS) {
      test(`API-VAL-008: category ${field} at its maximum length ${maxLength}`, async ({ categories }) => {
        const value = textOfLength(maxLength);
        const categoryToCreate = field === 'name' ? newCategory({ name: value }) : newCategory({ [field]: value });

        const response = await test.step(`POST /api/part/category/ with a ${maxLength}-character ${field}`, async () => {
          return await categories.create(categoryToCreate);
        });

        await test.step(`Check GET /api/part/category/{id}/ returns ${field} exactly as sent`, async () => {
          expect(response.status()).toBe(201);
          const created = (await response.json()) as Category;
          checkCategoryShape(created);
          const stored = await categories.getOrFail(created.pk);
          expect(stored[field]).toBe(value);
          expect(stored[field]).toHaveLength(maxLength);
        });
      });
    }

    // OQ-VAL-04: icon must be pack:name:variant for a real icon, so a valid 100-character icon cannot be built.
    const ICON_ROWS = [
      { label: 'a valid icon', icon: 'ti:box:outline', accepted: true },
      { label: 'a variant the pack does not have', icon: 'ti:box:filled', accepted: false },
      { label: 'an unknown icon name', icon: 'ti:nonexistent-icon:outline', accepted: false },
      { label: 'no pack or variant', icon: 'box', accepted: false },
      { label: 'no variant', icon: 'ti:box', accepted: false },
    ];

    for (const { label, icon, accepted } of ICON_ROWS) {
      test(`API-VAL-008: category icon with ${label} is ${accepted ? 'accepted' : 'rejected'}`, async ({ categories }) => {
        const name = uniqueName('pw-category');

        const response = await test.step(`POST /api/part/category/ with icon ${icon}`, async () => {
          return await categories.createInvalid({ name, icon });
        });

        await test.step(
          accepted ? 'Check 201 and the icon is stored as sent' : 'Check 400 with an _icon error and no category was created',
          async () => {
            if (accepted) {
              expect(response.status()).toBe(201);
              const created = (await response.json()) as Category;
              const stored = (await (await categories.get(created.pk)).json()) as Record<string, unknown>;
              expect(stored.icon).toBe(icon);
            } else {
              expect(response.status()).toBe(400);
              expect(await response.json()).toHaveProperty('_icon');
              expect((await categories.listOrFail({ search: name })).count).toBe(0);
            }
          },
        );
      });
    }

    for (const { field, maxLength } of CATEGORY_OVER_LENGTH_ROWS) {
      test(`API-VAL-009: category ${field} one character over the maximum ${maxLength}`, async ({ categories }) => {
        const token = uniqueName('pw-val');
        const value = 'x'.repeat(maxLength + 1);
        const body = field === 'name' ? { name: value, description: token } : { name: token, [field]: value };

        const response = await test.step(`POST /api/part/category/ with a ${maxLength + 1}-character ${field}`, async () => {
          return await categories.createInvalid(body);
        });

        await test.step('Check the request is rejected with 400 and no category was created', async () => {
          expect(response.status()).toBe(400);
          expect((await categories.listOrFail({ search: token })).count).toBe(0);
        });
      });
    }

    const LINK_ROWS = [
      { label: '2000 characters', link: linkOfLength(2000), accepted: true },
      { label: '2001 characters', link: linkOfLength(2001), accepted: false },
      { label: 'an empty string', link: '', accepted: true },
      { label: 'text that is not a URL', link: 'not a url', accepted: false },
    ];

    for (const { label, link, accepted } of LINK_ROWS) {
      test(`API-VAL-010: part link of ${label} is ${accepted ? 'accepted' : 'rejected'}`, async ({ parts }) => {
        const name = uniqueName('pw-part');

        const response = await test.step('POST /api/part/ with the link', async () => {
          return await parts.createInvalid({ name, link });
        });

        await test.step(
          accepted
            ? 'Check the part is created and the link is stored exactly'
            : 'Check the request is rejected with 400 and no part was created',
          async () => {
            if (accepted) {
              expect(response.status()).toBe(201);
              const created = (await response.json()) as Part;
              const stored = (await (await parts.get(created.pk)).json()) as { link: string | null };
              expect(stored.link).toBe(link);
            } else {
              expect(response.status()).toBe(400);
              await expectPartsListed(await parts.listFiltered({ search: name }), []);
            }
          },
        );
      });
    }

    test('API-VAL-011: maximum length counts characters, not bytes', async ({ parts }) => {
      const name = textOfLength(100, MULTI_BYTE_CHARACTER);

      const response = await test.step('POST /api/part/ with a 100-character multi-byte name', async () => {
        return await parts.create(newPart({ name }));
      });

      await test.step('Check GET /api/part/{id}/ returns the name exactly as sent', async () => {
        expect(response.status()).toBe(201);
        const created = (await response.json()) as Part;
        checkPartShape(created);
        const stored = await parts.getOrFail(created.pk);
        expect(stored.name).toBe(name);
        expect(stored.name).toHaveLength(100);
      });
    });
  });

  test.describe('Nullable fields', () => {
    for (const field of ['keywords', 'revision', 'units', 'link'] as const) {
      test(`API-VAL-012: set the nullable part field ${field} to null`, async ({ parts }) => {
        const created = await test.step('Setup: POST /api/part/ with keywords, revision, units, and link set', async () => {
          const response = await parts.createInvalid({
            name: uniqueName('pw-part'),
            keywords: 'known keywords',
            revision: 'A',
            units: 'kg',
            link: 'https://example.com/',
          });
          expect(response.status()).toBe(201);
          return (await response.json()) as Part;
        });

        const response = await test.step(`PATCH /api/part/{id}/ with ${field}=null`, async () => {
          return await parts.updateInvalid(created.pk, { [field]: null });
        });

        await test.step(`Check the request returns 200 and ${field} is now null`, async () => {
          expect(response.status()).toBe(200);
          const stored = (await (await parts.get(created.pk)).json()) as Record<string, unknown>;
          expect(stored[field]).toBeNull();
        });
      });
    }

    for (const field of ['name', 'description', 'IPN', 'active', 'minimum_stock'] as const) {
      test(`API-VAL-013: null on the non-nullable part field ${field}`, async ({ parts }) => {
        const created = await test.step('Setup: POST /api/part/ with known values', async () => {
          return await parts.createOrFail(
            newPart({ description: 'Known description', IPN: uniqueName('IPN'), minimum_stock: 5, active: true }),
          );
        });

        const response = await test.step(`PATCH /api/part/{id}/ with ${field}=null`, async () => {
          return await parts.updateInvalid(created.pk, { [field]: null });
        });

        await test.step(`Check the request returns 400 and ${field} keeps its value`, async () => {
          expect(response.status()).toBe(400);
          expect((await parts.getOrFail(created.pk))[field]).toEqual(created[field]);
        });
      });
    }

    // `icon` comes back as an empty string, not null (OQ-VAL-05, confirmed by the user).
    const CATEGORY_NULLED_FIELDS = [
      { field: 'default_keywords', expected: null },
      { field: 'default_location', expected: null },
      { field: 'icon', expected: '' },
    ];

    for (const { field, expected } of CATEGORY_NULLED_FIELDS) {
      test(`API-VAL-014: set the nullable category field ${field} to null`, async ({ stockLocations, categories }) => {
        const created =
          await test.step('Setup: a stock location and a category with default_keywords, default_location, and icon set', async () => {
            const location = await stockLocations.createOrFail(newStockLocation());
            const response = await categories.createInvalid({
              name: uniqueName('pw-category'),
              default_keywords: 'known keywords',
              default_location: location.pk,
              // The local instance rejects an icon that is not in the package:name:variant format (see OQ-VAL-04).
              icon: 'ti:box:outline',
            });
            expect(response.status()).toBe(201);
            return (await response.json()) as Category;
          });

        const response = await test.step(`PATCH /api/part/category/{id}/ with ${field}=null`, async () => {
          return await categories.updateInvalid(created.pk, { [field]: null });
        });

        await test.step(`Check the request returns 200 and ${field} is now ${JSON.stringify(expected)}`, async () => {
          expect(response.status()).toBe(200);
          const stored = (await (await categories.get(created.pk)).json()) as Record<string, unknown>;
          expect(stored[field]).toBe(expected);
        });
      });
    }

    for (const field of ['name', 'description', 'structural'] as const) {
      test(`API-VAL-015: null on the non-nullable category field ${field}`, async ({ categories }) => {
        const created = await test.step('Setup: POST /api/part/category/ with known values', async () => {
          return await categories.createOrFail(newCategory({ description: 'Known description', structural: false }));
        });

        const response = await test.step(`PATCH /api/part/category/{id}/ with ${field}=null`, async () => {
          return await categories.updateInvalid(created.pk, { [field]: null });
        });

        await test.step(`Check the request returns 400 and ${field} keeps its value`, async () => {
          expect(response.status()).toBe(400);
          expect((await categories.getOrFail(created.pk))[field]).toEqual(created[field]);
        });
      });
    }
  });

  test.describe('Read-only and write-only fields', () => {
    test('API-VAL-016: read-only part fields sent on create are not stored', async ({ parts }) => {
      const readOnlyValues = {
        in_stock: 500,
        total_in_stock: 500,
        stock_item_count: 5,
        revision_count: 5,
        starred: true,
        creation_date: '2000-01-01',
        barcode_hash: 'pw-fake-hash',
        full_name: 'pw-fake-full-name',
      };

      const response = await test.step('POST /api/part/ with read-only fields set', async () => {
        return await parts.createInvalid({ name: uniqueName('pw-part'), ...readOnlyValues });
      });

      const created = await test.step('Check the part is created (2xx)', async () => {
        expect(response.status()).toBe(201);
        return (await response.json()) as Part;
      });

      await test.step('Check no read-only field returns the submitted value', async () => {
        const stored = (await (await parts.get(created.pk)).json()) as Record<string, unknown>;
        for (const [field, value] of Object.entries(readOnlyValues)) {
          expect(stored[field], `${field} stored the submitted value`).not.toEqual(value);
        }
      });
    });

    test('API-VAL-017: read-only part fields sent on update do not change the part', async ({ parts }) => {
      const readOnlyFields = ['pk', 'in_stock', 'total_in_stock', 'creation_date', 'full_name', 'barcode_hash'];
      const created = await test.step('Setup: POST /api/part/', async () => {
        return await parts.createOrFail(newPart());
      });
      const before = (await (await parts.get(created.pk)).json()) as Record<string, unknown>;

      const response = await test.step('PATCH /api/part/{id}/ with read-only fields set', async () => {
        return await parts.updateInvalid(created.pk, {
          pk: created.pk + 1,
          in_stock: 999,
          total_in_stock: 999,
          creation_date: '2000-01-01',
          full_name: 'pw-fake-full-name',
          barcode_hash: 'pw-fake-hash',
        });
      });

      await test.step('Check the request succeeds and every read-only field keeps its value', async () => {
        expect(response.status()).toBe(200);
        const after = (await (await parts.get(created.pk)).json()) as Record<string, unknown>;
        for (const field of readOnlyFields) expect(after[field], `${field} changed`).toEqual(before[field]);
      });
    });

    test('API-VAL-018: read-only category fields sent on update do not change the category', async ({ parts, categories }) => {
      const readOnlyFields = ['pk', 'level', 'pathstring', 'part_count', 'subcategories'];
      const category = await test.step('Setup: a category with a sub-category and a part', async () => {
        const category = await categories.createOrFail(newCategory());
        await categories.createOrFail(newCategory({ parent: category.pk }));
        await parts.createOrFail(newPart({ category: category.pk }));
        return category;
      });
      const before = (await (await categories.get(category.pk)).json()) as Record<string, unknown>;

      const response = await test.step('PATCH /api/part/category/{id}/ with read-only fields set', async () => {
        return await categories.updateInvalid(category.pk, {
          pk: category.pk + 1,
          level: 7,
          pathstring: 'pw/fake/path',
          part_count: 99,
          subcategories: 99,
        });
      });

      await test.step('Check the request succeeds and every read-only field keeps its value', async () => {
        expect(response.status()).toBe(200);
        const after = (await (await categories.get(category.pk)).json()) as Record<string, unknown>;
        for (const field of readOnlyFields) expect(after[field], `${field} changed`).toEqual(before[field]);
      });
    });

    test('API-VAL-019: write-only part fields are not returned', async ({ parts }) => {
      const response = await test.step('POST /api/part/ with copy_category_parameters=false', async () => {
        return await parts.create(newPart({ copy_category_parameters: false }));
      });

      const created = await test.step('Check the POST response has no write-only fields', async () => {
        expect(response.status()).toBe(201);
        const body = (await response.json()) as Record<string, unknown>;
        checkPartShape(body);
        for (const field of PART_WRITE_ONLY_FIELDS) expect(body, `POST response contains ${field}`).not.toHaveProperty(field);
        return body as unknown as Part;
      });

      await test.step('Check GET /api/part/{id}/ has no write-only fields', async () => {
        const response = await parts.get(created.pk);
        expect(response.status()).toBe(200);
        const body = (await response.json()) as Record<string, unknown>;
        for (const field of PART_WRITE_ONLY_FIELDS) expect(body, `GET response contains ${field}`).not.toHaveProperty(field);
      });
    });
  });

  test.describe('Numeric and related-record limits', () => {
    test('API-VAL-020: default_expiry of 0 is accepted', async ({ parts }) => {
      const response = await test.step('POST /api/part/ with default_expiry=0', async () => {
        return await parts.createInvalid({ name: uniqueName('pw-part'), default_expiry: 0 });
      });

      await test.step('Check the part is created and default_expiry is stored as 0', async () => {
        expect(response.status()).toBe(201);
        const created = (await response.json()) as Part;
        const stored = (await (await parts.get(created.pk)).json()) as { default_expiry: number };
        expect(stored.default_expiry).toBe(0);
      });
    });

    test('API-VAL-020: default_expiry of -1 is rejected', async ({ parts }) => {
      const name = uniqueName('pw-part');

      const response = await test.step('POST /api/part/ with default_expiry=-1', async () => {
        return await parts.createInvalid({ name, default_expiry: -1 });
      });

      await test.step('Check the request is rejected with 400 and no part was created', async () => {
        expect(response.status()).toBe(400);
        await expectPartsListed(await parts.listFiltered({ search: name }), []);
      });
    });

    test('API-VAL-021: supplier part SKU of 100 characters is accepted', async ({ parts, companies, supplierParts }) => {
      const { part, supplier } = await test.step('Setup: a supplier company and a purchaseable part', async () => {
        return {
          supplier: await companies.createOrFail(newCompany({ is_supplier: true })),
          part: await parts.createOrFail(newPart({ purchaseable: true })),
        };
      });
      const SKU = textOfLength(100);

      const response = await test.step('POST /api/company/part/ with a 100-character SKU', async () => {
        return await supplierParts.create(newSupplierPart(part.pk, supplier.pk, { SKU }));
      });

      await test.step('Check the supplier part is created with the SKU exactly as sent', async () => {
        expect(response.status()).toBe(201);
        const stored = await supplierParts.listOrFail({ part: part.pk });
        expect(stored.results.map((item) => item.SKU)).toEqual([SKU]);
      });
    });

    test('API-VAL-021: supplier part SKU of 101 characters is rejected', async ({ parts, companies, supplierParts }) => {
      const { part, supplier } = await test.step('Setup: a supplier company and a purchaseable part', async () => {
        return {
          supplier: await companies.createOrFail(newCompany({ is_supplier: true })),
          part: await parts.createOrFail(newPart({ purchaseable: true })),
        };
      });

      const response = await test.step('POST /api/company/part/ with a 101-character SKU', async () => {
        return await supplierParts.create(newSupplierPart(part.pk, supplier.pk, { SKU: textOfLength(101) }));
      });

      await test.step('Check the request is rejected with 400 and no supplier part was created', async () => {
        expect(response.status()).toBe(400);
        expect((await supplierParts.listOrFail({ part: part.pk })).count).toBe(0);
      });
    });
  });
});
