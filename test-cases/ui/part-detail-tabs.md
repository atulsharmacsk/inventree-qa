# UI Manual Tests: Part Detail View Tabs

Covers the tabs on the part detail page: Stock, Allocated, BOM, Build Orders, Parameters, Variants, Revisions, Attachments, Related Parts, and Test Templates, including the rules that control when each tab appears. Index, shared assumptions, and overall coverage: [ui-manual-tests.md](../ui-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`.

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:part/views/` | Tab list, tab contents, and tab visibility rules |
| `docs:part/` | Locked parts |
| `docs:part/virtual/` | Stock elements hidden for virtual parts |
| `docs:part/template/` | Variants tab, creating variants, template stock |
| `docs:part/revision/` | Revision selector |
| `docs:part/test/` | Test template name, key, and cascade |
| `docs:concepts/parameters/` | Creating parameters, unit validation, uniqueness |
| `docs:manufacturing/bom/` | BOM editing and validation |

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-TAB-01 | The *Variants* tab is visible if the part is a *Template* part. | `docs:part/views/#variants` |
| REQ-TAB-02 | The *Stock* tab shows all stock items for the part, with quantity, location, and status. | `docs:part/views/#stock` |
| REQ-TAB-03 | *New Stock Item* opens a dialog to create a stock item for the part. | `docs:part/views/#new-stock-item` |
| REQ-TAB-04 | *Export* opens a dialog to select export options, then downloads a file with all stock items for the part. | `docs:part/views/#export` |
| REQ-TAB-05 | When stock items are selected in the table, stock actions are enabled in a drop-down menu. | `docs:part/views/#stock-actions` |
| REQ-TAB-06 | The *Allocated* tab shows units allocated to pending build orders and sales orders. It is visible only if the part is a *Component* or *Salable*. | `docs:part/views/#allocations` |
| REQ-TAB-07 | The *BOM* tab lists the sub-components required to build the assembly. It is visible only if the part is an *Assembly*. | `docs:part/views/#bill-of-materials` |
| REQ-TAB-08 | The *Build Orders* tab lists builds for the part, with quantity, status, creation date, and completion date. | `docs:part/views/#build-orders` |
| REQ-TAB-09 | Tests can be defined for a *Testable* part in the *Test Templates* tab. | `docs:part/views/#test-templates` |
| REQ-TAB-10 | Related parts can be added and are shown in a *Related Parts* table. The feature can be enabled or disabled in the global part settings. | `docs:part/views/#related-parts` |
| REQ-TAB-11 | A part can have multiple parameters, shown in its *Parameters* tab. | `docs:part/views/#parameters`, `docs:concepts/parameters/#parameter-tab` |
| REQ-TAB-12 | The *Attachments* tab shows the part's file attachments; multiple attachments can be uploaded. | `docs:part/views/#attachments` |
| REQ-TAB-13 | Virtual parts cannot have stock items, and stock-related interface elements are hidden for them. | `docs:part/virtual/#stock-items` |
| REQ-TAB-14 | The stock for a template part includes the stock of all its variants. | `docs:part/template/#part-templates` |
| REQ-TAB-15 | For a template part, *New Variant* in the *Variants* tab opens the *Duplicate Part* form; submitting it creates the variant. | `docs:part/template/#create-variant` |
| REQ-TAB-16 | When a part has multiple revisions, a *Select Part Revision* drop-down at the top of the part page navigates between them. It is only visible when multiple revisions exist. | `docs:part/revision/#revision-navigation` |
| REQ-TAB-17 | The *Edit* icon on the BOM panel enables editing mode, where BOM items are added with the *Create BOM Item* form. Users without permission to edit the BOM do not see the *Edit* icon. | `docs:manufacturing/bom/#editing-mode`, `docs:manufacturing/bom/#add-bom-item` |
| REQ-TAB-18 | Creating, changing, or deleting a BOM line item marks the assembly "Not Validated" and shows a *Validate BOM* button. | `docs:manufacturing/bom/#bom-validation-status` |
| REQ-TAB-19 | When part locking is enabled (`PART_ENABLE_LOCKING`), BOM items of a locked assembly and parameters of a locked part cannot be created, edited, or deleted. | `docs:part/#locked-parts` |
| REQ-TAB-20 | *New Parameter* in the *Parameters* tab opens the *Create Parameter* form; the user selects a *Template*, enters *Data*, and submits. | `docs:concepts/parameters/#create-parameter` |
| REQ-TAB-21 | A parameter value incompatible with the template's units is rejected. This check can be disabled. | `docs:concepts/parameters/#incompatible-units` |
| REQ-TAB-22 | For a template with a uniqueness requirement, a duplicate value is rejected and an error is shown. The check is case-insensitive. | `docs:concepts/parameters/#parameter-uniqueness` |
| REQ-TAB-23 | A test name must be unique for a part, or across a set of part variants. | `docs:part/test/#test-name` |
| REQ-TAB-24 | A test key is generated from the test name when the template is saved: lowercase alphanumeric only, with a leading underscore if it would start with a digit. | `docs:part/test/#test-key` |
| REQ-TAB-25 | Test templates defined on a template part cascade to its variants. | `docs:part/test/#part-test-templates` |

## Tab Visibility

### UI-TAB-001: Allocated tab visibility by Component and Salable
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** Three test-owned parts with these attributes:

  | Part | Component | Salable | Expected *Allocated* tab |
  |---|---|---|---|
  | A | On | Off | Visible |
  | B | Off | On | Visible |
  | C | Off | Off | Not visible |
- **Steps:**
  1. Open each part's detail page.
  2. Check the tab list for the *Allocated* tab.
- **Expected result:** The tab is visible or hidden as shown in the table.
- **Requirements:** REQ-TAB-06
- **Source:** `docs:part/views/#allocations`
- **Open question:** OQ-TAB-06 (tab label).

### UI-TAB-002: BOM tab visibility by Assembly
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** Two test-owned parts: one with *Assembly* on, one with *Assembly* off.
- **Steps:**
  1. Open each part's detail page.
  2. Check the tab list for the *BOM* tab.
- **Expected result:** The *BOM* tab is visible for the assembly and not visible for the other part.
- **Requirements:** REQ-TAB-07
- **Source:** `docs:part/views/#bill-of-materials`

### UI-TAB-003: Variants tab visibility by Template
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** Two test-owned parts: one with *Template* on, one with *Template* off.
- **Steps:**
  1. Open each part's detail page.
  2. Check the tab list for the *Variants* tab.
- **Expected result:** The *Variants* tab is visible for the template part and not visible for the other part.
- **Requirements:** REQ-TAB-01
- **Source:** `docs:part/views/#variants`

### UI-TAB-004: Stock elements are hidden for a virtual part
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** A test-owned part with *Virtual* on.
- **Steps:**
  1. Open the part's detail page.
  2. Look for the *Stock* tab and other stock elements, such as *New Stock Item*.
- **Expected result:** Stock-related interface elements are not shown, and no stock item can be created for the part.
- **Requirements:** REQ-TAB-13
- **Source:** `docs:part/virtual/#stock-items`

## Stock

### UI-TAB-005: Stock tab lists the part's stock items
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned part with two stock items in different test-owned locations.
- **Steps:**
  1. Open the part's detail page.
  2. Open the *Stock* tab.
- **Expected result:** Both stock items are listed, each with its quantity, location, and status.
- **Requirements:** REQ-TAB-02
- **Source:** `docs:part/views/#stock`

### UI-TAB-006: Create a stock item from the Stock tab
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned part without stock and a test-owned location.
- **Steps:**
  1. Open the part's *Stock* tab.
  2. Select *New Stock Item*.
  3. Enter a quantity and the location, and submit.
- **Expected result:** The dialog creates the stock item, and it is listed in the *Stock* tab with the entered quantity and location.
- **Requirements:** REQ-TAB-03, REQ-TAB-02
- **Source:** `docs:part/views/#new-stock-item`

### UI-TAB-007: Stock actions after selecting items
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned part with at least one stock item.
- **Steps:**
  1. Open the part's *Stock* tab.
  2. Select a stock item in the table.
  3. Open the stock actions drop-down.
- **Expected result:** Stock actions are enabled in the drop-down.
- **Requirements:** REQ-TAB-05
- **Source:** `docs:part/views/#stock-actions`

### UI-TAB-008: Export the part's stock data
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned part with two stock items.
- **Steps:**
  1. Open the part's *Stock* tab.
  2. Select *Export*, choose the export options, and confirm.
- **Expected result:** A file is downloaded that contains both stock items.
- **Requirements:** REQ-TAB-04
- **Source:** `docs:part/views/#export`

### UI-TAB-009: Template stock includes variant stock
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned template part with two variants. Each variant has a stock item with a known quantity; the template has none.
- **Steps:**
  1. Open the template part's detail page.
  2. Check its stock.
- **Expected result:** The template's stock includes the stock of both variants.
- **Requirements:** REQ-TAB-14
- **Source:** `docs:part/template/#part-templates`

## Allocated

### UI-TAB-010: Allocated tab shows allocated quantities
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned component part with stock allocated to a pending build order.
- **Steps:**
  1. Open the part's detail page.
  2. Open the *Allocated* tab.
- **Expected result:** The tab shows the units allocated to the pending build order.
- **Requirements:** REQ-TAB-06
- **Source:** `docs:part/views/#allocations`

## Bill of Materials

### UI-TAB-011: Add a BOM item in editing mode
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned assembly part and a test-owned component part.
- **Steps:**
  1. Open the assembly's *BOM* tab.
  2. Select the *Edit* icon.
  3. Add an item and, in the *Create BOM Item* form, select the component and enter a quantity.
  4. Submit.
- **Expected result:** The component is listed in the BOM with the entered quantity.
- **Requirements:** REQ-TAB-17, REQ-TAB-07
- **Source:** `docs:manufacturing/bom/#add-bom-item`

### UI-TAB-012: BOM change requires revalidation
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned assembly with a validated BOM.
- **Steps:**
  1. Change the quantity of a BOM line item.
  2. Check the validation status at the top of the BOM table.
  3. Select *Validate BOM*.
- **Expected result:** After the change, the status is "Not Validated" and *Validate BOM* is shown. After validating, the BOM is validated again.
- **Requirements:** REQ-TAB-18
- **Source:** `docs:manufacturing/bom/#bom-validation-status`

### UI-TAB-013: BOM of a locked assembly cannot be changed
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** Part locking (`PART_ENABLE_LOCKING`) is enabled. A test-owned assembly with one BOM item, marked *Locked*.
- **Steps:**
  1. Open the assembly's *BOM* tab.
  2. Try to add a BOM item.
  3. Try to edit the existing BOM item.
  4. Try to delete the existing BOM item.
- **Expected result:** None of the changes is made; the BOM still has its original single item. See OQ-TAB-07 for how the restriction is shown.
- **Requirements:** REQ-TAB-19
- **Source:** `docs:part/#locked-parts`

## Build Orders

### UI-TAB-014: Build Orders tab lists builds
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned assembly with one build order.
- **Steps:**
  1. Open the assembly's detail page.
  2. Open the *Build Orders* tab.
- **Expected result:** The build order is listed with its quantity, status, creation date, and completion date.
- **Requirements:** REQ-TAB-08
- **Source:** `docs:part/views/#build-orders`
- **Open question:** OQ-TAB-01 (when the tab is visible).

## Parameters

### UI-TAB-015: Add a parameter to a part
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned part and a test-owned parameter template without units.
- **Steps:**
  1. Open the part's *Parameters* tab.
  2. Select *New Parameter*.
  3. Select the template, enter a value in *Data*, and submit.
- **Expected result:** The parameter is listed in the *Parameters* tab with the entered value.
- **Requirements:** REQ-TAB-20, REQ-TAB-11
- **Source:** `docs:concepts/parameters/#create-parameter`

### UI-TAB-016: Reject a parameter value with incompatible units
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** Parameter unit validation is enabled (OQ-TAB-08). A test-owned part and a test-owned parameter template with units `ohm`.
- **Steps:**
  1. Open the part's *Parameters* tab and select *New Parameter*.
  2. Select the template, enter `10 kg` in *Data*, and submit.
- **Expected result:** The parameter is rejected and is not added to the part.
- **Requirements:** REQ-TAB-21
- **Source:** `docs:concepts/parameters/#incompatible-units`

### UI-TAB-017: Reject a duplicate value for a unique parameter template
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** A test-owned parameter template without units, with *Unique* set to "Unique for model type". Test-owned part A has a parameter for this template with value `ABC123`. Test-owned part B has none.
- **Steps:**
  1. Open part B's *Parameters* tab and select *New Parameter*.
  2. Select the template, enter `abc123`, and submit.
- **Expected result:** The value is rejected as a duplicate (the check is case-insensitive), an error message is shown, and part B has no parameter for this template.
- **Requirements:** REQ-TAB-22
- **Source:** `docs:concepts/parameters/#parameter-uniqueness`

### UI-TAB-018: Parameters of a locked part cannot be changed
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** Part locking (`PART_ENABLE_LOCKING`) is enabled. A test-owned part with one parameter, marked *Locked*.
- **Steps:**
  1. Open the part's *Parameters* tab.
  2. Try to add, edit, and delete a parameter.
- **Expected result:** None of the changes is made; the part still has its original parameter and value. See OQ-TAB-07 for how the restriction is shown.
- **Requirements:** REQ-TAB-19
- **Source:** `docs:part/#locked-parts`

## Variants

### UI-TAB-019: Create a variant from the Variants tab
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned template part.
- **Steps:**
  1. Open the template's *Variants* tab.
  2. Select *New Variant*.
  3. In the *Duplicate Part* form, enter a unique name and submit.
- **Expected result:** The variant is created and is listed in the template's *Variants* tab.
- **Requirements:** REQ-TAB-15
- **Source:** `docs:part/template/#create-variant`

## Revisions

### UI-TAB-020: Revision selector appears only with multiple revisions
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** Part revisions are enabled. Test-owned part A has no revisions. Test-owned part B has one revision, B-rev, so two revisions exist.
- **Steps:**
  1. Open part A's detail page and look for the *Select Part Revision* drop-down.
  2. Open part B's detail page and look for the drop-down.
- **Expected result:** The drop-down is not shown for part A and is shown for part B.
- **Requirements:** REQ-TAB-16
- **Source:** `docs:part/revision/#revision-navigation`
- **Open question:** OQ-TAB-02 (Revisions tab).

### UI-TAB-021: Navigate between revisions
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** As part B in UI-TAB-020.
- **Steps:**
  1. Open part B's detail page.
  2. In *Select Part Revision*, select B-rev.
- **Expected result:** The detail page of B-rev opens.
- **Requirements:** REQ-TAB-16
- **Source:** `docs:part/revision/#revision-navigation`

## Attachments

### UI-TAB-022: Upload multiple attachments
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned part and two small test files.
- **Steps:**
  1. Open the part's *Attachments* tab.
  2. Upload the first file.
  3. Upload the second file.
- **Expected result:** Both files are listed in the *Attachments* tab.
- **Requirements:** REQ-TAB-12
- **Source:** `docs:part/views/#attachments`

## Related Parts

### UI-TAB-023: Add a related part
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** The related parts feature is enabled. Two test-owned parts, A and B.
- **Steps:**
  1. Open part A's *Related Parts* tab.
  2. Add part B as a related part.
- **Expected result:** Part B is listed in part A's *Related Parts* table.
- **Requirements:** REQ-TAB-10
- **Source:** `docs:part/views/#related-parts`

### UI-TAB-024: Related parts feature disabled
- **Priority:** P3
- **Type:** Negative
- **Preconditions:** The related parts feature is disabled in the global part settings. A test-owned part.
- **Steps:**
  1. Open the part's detail page.
  2. Look for the *Related Parts* tab.
- **Expected result:** See OQ-TAB-03.
- **Requirements:** REQ-TAB-10
- **Source:** `docs:part/views/#related-parts`

## Test Templates

### UI-TAB-025: Add a test template to a testable part
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned part with *Testable* on.
- **Steps:**
  1. Open the part's *Test Templates* tab.
  2. Add a test template named `Firmware Version` with *Required* checked.
- **Expected result:** The test template is listed for the part with *Required* set.
- **Requirements:** REQ-TAB-09
- **Source:** `docs:part/test/#test-template-parameters`
- **Open question:** OQ-TAB-05 (tab visibility for non-testable parts).

### UI-TAB-026: Generated test keys
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** A test-owned testable part.
- **Steps:** Add a test template with each name below, and check its key.

  | Test name | Expected key |
  |---|---|
  | `Firmware Version` | `firmwareversion` |
  | ` My NEW T E sT ` | `mynewtest` |
  | `100 Percent Test` | `_100percenttest` |
  | `Test 123` | `test123` |
- **Expected result:** Each template's key matches the table.
- **Requirements:** REQ-TAB-24
- **Source:** `docs:part/test/#test-key`
- **Open question:** OQ-TAB-04 (where the key is shown).

### UI-TAB-027: Reject a duplicate test name
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** A test-owned testable part with a test template named `Firmware Version`.
- **Steps:**
  1. Open the part's *Test Templates* tab.
  2. Add another test template named `Firmware Version`.
- **Expected result:** The second test template is not saved; the part has one `Firmware Version` template.
- **Requirements:** REQ-TAB-23
- **Source:** `docs:part/test/#test-name`

### UI-TAB-028: Test templates cascade to variants
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned testable template part with one variant.
- **Steps:**
  1. Add a test template to the template part.
  2. Open the variant's *Test Templates* tab.
- **Expected result:** The template part's test template is listed for the variant.
- **Requirements:** REQ-TAB-25
- **Source:** `docs:part/test/#part-test-templates`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Tab visibility | 0 | 4 | 0 | 4 |
| Stock | 3 | 0 | 2 | 5 |
| Allocated | 0 | 0 | 1 | 1 |
| Bill of Materials | 2 | 1 | 0 | 3 |
| Build Orders | 0 | 0 | 1 | 1 |
| Parameters | 2 | 2 | 0 | 4 |
| Variants | 1 | 0 | 0 | 1 |
| Revisions | 0 | 2 | 0 | 2 |
| Attachments | 0 | 1 | 0 | 1 |
| Related Parts | 0 | 0 | 2 | 2 |
| Test Templates | 0 | 3 | 1 | 4 |
| **Total** | **8** | **13** | **7** | **28** |

All 25 requirements are covered by at least one case.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-TAB-01 | When is the *Build Orders* tab visible? The documentation describes its content but not a visibility rule. | UI-TAB-014 | Open |
| OQ-TAB-02 | Is there a separate *Revisions* tab? The assessment lists one, but the documentation only describes the *Select Part Revision* drop-down. | UI-TAB-020, UI-TAB-021 | Open |
| OQ-TAB-03 | When the related parts feature is disabled, is the *Related Parts* tab hidden? What is the setting called? | UI-TAB-024 | Open |
| OQ-TAB-04 | Where is the generated test key shown in the interface? | UI-TAB-026 | Open |
| OQ-TAB-05 | Is the *Test Templates* tab hidden for non-testable parts? The documentation says the *Test Results* tab is, but does not say the same for *Test Templates*. | UI-TAB-025 | Open |
| OQ-TAB-06 | Is the tab labelled *Allocated* or *Allocations*? The documentation uses both. | UI-TAB-001, UI-TAB-010 | Open |
| OQ-TAB-07 | How is a blocked change on a locked part shown (controls hidden or disabled, or an error on submit)? | UI-TAB-013, UI-TAB-018 | Open |
| OQ-TAB-08 | Which setting controls parameter unit validation, and is it enabled by default? | UI-TAB-016 | Open |
