import type { APIResponse } from '@playwright/test';
import { checkPartShape, expectPartsListed } from '../src/checks';
import type { Part } from '../../shared/models';
import type { BomItemService } from '../../shared/services/bom-item.service';
import type { CompanyService } from '../../shared/services/company.service';
import type { OrderService } from '../../shared/services/order.service';
import type { PartService } from '../../shared/services/part.service';
import type { StockItemService } from '../../shared/services/stock-item.service';
import type { StockLocationService } from '../../shared/services/stock-location.service';
import type { SupplierPartService } from '../../shared/services/supplier-part.service';
import type { ManufacturerPart, SupplierPart } from '../src/models';
import { newCategory, newCompany, newManufacturerPart, newPart, newStockLocation, newSupplierPart, uniqueName } from '../src/test-data';
import { expect, test } from './fixtures';

type InactivePartContext = {
  parts: PartService;
  stockItems: StockItemService;
  stockLocations: StockLocationService;
  bomItems: BomItemService;
  companies: CompanyService;
  supplierParts: SupplierPartService;
  purchaseOrders: OrderService;
  salesOrders: OrderService;
};

/** API-REL-016 to 019 rows: each request that uses an inactive part, and how to count what it created. */
type InactivePartCase = {
  id: string;
  request: string;
  setupStep: string;
  arrange: (ctx: InactivePartContext, part: Part) => Promise<{ send: () => Promise<APIResponse>; count: () => Promise<number> }>;
};

const INACTIVE_PART_CASES: InactivePartCase[] = [
  {
    id: 'API-REL-016',
    request: 'POST /api/stock/',
    setupStep: 'Setup: stock location',
    arrange: async ({ stockLocations, stockItems }, part) => {
      const location = await stockLocations.createOrFail(newStockLocation());
      return {
        send: () => stockItems.create({ part: part.pk, quantity: 1, location: location.pk }),
        count: async () => (await stockItems.listOrFail({ part: part.pk })).count,
      };
    },
  },
  {
    id: 'API-REL-017',
    request: 'POST /api/bom/',
    setupStep: 'Setup: assembly part',
    arrange: async ({ parts, bomItems }, part) => {
      const assembly = await parts.createOrFail(newPart({ assembly: true }));
      return {
        send: () => bomItems.create({ part: assembly.pk, sub_part: part.pk, quantity: 1 }),
        count: async () => (await bomItems.listOrFail(assembly.pk)).count,
      };
    },
  },
  {
    id: 'API-REL-018',
    request: 'POST /api/order/po-line/',
    setupStep: 'Setup: supplier, supplier part for the inactive part, and a purchase order',
    arrange: async ({ companies, supplierParts, purchaseOrders }, part) => {
      const supplier = await companies.createOrFail(newCompany({ is_supplier: true }));
      const supplierPart = await supplierParts.createOrFail(newSupplierPart(part.pk, supplier.pk));
      const order = await purchaseOrders.createOrFail({ supplier: supplier.pk });
      return {
        send: () => purchaseOrders.createLine({ order: order.pk, part: supplierPart.pk, quantity: 1 }),
        count: async () => (await purchaseOrders.listLinesOrFail(order.pk)).count,
      };
    },
  },
  {
    id: 'API-REL-019',
    request: 'POST /api/order/so-line/',
    setupStep: 'Setup: customer and a sales order',
    arrange: async ({ companies, salesOrders }, part) => {
      const customer = await companies.createOrFail(newCompany({ is_customer: true, is_supplier: false }));
      const order = await salesOrders.createOrFail({ customer: customer.pk });
      return {
        send: () => salesOrders.createLine({ order: order.pk, part: part.pk, quantity: 1 }),
        count: async () => (await salesOrders.listLinesOrFail(order.pk)).count,
      };
    },
  },
];

// Manual cases: test-cases/api/relational-integrity.md

