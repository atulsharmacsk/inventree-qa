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
| A | `/api-automation Parts CRUD` | tests/parts.crud.spec.ts | API-PART-001, 002, 005, 007, 008, 009, 010; fixme: 003 (OQ-PART-03), 011 (OQ-PART-02) | `PartService`, `CategoryService`, part schema checks | Done (16 passed, 2 skipped) |
| B | `/api-automation Part Categories CRUD` | tests/categories.crud.spec.ts | API-CAT-001, 002, 003, 004, 005, 007, 008, 009, 010, 011, 012; fixme: 013 ×2 (OQ-ACAT-02), 014, 015 (OQ-ACAT-03), 016 (OQ-ACAT-01) | `CategoryService` get, list, tree, update, replace, delete; category, category list, and category tree schemas | Implemented; typecheck passed. API-CAT-003 reviewed and passed (2026-10-30); other cases not yet run against the instance |
| C | `/api-automation Field-level validation` | tests/parts.validation.spec.ts | API-VAL-005 (×5 fields), 008 (×3 fields), 011, 019; fixme: 001, 002, 004, 006, 007, 009, 010, 013, 015, 020, 021 (OQ-VAL-01), 003 (OQ-VAL-03), 008 `icon` (OQ-VAL-04), 012, 014 (OQ-VAL-05), 016, 017, 018 (OQ-VAL-02) | `textOfLength`, `PART_TEXT_LIMITS`, `CATEGORY_TEXT_LIMITS`, `PART_WRITE_ONLY_FIELDS`; `Part.revision`/`keywords` and `NewPart.revision`/`copy_category_parameters` in shared models | Done (2026-10-30, LOCALHOST 1.6.3): 10 passed, 18 fixme |
| D | `/api-automation Parts list` | tests/parts.list.spec.ts | API-LIST-001, 002, 005, 006, 007, 008, 010, 011, 012, 013, 016; fixme: 003 (OQ-LIST-01), 004 (OQ-LIST-02), 009 (OQ-LIST-06), 014 (OQ-LIST-04), 015 (OQ-LIST-03) | `PartService.listFiltered`, `PartFilters`, `expectPartsListed`, `stockItems` and `stockLocations` fixtures, `newStockItem`, `newStockLocation` | Done (2026-10-30, LOCALHOST 1.6.3): 15 passed, 0 failed, 5 fixme (API-LIST-009 blocked by OQ-LIST-06) |
| E | `/api-automation Relational integrity` | tests/parts.relations.spec.ts | API-REL-001, 002, 003, 005, 006, 007, 009, 010, 013, 014; fixme: 004 (OQ-REL-01), 008 (OQ-REL-02), 011 (OQ-REL-03), 012 (OQ-REL-04), 015 (OQ-REL-05) | `CompanyService`, `SupplierPartService`, `ManufacturerPartService` (API-only, in `src/services/`), `stockLocations` fixture, `default_location` and `initial_supplier` on part models | Done (2026-10-30, LOCALHOST 1.6.3): 10 passed, 0 failed, 5 fixme |
| F | `/api-automation Edge cases` | tests/parts.edge.spec.ts | API-EDGE-012 (`fixme`: runs only where `PART_ENABLE_LOCKING` is off; the body is kept); fixme: 001 to 004 (OQ-EDGE-01), 007 to 009 (OQ-EDGE-02), 010 (OQ-EDGE-03), 011 (OQ-EDGE-04), 013 (OQ-EDGE-05), 014 (OQ-CREATE-08), 015 (OQ-EDGE-06); not automated: 005, 006 (need a view-only user) | The credential-free request fixture is not added yet: every unauthenticated case is blocked by OQ-EDGE-01 | Done (2026-10-30, LOCALHOST 1.6.3): 0 passed, 0 failed, 13 fixme |
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
