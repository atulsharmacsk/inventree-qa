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
| 5 | `/api-manual-tests Relational integrity` | api/relational-integrity.md | API-REL | api/schema/part/, stock/, company/ | part/, part/create/#supplier-options | Done |
| 6 | `/api-manual-tests Edge cases` | api/edge-cases.md | API-EDGE | api/schema/part/, auth/ | part/ (locked parts), part/create/ (permissions) | Done |

## Automation Runs

| # | Command | Spec file | Cases | New layers expected | Status |
|---|---|---|---|---|---|
| A | `/api-automation Parts CRUD` | tests/parts.crud.spec.ts | API-PART-001, 002, 005, 007, 008, 009, 010, 011; fixme: 003 (OQ-PART-03) | `PartService`, `CategoryService`, part schema checks | Done (2026-10-30, LOCALHOST 1.6.3): 17 passed, 1 skipped |
| B | `/api-automation Part Categories CRUD` | tests/categories.crud.spec.ts | API-CAT-001, 002, 003, 004, 005, 007, 008, 009, 010, 011, 012, 014 (with the required flags), 016; fixme: 013 ×2 (OQ-ACAT-02), 014 without a body (application finding, OQ-ACAT-03), 015 (OQ-ACAT-06) | `CategoryService` get, list, tree, update, replace, delete; category, category list, and category tree schemas | Done (2026-10-30, LOCALHOST 1.6.3): API-CAT-016 and API-CAT-014 (with flags) added and passing; 13 passed, 4 fixme in the spec |
| C | `/api-automation Field-level validation` | tests/parts.validation.spec.ts | API-VAL-001, 002, 004, 005 (×5 fields), 006 (×6 fields), 007, 008 (×3 fields), 009 (×4 fields), 010 (×4 rows), 011, 012 (×4 fields), 013 (×5 fields), 014 (×3 fields), 015 (×3 fields), 016, 017, 018, 019, 020 (×2 rows), 021 (×2 rows); fixme: 003 (OQ-VAL-03), 008 `icon` (OQ-VAL-04) | `textOfLength`, `PART_TEXT_LIMITS`, `CATEGORY_TEXT_LIMITS`, `PART_WRITE_ONLY_FIELDS`; `createInvalid`, `updateInvalid`, `replaceInvalid` on `PartService` and `CategoryService`; `Part.revision`/`keywords`/`minimum_stock` and `NewPart.revision`/`copy_category_parameters` in shared models | Done (2026-10-30, LOCALHOST 1.6.3): 50 passed, 2 fixme in the spec (OQ-VAL-01 resolved: 400; OQ-VAL-02 resolved: read-only fields ignored; OQ-VAL-05 resolved: null handling) |
| D | `/api-automation Parts list` | tests/parts.list.spec.ts | API-LIST-001, 002, 005, 006, 007, 008, 010, 011, 012, 013, 016; fixme: 003 (OQ-LIST-01), 004 (application finding, OQ-LIST-02), 009 (application finding, OQ-LIST-06), 014 (OQ-LIST-04), 015 (OQ-LIST-03) | `PartService.listFiltered`, `PartFilters`, `expectPartsListed`, `stockItems` and `stockLocations` fixtures, `newStockItem`, `newStockLocation` | Done (2026-10-30, LOCALHOST 1.6.3): 15 passed, 0 failed, 5 fixme (API-LIST-009 blocked by OQ-LIST-06) |
| E | `/api-automation Relational integrity` | tests/parts.relations.spec.ts | API-REL-001, 002, 003, 005, 006, 007, 009, 010, 013, 014; fixme: 004 (OQ-REL-01), 008 (OQ-REL-02), 011 (OQ-REL-03), 012 (OQ-REL-04), 015 (OQ-REL-05) | `CompanyService`, `SupplierPartService`, `ManufacturerPartService` (API-only, in `src/services/`), `stockLocations` fixture, `default_location` and `initial_supplier` on part models | Done (2026-10-30, LOCALHOST 1.6.3): 10 passed, 0 failed, 5 fixme |
| F | `/api-automation Edge cases` | tests/parts.edge.spec.ts | API-EDGE-001, 002, 003 (×3 variants), 004, 008 (×4 fields), 009 (×3 rows), 010; fixme: 007 (application finding: malformed JSON returns 500, OQ-EDGE-02), 011 (OQ-EDGE-04), 012 (runs only where `PART_ENABLE_LOCKING` is off; the body is kept), 013 (OQ-EDGE-05), 014 (OQ-CREATE-08), 015 (OQ-EDGE-06); not automated: 005, 006 (need a view-only user) | `partsWithAuthorization` and `revokedToken` fixtures (credential-free and bad-token requests), `PartService.deleteList` | Done (2026-10-30, LOCALHOST 1.6.3): 14 passed, 6 fixme in the spec |
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