test.describe('Relational integrity', () => {
  test.use({ role: 'SUPERUSER' });

  test.describe('Category assignment', () => {
    test('API-REL-001: create a part in a category', async ({ parts, categories }) => {
      const category = await test.step('Setup: POST /api/part/category/', async () => {
        return await categories.createOrFail(newCategory());
      });

      const response = await test.step('POST /api/part/ with the category', async () => {
        return await parts.create(newPart({ category: category.pk }));
      });

      const created = await test.step('Check POST returns 201 with the category and its name', async () => {
        expect(response.status()).toBe(201);
        const body = (await response.json()) as Part;
        checkPartShape(body);
        expect(body.category).toBe(category.pk);
        expect(body.category_name).toBe(category.name);
        return body;
      });

      await test.step('Check GET /api/part/{id}/ returns the same category and name', async () => {
        const stored = await parts.getOrFail(created.pk);
        expect(stored.category).toBe(category.pk);
        expect(stored.category_name).toBe(category.name);
      });
    });

    test('API-REL-002: move a part to another category', async ({ parts, categories }) => {
      const { from, to, part } = await test.step('Setup: two categories and a part in the first', async () => {
        const from = await categories.createOrFail(newCategory());
        const to = await categories.createOrFail(newCategory());
        const part = await parts.createOrFail(newPart({ category: from.pk }));
        return { from, to, part };
      });

      const response = await test.step('PATCH /api/part/{id}/ with the second category', async () => {
        return await parts.update(part.pk, { category: to.pk });
      });

      await test.step('Check the part now has the second category and its name', async () => {
        expect(response.status()).toBe(200);
        const stored = await parts.getOrFail(part.pk);
        expect(stored.category).toBe(to.pk);
        expect(stored.category_name).toBe(to.name);
      });

      await test.step('Check GET /api/part/ lists the part under the second category and not the first', async () => {
        await expectPartsListed(await parts.listFiltered({ category: to.pk }), [part]);
        await expectPartsListed(await parts.listFiltered({ category: from.pk }), []);
      });
    });

    test('API-REL-003: remove a part\'s category', async ({ parts, categories }) => {
      const part = await test.step('Setup: a part in a category', async () => {
        const category = await categories.createOrFail(newCategory());
        return await parts.createOrFail(newPart({ category: category.pk }));
      });

      const response = await test.step('PATCH /api/part/{id}/ with category=null', async () => {
        return await parts.update(part.pk, { category: null });
      });

      await test.step('Check the category is null and category_name is absent', async () => {
        expect(response.status()).toBe(200);
        const readResponse = await parts.get(part.pk);
        expect(readResponse.status()).toBe(200);
        const stored = (await readResponse.json()) as Part;
        checkPartShape(stored);
        expect(stored.category).toBeNull();
        expect(stored).not.toHaveProperty('category_name');
      });
    });

    // OQ-REL-01 (confirmed by the user): both create and move are rejected with a `category` error.
    test('API-REL-004: assign a part to a structural category', async ({ parts, categories }) => {
      const { structural, part } = await test.step('Setup: a structural category S and a part P with no category', async () => {
        return {
          structural: await categories.createOrFail(newCategory({ structural: true })),
          part: await parts.createOrFail(newPart()),
        };
      });
      const name = uniqueName('pw-part');

      const createResponse = await test.step('POST /api/part/ with category S', async () => {
        return await parts.create(newPart({ name, category: structural.pk }));
      });
      const moveResponse = await test.step('PATCH /api/part/{P}/ with category S', async () => {
        return await parts.update(part.pk, { category: structural.pk });
      });

      await test.step('Check both return 400 with a category error, no part is in S, and P has no category', async () => {
        expect(createResponse.status()).toBe(400);
        expect(await createResponse.json()).toHaveProperty('category');
        expect(moveResponse.status()).toBe(400);
        expect(await moveResponse.json()).toHaveProperty('category');
        await expectPartsListed(await parts.listFiltered({ category: structural.pk }), []);
        expect((await parts.getOrFail(part.pk)).category).toBeNull();
      });
    });

    test('API-REL-005: assign a part to a child of a structural category', async ({ parts, categories }) => {
      const child = await test.step('Setup: a structural category with a non-structural child', async () => {
        const structural = await categories.createOrFail(newCategory({ structural: true }));
        return await categories.createOrFail(newCategory({ parent: structural.pk, structural: false }));
      });

      const response = await test.step('POST /api/part/ with the child category', async () => {
        return await parts.create(newPart({ category: child.pk }));
      });

      await test.step('Check POST returns 201 and the part is in the child category', async () => {
        expect(response.status()).toBe(201);
        const body = (await response.json()) as Part;
        checkPartShape(body);
        expect(body.category).toBe(child.pk);
      });
    });
  });

  test.describe('Default locations', () => {
    test('API-REL-006: set a part\'s default location', async ({ parts, stockLocations }) => {
      const { part, location } = await test.step('Setup: a stock location and a part', async () => {
        return {
          part: await parts.createOrFail(newPart()),
          location: await stockLocations.createOrFail(newStockLocation()),
        };
      });

      const response = await test.step('PATCH /api/part/{id}/ with default_location', async () => {
        return await parts.update(part.pk, { default_location: location.pk });
      });

      await test.step('Check GET /api/part/{id}/ returns the location', async () => {
        expect(response.status()).toBe(200);
        const stored = await parts.getOrFail(part.pk);
        expect(stored.default_location).toBe(location.pk);
      });
    });

    test('API-REL-007: clear a part\'s default location', async ({ parts, stockLocations }) => {
      const part = await test.step('Setup: a part with a default location', async () => {
        const location = await stockLocations.createOrFail(newStockLocation());
        return await parts.createOrFail(newPart({ default_location: location.pk }));
      });

      const response = await test.step('PATCH /api/part/{id}/ with default_location=null', async () => {
        return await parts.update(part.pk, { default_location: null });
      });

      await test.step('Check GET /api/part/{id}/ returns a null default location', async () => {
        expect(response.status()).toBe(200);
        const stored = await parts.getOrFail(part.pk);
        expect(stored.default_location).toBeNull();
      });
    });

    // OQ-REL-02 (confirmed by the user): only the part's own category counts; a parent's default is not inherited.
    test('API-REL-008: category default location seen from a part', async ({ stockLocations, categories, parts }) => {
      const { location, inCategory, inChild } = await test.step('Setup: location L, category C with default L, child D without one, a part in each', async () => {
        const location = await stockLocations.createOrFail(newStockLocation());
        const category = await categories.createOrFail(newCategory({ default_location: location.pk }));
        const child = await categories.createOrFail(newCategory({ parent: category.pk }));
        return {
          location,
          inCategory: await parts.createOrFail(newPart({ category: category.pk })),
          inChild: await parts.createOrFail(newPart({ category: child.pk })),
        };
      });

      await test.step('GET /api/part/{id}/ for the part in C shows L and no own default_location', async () => {
        const stored = await parts.getOrFail(inCategory.pk);
        expect(stored.category_default_location).toBe(location.pk);
        expect(stored.default_location).toBeNull();
      });

      await test.step('GET /api/part/{id}/ for the part in D shows null (not inherited from C)', async () => {
        const stored = await parts.getOrFail(inChild.pk);
        expect(stored.category_default_location).toBeNull();
        expect(stored.default_location).toBeNull();
      });
    });
  });

  test.describe('Supplier linkage', () => {
    test('API-REL-009: link a supplier part to a purchaseable part', async ({ parts, companies, supplierParts }) => {
      const { part, supplier } = await test.step('Setup: a supplier company and a purchaseable part', async () => {
        return {
          supplier: await companies.createOrFail(newCompany({ is_supplier: true })),
          part: await parts.createOrFail(newPart({ purchaseable: true })),
        };
      });
      const input = newSupplierPart(part.pk, supplier.pk);

      const response = await test.step('POST /api/company/part/ with part, supplier, and SKU', async () => {
        return await supplierParts.create(input);
      });

      const created = await test.step('Check POST returns 201 with the submitted values', async () => {
        expect(response.status()).toBe(201);
        const body = (await response.json()) as SupplierPart;
        expect(body).toMatchObject({ pk: expect.any(Number), part: part.pk, supplier: supplier.pk, SKU: input.SKU });
        return body;
      });

      await test.step('Check GET /api/company/part/?part={id} lists exactly this supplier part', async () => {
        const list = await supplierParts.listOrFail({ part: part.pk });
        expect(list.count).toBe(1);
        expect(list.results.map(({ pk }) => pk)).toEqual([created.pk]);
      });
    });

    test('API-REL-010: create a part with initial supplier data', async ({ parts, companies, supplierParts }) => {
      const supplier = await test.step('Setup: a supplier company', async () => {
        return await companies.createOrFail(newCompany({ is_supplier: true }));
      });
      const sku = uniqueName('pw-sku');

      const response = await test.step('POST /api/part/ with purchaseable=true and initial_supplier', async () => {
        return await parts.create(newPart({ purchaseable: true, initial_supplier: { supplier: supplier.pk, sku } }));
      });

      const created = await test.step('Check POST returns 201', async () => {
        expect(response.status()).toBe(201);
        const body = (await response.json()) as Part;
        supplierParts.trackPart(body.pk);
        return body;
      });

      await test.step('Check GET /api/company/part/?part={id} lists one supplier part with the supplier and SKU', async () => {
        const list = await supplierParts.listOrFail({ part: created.pk });
        expect(list.count).toBe(1);
        expect(list.results[0]).toMatchObject({ part: created.pk, supplier: supplier.pk, SKU: sku });
      });
    });

    // OQ-REL-03 (confirmed by the user): rejected on `part`; the "object does not exist" wording is a minor finding, so it is not asserted.
    test('API-REL-011: link a supplier part to a non-purchaseable part', async ({ parts, companies, supplierParts }) => {
      const { part, supplier } = await test.step('Setup: a supplier company and a part with purchaseable=false', async () => {
        return {
          supplier: await companies.createOrFail(newCompany({ is_supplier: true })),
          part: await parts.createOrFail(newPart({ purchaseable: false })),
        };
      });

      const response = await test.step('POST /api/company/part/ with part, supplier, and SKU', async () => {
        return await supplierParts.create(newSupplierPart(part.pk, supplier.pk));
      });

      await test.step('Check 400 with a part error and the test-owned supplier has no supplier parts', async () => {
        expect(response.status()).toBe(400);
        expect(await response.json()).toHaveProperty('part');
        // `?part=` also rejects a non-purchaseable part with 400, so the check goes through the test-owned supplier.
        expect((await supplierParts.listOrFail({ supplier: supplier.pk })).count).toBe(0);
      });
    });
    // OQ-REL-04 (confirmed by the user): rejected on `supplier`; same misleading wording as OQ-REL-03, not asserted.
    test('API-REL-012: link a supplier part to a company that is not a supplier', async ({ parts, companies, supplierParts }) => {
      const { part, company } = await test.step('Setup: a company with is_supplier=false and a purchaseable part', async () => {
        return {
          company: await companies.createOrFail(newCompany({ is_supplier: false })),
          part: await parts.createOrFail(newPart({ purchaseable: true })),
        };
      });

      const response = await test.step('POST /api/company/part/ with the company as supplier', async () => {
        return await supplierParts.create(newSupplierPart(part.pk, company.pk));
      });

      await test.step('Check 400 with a supplier error and the part has no supplier parts', async () => {
        expect(response.status()).toBe(400);
        expect(await response.json()).toHaveProperty('supplier');
        expect((await supplierParts.listOrFail({ part: part.pk })).count).toBe(0);
      });
    });

    test('API-REL-013: link a supplier part to a manufacturer part', async ({ parts, companies, manufacturerParts, supplierParts }) => {
      const { part, manufacturer, supplier } = await test.step('Setup: a purchaseable part, a manufacturer, and a supplier', async () => {
        return {
          part: await parts.createOrFail(newPart({ purchaseable: true })),
          manufacturer: await companies.createOrFail(newCompany({ is_manufacturer: true })),
          supplier: await companies.createOrFail(newCompany({ is_supplier: true })),
        };
      });

      const manufacturerPart = await test.step('POST /api/company/part/manufacturer/ with part, manufacturer, and MPN', async () => {
        const response = await manufacturerParts.create(newManufacturerPart(part.pk, manufacturer.pk));
        expect(response.status()).toBe(201);
        return (await response.json()) as ManufacturerPart;
      });

      const supplierPart = await test.step('POST /api/company/part/ with manufacturer_part', async () => {
        const response = await supplierParts.create(newSupplierPart(part.pk, supplier.pk, { manufacturer_part: manufacturerPart.pk }));
        expect(response.status()).toBe(201);
        return (await response.json()) as SupplierPart;
      });

      await test.step('Check the supplier part links to the manufacturer part, and the part\'s manufacturer parts list contains it', async () => {
        expect(supplierPart.manufacturer_part).toBe(manufacturerPart.pk);
        const response = await manufacturerParts.list({ part: part.pk });
        expect(response.status()).toBe(200);
        const body = (await response.json()) as { results: ManufacturerPart[] };
        expect(body.results.map(({ pk }) => pk)).toContain(manufacturerPart.pk);
      });
    });

    test('API-REL-014: find a part by supplier SKU and manufacturer MPN', async ({ parts, companies, manufacturerParts, supplierParts }) => {
      const { part, sku, mpn } = await test.step('Setup: a purchaseable part with a manufacturer part and a supplier part', async () => {
        const part = await parts.createOrFail(newPart({ purchaseable: true }));
        const manufacturer = await companies.createOrFail(newCompany({ is_manufacturer: true }));
        const supplier = await companies.createOrFail(newCompany({ is_supplier: true }));
        const manufacturerPart = await manufacturerParts.createOrFail(newManufacturerPart(part.pk, manufacturer.pk));
        const supplierPart = await supplierParts.createOrFail(newSupplierPart(part.pk, supplier.pk, { manufacturer_part: manufacturerPart.pk }));
        return { part, sku: supplierPart.SKU, mpn: manufacturerPart.MPN ?? '' };
      });

      for (const [field, term] of [
        ['SKU', sku],
        ['MPN', mpn],
      ]) {
        const response = await test.step(`GET /api/part/ with search=${term}`, async () => {
          return await parts.listFiltered({ search: term });
        });

        await test.step(`Check the search by ${field} returns only the part`, async () => {
          await expectPartsListed(response, [part]);
        });
      }
    });

    // OQ-REL-05 (confirmed by the user): the part's supplier parts are deleted with it; the supplier company stays.
    test('API-REL-015: delete a part that has a supplier part', async ({ parts, companies, supplierParts }) => {
      const { part, supplier, supplierPart } = await test.step('Setup: an inactive purchaseable part with one supplier part', async () => {
        const supplier = await companies.createOrFail(newCompany({ is_supplier: true }));
        const part = await parts.createOrFail(newPart({ purchaseable: true }));
        const supplierPart = await supplierParts.createOrFail(newSupplierPart(part.pk, supplier.pk));
        expect((await parts.update(part.pk, { active: false })).status()).toBe(200);
        return { part, supplier, supplierPart };
      });

      const response = await test.step('DELETE /api/part/{id}/', async () => {
        return await parts.delete(part.pk);
      });

      await test.step('Check 204, the supplier part is gone (404), and the supplier company still exists', async () => {
        expect(response.status()).toBe(204);
        expect((await supplierParts.get(supplierPart.pk)).status()).toBe(404);
        expect((await companies.get(supplier.pk)).status()).toBe(200);
      });
    });
  });

  // OQ-REL-06 (confirmed by the user as a finding): the schema documents only 201, so any 4xx counts as a rejection.
  test.describe('Inactive parts', () => {
    for (const row of INACTIVE_PART_CASES) {
      test.fail(
        `${row.id}: ${row.request} for an inactive part is rejected`,
        { annotation: { type: 'issue', description: 'Application finding OQ-REL-06: the API accepts this request for an inactive part (201), while the UI hides inactive parts' } },
        async ({ parts, stockItems, stockLocations, bomItems, companies, supplierParts, purchaseOrders, salesOrders }) => {
          const ctx = { parts, stockItems, stockLocations, bomItems, companies, supplierParts, purchaseOrders, salesOrders };

          const part = await test.step('Setup: inactive part with Component, Purchaseable and Salable on', async () => {
            return await parts.createOrFail(newPart({ active: false, component: true, purchaseable: true, salable: true }));
          });

          const attempt = await test.step(row.setupStep, async () => row.arrange(ctx, part));

          const response = await test.step(row.request, async () => attempt.send());

          await test.step('Check a 4xx status and that no record was created', async () => {
            expect(response.status()).toBeGreaterThanOrEqual(400);
            expect(response.status()).toBeLessThan(500);
            expect(await attempt.count()).toBe(0);
          });
        },
      );
    }
  });
});
