# API Automation Plan

Run order for the API automation phase (`/api-automation`). Each run automates the automation candidates of one manual area from [api-manual-tests.md](api-manual-tests.md). Project: `automation/api/` (Playwright Test, TypeScript). Rules: [playwright-tests.instructions.md](../.github/instructions/playwright-tests.instructions.md).

## Prerequisite

An area can be automated only after its manual file is `Drafted` in the index. Manual runs, in order:

| # | Command | File | Prefix | Main schema page | Functional page | Status |
|---|---|---|---|---|---|---|
| 1 | `/api-manual-tests Parts CRUD` | api/parts-crud.md | API-PART | api/schema/part/ | part/, part/create/ | Done |
| 2 | `/api-manual-tests Part Categories CRUD` | api/categories-crud.md | API-CAT | api/schema/part/ | part/#part-category | Done |
| 3 | `/api-manual-tests Field-level validation` | api/field-validation.md | API-VAL | api/schema/part/ | part/views/ (fields) | Done (21 cases, 5 OQs) |
| 4 | `/api-manual-tests Parts list` | api/parts-list.md | API-LIST | api/schema/part/ | part/#part-category (filtering) | Done |
| 5 | `/api-manual-tests Relational integrity` | api/relational-integrity.md | API-REL | api/schema/part/, stock/, company/, bom/, order/ | part/, part/create/#supplier-options, part/#active-parts | Done |
| 6 | `/api-manual-tests Edge cases` | api/edge-cases.md | API-EDGE | api/schema/part/, auth/ | part/ (locked parts), part/create/ (permissions) | Done |

## Automation Runs

| # | Command | Spec file | Cases | New layers expected | Status |
|---|---|---|---|---|---|
| A | `/api-automation Parts CRUD` | tests/parts.crud.spec.ts | API-PART-001, 002, 003 (×2 quantities), 005, 007, 008, 009, 010 (×10 flags), 011 | `PartService`, `CategoryService`, part schema checks | Done; all cases run (OQ-PART-03 resolved 2026-10-31) |
| B | `/api-automation Part Categories CRUD` | tests/categories.crud.spec.ts | API-CAT-001 to 016; expected failure (`test.fail`): 014 without a body (application finding, OQ-ACAT-03) | `CategoryService` get, list, tree, update, replace, delete; category, category list, and category tree schemas | Done; all cases run (OQ-ACAT-02, 06 resolved 2026-10-31) |
| C | `/api-automation Field-level validation` | tests/parts.validation.spec.ts | API-VAL-001 to 021 (API-VAL-008 `icon` is a format check) | `textOfLength`, `PART_TEXT_LIMITS`, `CATEGORY_TEXT_LIMITS`, `PART_WRITE_ONLY_FIELDS`; `createInvalid`, `updateInvalid`, `replaceInvalid` on `PartService` and `CategoryService`; `Part.revision`/`keywords`/`minimum_stock` and `NewPart.revision`/`copy_category_parameters` in shared models | Done; all cases run (OQ-VAL-03, 04 resolved 2026-10-31) |
| D | `/api-automation Parts list` | tests/parts.list.spec.ts | API-LIST-001 to 016; expected failures (`test.fail`): 004 (OQ-LIST-02), 009 (OQ-LIST-06) | `PartService.listFiltered`, `PartFilters`, `expectPartsListed`, `stockItems` and `stockLocations` fixtures, `newStockItem`, `newStockLocation` | Done; all cases run (OQ-LIST-01, 03, 04 resolved 2026-10-31) |
| E | `/api-automation Relational integrity` | tests/parts.relations.spec.ts | API-REL-001 to 019 | `ManufacturerPartService` (API-only, in `src/services/`); `CompanyService`, `SupplierPartService`, `OrderService` (shared with UI, in `shared/services/`); `stockLocations`, `bomItems`, `purchaseOrders`, `salesOrders` fixtures; `default_location` and `initial_supplier` on part models | Done; API-REL-001 to 015 pass, API-REL-016 to 019 are expected failures (OQ-REL-06 application finding, 2026-10-31) |
| F | `/api-automation Edge cases` | tests/parts.edge.spec.ts | API-EDGE-001 to 004, 007 to 011, 013, 014 (duplicates allowed), 015; expected failure (`test.fail`): 007 (OQ-EDGE-02); `settings` project (LOCALHOST only, `tests/parts.settings.spec.ts`): 012 (locking off), 014 duplicates-not-allowed rows (×2); not automated: 005, 006 (need a view-only user) | `partsWithAuthorization` and `revokedToken` fixtures (credential-free and bad-token requests), `PartService.deleteList`, `PartService.createRawJson` | Done (OQ-EDGE-04, 05, 06 resolved 2026-10-31) |
| G | `/review-and-correct` | - | All | - | After each run, or once at the end |

## What Each Automation Run Does

1. Reads the area file and the index's Automation Candidates list; blocked candidates become `test.fixme('<ID>: ... (blocked by OQ-...)')`.
2. Verifies endpoints, parameters, and status codes against the schema category page and the local `/api/schema/` (for example, `limit` is required on list endpoints).
3. Adds or extends services, models, data factories, and schema checks; specs use only fixtures and `test.step`.
4. Runs `npm run typecheck` and the new spec, classifies failures (test defect, environment issue, application finding), and asks the user before treating observed behavior as expected.
5. Scans traces for secrets, then records corrections and results in the root `README.md`.

## Known Constraints

- The configured user is a superuser; permission-restricted cases (API-EDGE) need a separate test user or stay `fixme`.
- Test-owned data only; cleanup failures are reported as `cleanup` annotations.
- Schema gap OQ-PART-06 (`category_name` omitted for uncategorized parts) is handled in `src/checks.ts`.
