# Defects

Application, API contract, and documentation defects found while testing the InvenTree Parts module. Each one was observed on a test instance and confirmed by the user as incorrect behavior (see "Observed Behavior Needs User Confirmation" in `.github/copilot-instructions.md`). Open questions stay in their area files; this page lists only confirmed defects.

- **Version:** local InvenTree 1.6.3, API 561 (Docker), unless stated otherwise.
- **Severity:** P1 = data integrity or core workflow failure, P2 = important with a workaround, P3 = low impact.
- **Status:** `Open` = reproduced on the version above and not reported upstream yet. No upstream issues have been filed.
- **Automated:** tests marked `test.fail` assert the documented behavior and carry an `issue` annotation; they are expected to fail until InvenTree is fixed and turn red once it is.

## Summary

| ID | Title | Severity | Kind | Linked cases / OQ | Automated test | Status |
|---|---|---|---|---|---|---|
| DEF-01 | Category tree corrupted when top-level categories are created in parallel | P1 | Application | OQ: none; seen in API-CAT-010, API-LIST-008 | None (needs parallel load) | Open |
| DEF-02 | API accepts stock, BOM, purchase order, and sales order records for an inactive part | P2 | Application | API-REL-016 to 019, OQ-REL-06 | `parts.relations.spec.ts` (`test.fail`, 4 tests) | Open |
| DEF-03 | Inactive part's own Stock tab still adds stock | P2 | Application | UI-ATTR-013, OQ-ATTR-05 | `part.attributes.spec.ts` (`test.fail`) | Open |
| DEF-04 | Part list without `limit` returns a bare array instead of the paginated object | P2 | API contract | API-LIST-004, OQ-LIST-02 | `parts.list.spec.ts` (`test.fail`) | Open |
| DEF-05 | `category=null` returns categorized parts unless `cascade=false` | P2 | Application | API-LIST-009, OQ-LIST-06 | `parts.list.spec.ts` (`test.fail`) | Open |
| DEF-06 | Category `DELETE` requires a request body the schema does not document | P2 | API contract | API-CAT-014, OQ-ACAT-03 | `categories.crud.spec.ts` (`test.fail`) | Open |
| DEF-07 | Malformed JSON body returns 500 instead of 400 | P3 | Application | API-EDGE-007, OQ-EDGE-02 | `parts.edge.spec.ts` (`test.fail`) | Open |
| DEF-08 | Misleading "object does not exist" error for an existing part or company | P3 | Application | API-REL-011, 012, OQ-REL-03, 04 | Not asserted (message text) | Open |
| DEF-09 | Schema marks `category_name` as required, but it is omitted for parts without a category | P3 | Documentation | API-PART-001, 005, 007, 009, OQ-PART-06 | Handled in `src/checks.ts` | Open |
| DEF-10 | Schema says "Locked parts cannot be edited", but locked parts can be edited | P3 | Documentation | API-EDGE-013, OQ-EDGE-05 | API-EDGE-013 asserts the actual behavior | Open |
| DEF-11 | `created_after` / `created_before` are described as "Updated after" / "Updated before" | P3 | Documentation | API-LIST-014, OQ-LIST-04 | API-LIST-014 asserts the actual behavior | Open |
| DEF-12 | Demo server returns `pricing_min` / `pricing_max` as numbers and `IPN` as `null`, unlike the schema | P3 | Documentation | API-PART-007, OQ-PART-07 | Handled in `src/checks.ts` | Open |
| DEF-13 | Non-staff user with Part add and change can import parts | P2 | Application (permissions) | UI-IMPORT-008, OQ-CREATE-06 | `part.create.spec.ts` (`test.fail`, role `ENGINEER`) | Open |
| DEF-14 | Unknown category in an import row is reported as "Expected pk value, received str" | P3 | Application (error message) | UI-IMPORT-007, OQ-CREATE-05 | Not asserted (message text); UI-IMPORT-007 checks the row error | Open |

## Details

