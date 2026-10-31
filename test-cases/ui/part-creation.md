# UI Manual Tests: Part Creation

Covers part creation by manual entry, import from file, and import from supplier. Index, shared assumptions, and overall coverage: [ui-manual-tests.md](../ui-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`.

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:part/create/` | Add Parts menu, Create Part form, initial stock, supplier options, import from file, import from supplier |
| `docs:part/views/` | Part fields (IPN, Name, Units); *Stock* tab *New Stock Item* and *Parameters* tab (UI-CREATE-015) |
| `docs:part/` | Active default, units of measure, category part list and its columns (name, description, category, stock level) |
| `docs:concepts/units/` | Valid unit input and case sensitivity |
| `docs:concepts/data_import/` | Import permissions, session steps, field mapping, row processing, updates |
| `docs:concepts/parameters/` | Parameter templates and the *Create Parameter* form (UI-CREATE-015) |

None of these pages describes duplicate IPN handling. The local source (`common/setting/system.py`, read-only) was inspected only to name the controlling setting in OQ-CREATE-08; it is not used for expected results.

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-CR-01 | Parts are created or imported from the *Add Parts* dropdown above the parts table in the *Parts* view. | `docs:part/create/#part-creation` |
| REQ-CR-02 | Users without the "create" permission for the *Part* permission group do not see the *Add Parts* menu. | `docs:part/create/#part-creation` |
| REQ-CR-03 | *Create Part* opens the part creation form. Form errors must be fixed before the form can be submitted. | `docs:part/create/#create-part-form` |
| REQ-CR-04 | After a successful submit, the browser is redirected to the new part's detail page. | `docs:part/create/#create-part-form` |
| REQ-CR-05 | When the *Create Initial Stock* setting is enabled, the form has an extra section; checking *Create Initial Stock* creates an initial stock quantity for the new part. | `docs:part/create/#initial-stock` |
| REQ-CR-06 | For a *Purchaseable* part, the form offers supplier options; checking *Add Supplier Data* allows supplier part and manufacturer part information to be added. | `docs:part/create/#supplier-options` |
| REQ-CR-07 | IPN is not required. | `docs:part/views/#part-details` |
| REQ-CR-08 | The part name is a simple (unique) text label. | `docs:part/views/#part-details` |
| REQ-CR-09 | Part units must be valid real-world units. Units are case sensitive (`kg` is valid, `KG` is not). | `docs:part/#units-of-measure`, `docs:concepts/units/#case-sensitivity` |
| REQ-CR-10 | All parts are *Active* by default. | `docs:part/#active-parts` |
| REQ-CR-11 | A category's part list includes parts in that category and its sub-categories. | `docs:part/#part-category` |
| REQ-IM-01 | *Import from File* opens the data import wizard. | `docs:part/create/#import-from-file` |
| REQ-IM-02 | Importing requires a *staff* user with the `change` permission for the model. | `docs:concepts/data_import/#required-permissions` |
| REQ-IM-03 | The server suggests field mappings automatically; the user can adjust them. | `docs:concepts/data_import/#map-data-fields` |
| REQ-IM-04 | Related data (for example, part categories) must already exist and be mapped correctly. Multi-level import is not supported. | `docs:concepts/data_import/#mapping-to-existing-data` |
| REQ-IM-05 | Each row must be selected and confirmed before it is imported. Rows are in *Error*, *Pending*, or *Imported* state. Errors are shown, and rows can be corrected and re-processed, imported, or removed. | `docs:concepts/data_import/#process-data` |
| REQ-IM-06 | The session is complete once all rows are processed. | `docs:concepts/data_import/#import-completed` |
| REQ-IM-07 | Sessions are stored on the server; the user can leave and return later. Sessions are listed in the Admin Center. | `docs:concepts/data_import/#import-session-list` |
| REQ-IM-08 | Updating existing records is only possible from an Admin Center session with *Update Existing Records* selected, and requires the `ID` field to be mapped. Creating and updating cannot be mixed in one session. | `docs:concepts/data_import/#updating-existing-records` |
| REQ-IM-09 | With a supplier plugin installed and configured, *Import Part* in the Part Category view starts a wizard to confirm the category, select parameters, and create initial stock. | `docs:part/create/#import-from-supplier` |
| REQ-IM-10 | For an existing part, *Import supplier part* in the supplier panel imports a supplier part and its manufacturer part. | `docs:part/create/#import-a-supplier-part` |

## Manual Entry

### UI-CREATE-001: Create a part with valid details
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** Logged in as a user with Part "create" permission. A test-owned category exists.
- **Steps:**
  1. Open the *Parts* view.
  2. Open *Add Parts* and select *Create Part*.
  3. Enter a unique name, a description, and the test-owned category.
  4. Submit.
- **Expected result:** The form submits and the browser opens the new part's detail page, showing the entered name, description, and category.
- **Requirements:** REQ-CR-01, REQ-CR-03, REQ-CR-04
- **Source:** `docs:part/create/#create-part-form`

### UI-CREATE-002: New part is Active by default
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A part created by UI-CREATE-001.
- **Steps:**
  1. Open the new part's detail page.
  2. Check the part's *Active* status.
- **Expected result:** The part is *Active*.
- **Requirements:** REQ-CR-10
- **Source:** `docs:part/#active-parts`

### UI-CREATE-003: New part appears in its category and parent category
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned parent category with a sub-category. A new part created in the sub-category.
- **Steps:**
  1. Open the sub-category and view its parts list.
  2. Open the parent category and view its parts list.
- **Expected result:** The new part is listed in both categories.
- **Requirements:** REQ-CR-11
- **Source:** `docs:part/#part-category`

### UI-CREATE-004: Create a part without an IPN
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** Logged in with Part "create" permission.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Fill in the required fields and leave *IPN* empty.
  3. Submit.
- **Expected result:** The part is created and the detail page opens.
- **Requirements:** REQ-CR-07, REQ-CR-04
- **Source:** `docs:part/views/#part-details`

### UI-CREATE-005: Submit an empty form
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** Logged in with Part "create" permission.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Submit without entering any values.
- **Expected result:** The form is not submitted because *Name* is required, a form error is displayed, and no part is created.
- **Requirements:** REQ-CR-03
- **Source:** `docs:part/create/#create-part-form`; required fields: Local 1.6.3, confirmed by user (2026-10-29)
- **Note:** On the local instance only *Name* is marked required (OQ-CREATE-01, resolved).

### UI-CREATE-006: Fix form errors and resubmit
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** The form shows errors as in UI-CREATE-005.
- **Steps:**
  1. Correct the fields with errors.
  2. Submit.
- **Expected result:** The part is created and the detail page opens.
- **Requirements:** REQ-CR-03, REQ-CR-04
- **Source:** `docs:part/create/#create-part-form`

### UI-CREATE-007: Create a part with a valid physical unit
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** Logged in with Part "create" permission.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Fill in the required fields and set *Units* to `kg`.
  3. Submit.
- **Expected result:** The part is created with units `kg`.
- **Requirements:** REQ-CR-09
- **Source:** `docs:concepts/units/#case-sensitivity`

### UI-CREATE-008: Reject a unit with the wrong case
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** Logged in with Part "create" permission.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Fill in the required fields and set *Units* to `KG`.
  3. Submit.
- **Expected result:** The form is not submitted, a form error is displayed, and no part is created.
- **Requirements:** REQ-CR-09, REQ-CR-03
- **Source:** `docs:concepts/units/#case-sensitivity`

### UI-CREATE-009: Create a part with initial stock
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** The *Create Initial Stock* setting is enabled. A test-owned stock location exists.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Fill in the required fields.
  3. Check *Create Initial Stock* and enter a quantity and the location.
  4. Submit.
  5. Open the part's *Stock* tab.
- **Expected result:** The part is created, and a stock item with the entered quantity exists at the location.
- **Requirements:** REQ-CR-05
- **Source:** `docs:part/create/#initial-stock`

### UI-CREATE-010: Initial stock section when the setting is disabled
- **Priority:** P3
- **Type:** Negative
- **Preconditions:** The *Create Initial Stock* setting is disabled.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Look for the initial stock section.
- **Expected result:** See OQ-CREATE-02.
- **Requirements:** REQ-CR-05
- **Source:** `docs:part/create/#initial-stock`

### UI-CREATE-011: Create a Purchaseable part with supplier data
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned supplier company exists.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Fill in the required fields and mark the part *Purchaseable*.
  3. Check *Add Supplier Data* and enter the supplier part and manufacturer part details.
  4. Submit.
- **Expected result:** The part is created with the entered supplier part and manufacturer part.
- **Requirements:** REQ-CR-06
- **Source:** `docs:part/create/#supplier-options`

### UI-CREATE-012: Supplier options for a non-Purchaseable part
- **Priority:** P3
- **Type:** Negative
- **Preconditions:** Logged in with Part "create" permission.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Leave *Purchaseable* unchecked.
- **Expected result:** See OQ-CREATE-03.
- **Requirements:** REQ-CR-06
- **Source:** `docs:part/create/#supplier-options`

### UI-CREATE-013: No Add Parts menu without create permission
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** Logged in as a test user without Part "create" permission.
- **Steps:**
  1. Open the *Parts* view.
- **Expected result:** The *Add Parts* menu is not available.
- **Requirements:** REQ-CR-02
- **Source:** `docs:part/create/#part-creation`

### UI-CREATE-014: Create a part with a duplicate name
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** A test-owned part exists.
- **Steps:**
  1. Open *Add Parts* > *Create Part*.
  2. Enter the existing part's name and the other required fields.
  3. Submit.
- **Expected result:** See OQ-CREATE-04.
- **Requirements:** REQ-CR-08
- **Source:** `docs:part/views/#part-details`

### UI-CREATE-015: Cross-functional flow: create a part, add a parameter and stock, verify in the category
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** Logged in with Part "create" permission and permission to add parameters and stock. Test-owned data: a parent category with a sub-category, a stock location, and a parameter template (for example `Length` with units `mm`, model type *Part* or blank).
- **Steps:**
  1. Open the *Parts* view, open *Add Parts*, and select *Create Part*.
  2. Enter a unique name, a description, and the test-owned sub-category; submit.
  3. On the new part's detail page, open the *Parameters* tab and select *New Parameter*.
  4. Select the test-owned template, enter *Data* `25`, and submit.
  5. Open the *Stock* tab, select *New Stock Item*, enter a quantity of `10` and the test-owned location, and submit.
  6. Open the sub-category and find the part in its parts list.
  7. Open the parent category and find the part in its parts list.
- **Expected result:**
  1. After step 2, the browser opens the new part's detail page.
  2. After step 4, the *Parameters* tab lists the template with value `25`.
  3. After step 5, the *Stock* tab lists a stock item with quantity 10 at the test-owned location.
  4. In steps 6 and 7, the part is listed in both categories, and its row shows the name, description, sub-category, and a stock level of 10.
- **Requirements:** REQ-CR-01, REQ-CR-04, REQ-CR-11; REQ-TAB-03, REQ-TAB-20 in [part-detail-tabs.md](part-detail-tabs.md); REQ-CAT-04 in [part-categories.md](part-categories.md)
- **Source:** `docs:part/create/#create-part-form`, `docs:concepts/parameters/#create-parameter`, `docs:part/views/#new-stock-item`, `docs:part/#part-category`
- **Note:** End-to-end check across areas; detailed rules for each step stay in their own area files. Parameter values in the category's parametric view are covered by UI-CAT-010 (pending OQ-CAT-02).

### UI-CREATE-016: Create a part with an IPN that is already used
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** Logged in with Part "create" permission. A test-owned part `A` with a unique IPN. The IPN regular expression setting is empty. The duplicate IPN setting is in the state given in the table, and is restored afterwards (setting name and default: see OQ-CREATE-08).
- **Steps:** For each row:
  1. Open *Add Parts* > *Create Part*.
  2. Enter a new unique name and the same IPN as `A`.
  3. Submit.
  4. Search the *Parts* view for the IPN.

  | Duplicate IPN setting | Expected result |
  |---|---|
  | Duplicates allowed (`PART_ALLOW_DUPLICATE_IPN` on, as on the local instance) | The part is created; searching for the IPN lists both `A` and the new part |
  | Duplicates not allowed | See OQ-CREATE-08 (not yet observed) |
- **Expected result:** As in the table. In every row, part `A` is unchanged.
- **Requirements:** REQ-CR-07, REQ-CR-03
- **Source:** `docs:part/views/#part-details` (IPN field); behavior: OQ-CREATE-08 (duplicates-allowed row confirmed by user on local 1.6.3, 2026-10-31)
- **Note:** Required negative scenario (duplicate IPN). The API counterpart is API-EDGE-014 in [edge-cases.md](../api/edge-cases.md).

## Import from File

### UI-IMPORT-001: Open the import wizard from Add Parts
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** Logged in as a staff user with Part "create" and `change` permissions.
- **Steps:**
  1. Open the *Parts* view.
  2. Open *Add Parts* and select *Import from File*.
- **Expected result:** The data import wizard opens.
- **Requirements:** REQ-IM-01
- **Source:** `docs:part/create/#import-from-file`

### UI-IMPORT-002: Import parts from a valid file
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** Staff user with Part "create" and `change` permissions. A test-owned category exists. A CSV file with two rows of uniquely named parts that reference the category.
- **Steps:**
  1. Open *Add Parts* > *Import from File* and upload the file.
  2. Review the suggested field mappings and confirm them.
  3. Wait for the rows to load.
  4. Select and confirm both rows.
- **Expected result:** Both rows reach the *Imported* state, the session is complete, and both parts appear in the category.
- **Requirements:** REQ-IM-01, REQ-IM-03, REQ-IM-05, REQ-IM-06
- **Source:** `docs:concepts/data_import/#import-process`

### UI-IMPORT-003: Adjust an automatic field mapping
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** As UI-IMPORT-002, but one CSV column header does not match a part field name.
- **Steps:**
  1. Upload the file.
  2. Manually map the unmatched column to the correct part field.
  3. Continue the import and confirm the rows.
- **Expected result:** The rows are imported with the column's values stored in the mapped field.
- **Requirements:** REQ-IM-03
- **Source:** `docs:concepts/data_import/#map-data-fields`

### UI-IMPORT-004: A row with an error is not imported
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** As UI-IMPORT-002, but one row has an invalid value (for example, units `KG`).
- **Steps:**
  1. Upload the file and confirm the mappings.
  2. Review the row states.
  3. Try to import the invalid row.
- **Expected result:** The invalid row is in the *Error* state with its error displayed and is not imported. The valid row is *Pending* and can be imported.
- **Requirements:** REQ-IM-05
- **Source:** `docs:concepts/data_import/#process-data`

### UI-IMPORT-005: Correct an error row and import it
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** A row is in the *Error* state as in UI-IMPORT-004.
- **Steps:**
  1. Correct the invalid value in the row.
  2. Re-process the row.
  3. Import the row.
- **Expected result:** The row moves to *Pending*, then *Imported*, and the part is created.
- **Requirements:** REQ-IM-05
- **Source:** `docs:concepts/data_import/#process-data`

### UI-IMPORT-006: Remove a row
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** An import session with at least two *Pending* rows.
- **Steps:**
  1. Remove one row.
  2. Import the remaining rows.
- **Expected result:** The removed row creates no part. The session is complete when all remaining rows are processed.
- **Requirements:** REQ-IM-05, REQ-IM-06
- **Source:** `docs:concepts/data_import/#process-data`

### UI-IMPORT-007: Import with a category that does not exist
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** A CSV file whose category value matches no existing category.
- **Steps:**
  1. Upload the file and confirm the mappings.
  2. Review the row states.
- **Expected result:** See OQ-CREATE-05.
- **Requirements:** REQ-IM-04
- **Source:** `docs:concepts/data_import/#mapping-to-existing-data`

### UI-IMPORT-008: Import is not permitted for a non-staff user
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** Logged in as a test user who is not staff but has Part "create" and `change` permissions.
- **Steps:**
  1. Open the *Parts* view.
  2. Try to start an import session.
- **Expected result:** The user cannot import data. See OQ-CREATE-06 for how this is shown.
- **Requirements:** REQ-IM-02
- **Source:** `docs:concepts/data_import/#required-permissions`

### UI-IMPORT-009: Leave and resume an import session
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** An import session whose rows have loaded but are not yet imported.
- **Steps:**
  1. Leave the import page.
  2. Open the import session list in the Admin Center.
  3. Reopen the session.
- **Expected result:** The session is listed and keeps its progress, and its rows can still be processed.
- **Requirements:** REQ-IM-07
- **Source:** `docs:concepts/data_import/#import-session-list`

### UI-IMPORT-010: Update existing parts from the Admin Center
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** Staff user. Test-owned parts exported to CSV, with descriptions changed in the file.
- **Steps:**
  1. In the Admin Center, create an import session for parts with *Update Existing Records* selected.
  2. Upload the file and map the `ID` column to the `ID` field.
  3. Process and import the rows.
- **Expected result:** The existing parts are updated with the new descriptions, and no new parts are created.
- **Requirements:** REQ-IM-08
- **Source:** `docs:concepts/data_import/#updating-existing-records`

### UI-IMPORT-011: Update option is not available from a data table
- **Priority:** P3
- **Type:** Negative
- **Preconditions:** Staff user with Part "create" and `change` permissions.
- **Steps:**
  1. Open *Add Parts* > *Import from File*.
  2. Look for the *Update Existing Records* option.
- **Expected result:** The option is not available.
- **Requirements:** REQ-IM-08
- **Source:** `docs:concepts/data_import/#updating-existing-records`

## Import from Supplier

### UI-IMPORT-012: Import a part from a supplier
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A supplier mixin plugin is installed, and its supplier company setting is configured. A test-owned category exists.
- **Steps:**
  1. Open the category and select *Import Part*.
  2. In the wizard, confirm the category, select parameters, and create initial stock.
  3. Finish the wizard.
- **Expected result:** The part is created in the category with the selected parameters and initial stock.
- **Requirements:** REQ-IM-09
- **Source:** `docs:part/create/#import-from-supplier`
- **Note:** Not testable on the local instance unless a supplier plugin is installed (OQ-CREATE-07).

### UI-IMPORT-013: Import a supplier part for an existing part
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** As UI-IMPORT-012, plus a test-owned Purchaseable part.
- **Steps:**
  1. Open the part's supplier panel.
  2. Select *Import supplier part* and complete the dialog.
- **Expected result:** A supplier part and its manufacturer part are linked to the existing part.
- **Requirements:** REQ-IM-10
- **Source:** `docs:part/create/#import-a-supplier-part`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Manual entry | 7 | 7 | 2 | 16 |
| Import from file | 4 | 4 | 3 | 11 |
| Import from supplier | 0 | 0 | 2 | 2 |
| **Total** | **11** | **11** | **7** | **29** |

All 21 requirements are covered by at least one case.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-CREATE-01 | Which Create Part fields are required? The documentation says "fill out the required attributes" but does not list them. | UI-CREATE-005 | Resolved: only *Name* is required. Local 1.6.3, confirmed by user (2026-10-29). |
| OQ-CREATE-02 | Is the initial stock section hidden when *Create Initial Stock* is disabled? The documentation only describes the enabled state. | UI-CREATE-010 | Open |
| OQ-CREATE-03 | Are supplier options hidden for non-Purchaseable parts? The documentation only describes the Purchaseable case. | UI-CREATE-012 | Open |
| OQ-CREATE-04 | Must names be unique on their own? `part/views/` calls the name "(unique)", but revisions share a name, so uniqueness may combine name, IPN, and revision. | UI-CREATE-014 | Open |
| OQ-CREATE-05 | How is an unmatched category reported during import (row error or failed mapping)? | UI-IMPORT-007 | Open |
| OQ-CREATE-06 | How is a non-staff user prevented from importing (menu hidden, or an error on submit)? | UI-IMPORT-008 | Open |
| OQ-CREATE-07 | Is a supplier plugin available for the local instance? Without one, UI-IMPORT-012 and UI-IMPORT-013 cannot be run. | UI-IMPORT-012, UI-IMPORT-013 | Open |
| OQ-CREATE-08 | How are duplicate IPNs handled at creation, with duplicates allowed and not allowed? Is a rejection shown as a form error? The pages read do not describe this behavior or its controlling setting. The local source defines *Allow Duplicate IPN* (`PART_ALLOW_DUPLICATE_IPN`, default enabled) and *IPN Regex* (`PART_IPN_REGEX`); this needs user confirmation before it is used. | UI-CREATE-016 (and API-EDGE-014) | Partly resolved: with `PART_ALLOW_DUPLICATE_IPN` on (its value on local 1.6.3), a duplicate IPN is accepted (API 201) and both parts exist. Confirmed by user (2026-10-31). Still open: the result with the setting off, and whether a rejection is shown as a form error. |
| OQ-CREATE-09 | What is the default unit? `part/` says blank (pieces); `part/views/` says `pcs`. | None yet (relevant to the Units of measure area) | Open |