### DEF-01: Category tree corrupted when top-level categories are created in parallel
- **Severity / kind:** P1, application (data integrity).
- **Steps:** Run the full API suite with `WORKERS=3` against one instance, so several workers create top-level categories at the same time.
- **Expected:** Each top-level category gets its own tree; category requests and filters keep working.
- **Actual:** In 1 of 2 runs, API-CAT-010 `PUT` returned 500 and API-LIST-008 `cascade=false` also returned the child category's parts. The `inventree-server` log shows `RuntimeError: More than one root node with tree_id 38. That's invalid, do a full rebuild.` and `Failed to rebuild tree <38> for PartCategory`. Both tests pass when run alone (3 of 3).
- **Impact:** Concurrent users or integrations creating categories can corrupt the category tree. The local database may still hold the damaged entry; no repair was run.
- **Workaround:** One worker per instance (`WORKERS=1`), or more shards, because each CI shard has its own database.
- **Confirmed:** by the user, 2026-10-31.

### DEF-02: API accepts stock, BOM, purchase order, and sales order records for an inactive part
- **Severity / kind:** P2, application.
- **Steps:** With a part created as `active: false`: `POST /api/stock/` (`part`, `quantity: 1`, `location`); `POST /api/bom/` with the part as `sub_part`; `POST /api/order/po-line/` with the part's supplier part; `POST /api/order/so-line/` with the part.
- **Expected:** Each request is rejected (4xx; the schema documents only 201, so no code is specified) and nothing is created. `docs:part/#active-parts`: an inactive part is "not available for many actions".
- **Actual:** All four return 201 and create the record. The UI part pickers for the same forms hide inactive parts (UI-ATTR-013), so the API and UI disagree.
- **Confirmed:** by the user, 2026-10-31.

### DEF-03: Inactive part's own Stock tab still adds stock
- **Severity / kind:** P2, application.
- **Steps:** Open an inactive part > *Stock* tab > *Add Stock Item*, enter a quantity, and submit.
- **Expected:** No stock item can be created for an inactive part (the action is hidden or the save is rejected), as in every other part picker.
- **Actual:** The form opens with the part pre-filled (marked INACTIVE) and saves the stock item (201).
- **Confirmed:** by the user, 2026-10-31.

### DEF-04: Part list without `limit` returns a bare array instead of the paginated object
- **Severity / kind:** P2, API contract.
- **Steps:** `GET /api/part/` without `limit`.
- **Expected:** The documented paginated object (`count`, `next`, `previous`, `results`); the schema marks `limit` as required.
- **Actual:** A bare JSON array of parts. Clients that follow the schema fail to parse it.
- **Confirmed:** by the user, 2026-10-30.

### DEF-05: `category=null` returns categorized parts unless `cascade=false`
- **Severity / kind:** P2, application.
- **Steps:** `GET /api/part/?category=null&search=<token>&limit=<n>`, where the token matches one part with a category and one without.
- **Expected:** Only parts without a category (schema: "Filter by numeric category ID or the literal 'null'").
- **Actual:** Both parts are returned. In the local source (`part/api.py`, `filter_category`), `null` filters to uncategorized parts only when `cascade=false`; `cascade` defaults to true.
- **Confirmed:** by the user, 2026-10-30.

### DEF-06: Category `DELETE` requires a request body the schema does not document
- **Severity / kind:** P2, API contract.
- **Steps:** `DELETE /api/part/category/{id}/` on an empty category, with no body.
- **Expected:** 204, as documented; the schema lists no request body.
- **Actual:** 400, because `delete_parts` and `delete_child_categories` are required in the body. With both flags the delete returns 204.
- **Confirmed:** by the user, 2026-10-30.

### DEF-07: Malformed JSON body returns 500 instead of 400
- **Severity / kind:** P3, application (error handling).
- **Steps:** `POST /api/part/` with `Content-Type: application/json` and the body `{"name": `.
- **Expected:** 400 with a parse error, as for other invalid input (API-EDGE-008, 009).
- **Actual:** 500 with `{"error": "AttributeError", ...}`.
- **Confirmed:** by the user, 2026-10-30.

### DEF-08: Misleading "object does not exist" error for an existing part or company
- **Severity / kind:** P3, application (error message).
- **Steps:** `POST /api/company/part/` with a part that has `purchaseable: false` (API-REL-011), or with a company that has `is_supplier: false` as `supplier` (API-REL-012).
- **Expected:** 400 with a message that names the real cause (the part is not purchaseable, or the company is not a supplier).
- **Actual:** 400 with `Invalid pk "<id>" - object does not exist.`, although the record exists. The rejection itself is correct.
- **Confirmed:** by the user, 2026-10-31.

### DEF-09: Schema marks `category_name` as required, but it is omitted for parts without a category
- **Severity / kind:** P3, documentation (API 561 schema).
- **Actual:** A part with no category has no `category_name` key. The schema marks every read-only field as required by default (drf-spectacular).
- **Confirmed:** by the user as intended server behavior with a schema defect, 2026-10-29.

### DEF-10: Schema says "Locked parts cannot be edited", but locked parts can be edited
- **Severity / kind:** P3, documentation.
- **Actual:** `PATCH` and `PUT` on a locked part return 200 and store the changes; the part stays locked. `docs:part/#locked-parts` lists only delete, BOM, and parameter restrictions, which matches the server.
- **Confirmed:** by the user as intended server behavior with a schema defect, 2026-10-31.

### DEF-11: `created_after` / `created_before` are described as "Updated after" / "Updated before"
- **Severity / kind:** P3, documentation.
- **Actual:** Both filters take `YYYY-MM-DD`, compare with `creation_date`, and are exclusive; an invalid date returns 400. The schema text and the missing date format are wrong or incomplete.
- **Confirmed:** by the user as intended server behavior with a schema defect, 2026-10-31.

### DEF-12: Demo server returns `pricing_min` / `pricing_max` as numbers and `IPN` as `null`, unlike the schema
- **Severity / kind:** P3, documentation.
- **Version:** demo `https://demo.inventree.org`, InvenTree 1.7.0 dev, API 567. Local 1.6.3 matches the schema.
- **Actual:** Some parts return `pricing_min` / `pricing_max` as JSON numbers (for example `5.25`) and `IPN: null`; the API 561 and 567 schemas define decimal strings or null, and a non-nullable string.
- **Confirmed:** by the user as intended server behavior with a schema defect, 2026-10-30.

### DEF-13: Non-staff user with Part add and change can import parts
- **Severity / kind:** P2, application (permissions).
- **Steps:** Log in as a non-staff, non-superuser user whose group has Part view, add, and change (and view on categories, locations, and stock). Open *Parts* > *Add Parts* > *Import from File*, upload a one-row parts CSV, and submit.
- **Expected:** The user cannot import. `docs:concepts/data_import/#required-permissions`: "The user must be a *staff* user, and have the `change` permission for the model in question."
- **Actual:** *Import from File* is offered and `POST /api/importer/session/` returns 201, so the import session is created. In the local source, the frontend hides the *Add Parts* menu only without Part add (`PartCreationMenu.tsx`), and the backend uses `is_staff` only to allow access to other users' sessions (`importer/api.py`).
- **Impact:** Non-staff users can bulk-load parts, which the documentation reserves for staff.
- **Confirmed:** by the user, 2026-10-31.

### DEF-14: Unknown category in an import row is reported as "Expected pk value, received str"
- **Severity / kind:** P3, application (error message).
- **Steps:** Import a parts CSV (`name`, `description`, `category`) with one row whose category name exists and one whose category name does not; accept the suggested column mapping.
- **Expected:** The invalid row's error says the category was not found (related data must already exist: `docs:concepts/data_import/#mapping-to-existing-data`).
- **Actual:** The row is correctly marked invalid, but the error is `category: Incorrect type. Expected pk value, received str.`, although a category given by name is accepted when it exists. The message points to the wrong cause.
- **Confirmed:** by the user, 2026-10-31.

## Environment Issues (not product defects)

| Issue | Seen | Handling |
|---|---|---|
| UI sessions drop with 2+ parallel browsers: `/api/user/me/` gets no response and the page falls back to the login screen. | Local Docker instance on a developer machine (Run B) | Use `WORKERS=1` if logouts appear; see `automation/ui/README.md`. |
| Part `DELETE` returned 500 twice during parallel cleanup; a retry returned 204. | Local, parallel API run | Not reproduced in later runs. |

## Pending Confirmation

Not yet confirmed as defects, so not listed above: OQ-ACAT-07 (category delete with `delete_parts=true` removes active parts, while `DELETE /api/part/{id}/` rejects an active part), in [categories-crud.md](api/categories-crud.md).
