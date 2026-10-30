# UI Manual Tests: Part Attributes

Covers the part attributes (Virtual, Template, Assembly, Component, Testable, Trackable, Purchaseable, Salable, Consumable), active and inactive parts, locked parts, and part deletion, including how attributes change the tabs and actions available. Index, shared assumptions, and overall coverage: [ui-manual-tests.md](../ui-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`.

**Out of scope here (one home per concern):**
- Parts are *Active* by default → UI-CREATE (REQ-CR-10) in [part-creation.md](part-creation.md).
- Tab visibility already covered in [part-detail-tabs.md](part-detail-tabs.md): *Allocated* by Component and Salable (UI-TAB-001), *BOM* by Assembly (UI-TAB-002), *Variants* by Template (UI-TAB-003), and stock elements hidden for Virtual parts (UI-TAB-004).
- Creating variants and template stock roll-up → UI-TAB-019 and UI-TAB-009. Test templates for Testable parts → UI-TAB-025 to UI-TAB-028. Locked BOM and parameters → UI-TAB-013 and UI-TAB-018.

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:part/` | Attribute definitions, locked parts and `PART_ENABLE_LOCKING`, active and inactive parts |
| `docs:part/views/` | Tab visibility rules for Used In, Suppliers, Purchase Orders, Return Orders, Transfer Orders, Test Results |
| `docs:part/virtual/` | Virtual parts in BOMs, build orders, and sales orders |
| `docs:part/template/` | Enabling the Template option; serial number uniqueness across variants |
| `docs:part/trackable/` | Batch and serial numbers; serial number input syntax |
| `docs:part/consumable/` | Consumable stock and build order behavior |

Also checked: the root `README.md` Open Review Findings (OQ-PART-02 observation on deleting active parts) and the open questions in the other UI area files.

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-ATTR-01 | Each part has attributes that determine how it can be used; configuring them changes the functions available for the part. | `docs:part/#part-attributes` |
| REQ-ATTR-02 | Any part can be set as a Template by toggling the *Template* option in the part options of the *Details* tab; the *Variants* tab is then visible. | `docs:part/template/#enable-template-part`, `docs:part/views/#variants` |
| REQ-ATTR-03 | Tabs shown only for some attributes: *Used In* (Component), *Suppliers* and *Purchase Orders* (Purchaseable), *Test Results* (Testable), *Return Orders* (Salable, with the return order feature enabled). *Transfer Orders* is hidden for Virtual parts or when the transfer order feature is disabled. | `docs:part/views/#used-in`, `#suppliers`, `#purchase-orders`, `#test-results`, `#return-orders`, `#transfer-orders` |
| REQ-ATTR-04 | Virtual parts can be added to the BOM of an assembly. They are hidden from the list of required parts of a build order, but remain in the BOM. | `docs:part/virtual/#bills-of-material`, `docs:part/virtual/#build-orders` |
| REQ-ATTR-05 | A Component part can be used as a sub-component of an Assembly; the *Used In* tab lists the parts it is used to make. | `docs:part/#component`, `docs:part/views/#used-in` |
| REQ-ATTR-06 | Serial numbers for a trackable part can be entered with this syntax: single (`1`), list (`1,3,5`), range (`1-5`), next (`~`), all needed from a start (`4+`), start plus length (`2+2`), and combinations separated by spaces or commas. | `docs:part/trackable/#assign-serial-numbers` |
| REQ-ATTR-07 | Parts in a template/variant relationship must have unique serial numbers across the template and all its variants. | `docs:part/template/#part-templates` |
| REQ-ATTR-08 | Consumable parts can have stock items. A consumable part is not allocated to a build order, and its stock is not adjusted when the build order is completed. | `docs:part/consumable/#stock-items`, `docs:part/consumable/#build-orders` |
| REQ-ATTR-09 | Purchaseable parts can be linked to supplier parts and procured with purchase orders. Salable parts can be added to sales orders. | `docs:part/#purchaseable`, `docs:part/#salable` |
| REQ-ATTR-10 | An inactive part is not available for many actions but remains in the database. Marking an obsolete part inactive is recommended over deleting it. | `docs:part/#active-parts` |
| REQ-ATTR-11 | When part locking (`PART_ENABLE_LOCKING`) is enabled, locked parts cannot be deleted. When it is disabled, the locked state is ignored and all operations are permitted. | `docs:part/#locked-parts` |

## Attribute Changes and Tabs

### UI-ATTR-001: Enable Template on an existing part
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned part with *Template* off.
- **Steps:**
  1. Open the part's detail page and check the tab list.
  2. Open the *Details* tab and toggle the *Template* part option on.
  3. Check the tab list again.
- **Expected result:** The *Variants* tab is not shown before the change and is shown after it.
- **Requirements:** REQ-ATTR-02, REQ-ATTR-01
- **Source:** `docs:part/template/#enable-template-part`

### UI-ATTR-002: Tabs change when an attribute is toggled
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** The return order and transfer order features are enabled (OQ-ATTR-02). One test-owned part per row, with the attribute in the *Before* state.
- **Steps:** For each row, open the part's detail page and check the listed tabs, change the attribute (OQ-ATTR-01), reload, and check again.

  | Attribute | Before → After | Tabs | Expected before | Expected after |
  |---|---|---|---|---|
  | Component | off → on | *Used In* | Hidden | Visible |
  | Purchaseable | off → on | *Suppliers*, *Purchase Orders* | Hidden | Visible |
  | Testable | off → on | *Test Results* | Hidden | Visible |
  | Salable | off → on | *Return Orders* | Hidden | Visible |
  | Virtual | off → on | *Transfer Orders* | Visible | Hidden |
- **Expected result:** Each tab is hidden or visible as shown in the table.
- **Requirements:** REQ-ATTR-03, REQ-ATTR-01
- **Source:** `docs:part/views/#part-tabs`

## Virtual

### UI-ATTR-003: Add a virtual part to a BOM
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned assembly and a test-owned part with *Virtual* and *Component* on.
- **Steps:**
  1. Open the assembly's *BOM* tab and enter editing mode.
  2. Add the virtual part with quantity 1.
- **Expected result:** The virtual part is listed in the assembly's BOM.
- **Requirements:** REQ-ATTR-04
- **Source:** `docs:part/virtual/#bills-of-material`

### UI-ATTR-004: Virtual BOM item is hidden from build order required parts
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned assembly whose BOM has one virtual part and one non-virtual component.
- **Steps:**
  1. Create a build order for the assembly.
  2. Check the build order's list of required parts.
  3. Open the assembly's *BOM* tab.
- **Expected result:** The build order lists the non-virtual component and not the virtual part. The assembly's BOM still lists both.
- **Requirements:** REQ-ATTR-04
- **Source:** `docs:part/virtual/#build-orders`

## Assembly and Component

### UI-ATTR-005: Used In lists the assemblies that use a component
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned assembly and a test-owned part with *Component* on, added to the assembly's BOM.
- **Steps:**
  1. Open the component's detail page.
  2. Open the *Used In* tab.
- **Expected result:** The assembly is listed.
- **Requirements:** REQ-ATTR-05
- **Source:** `docs:part/views/#used-in`

### UI-ATTR-006: Add a non-component part to a BOM
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** A test-owned assembly and a test-owned part with *Component* off.
- **Steps:**
  1. Open the assembly's *BOM* tab and enter editing mode.
  2. Try to add the non-component part.
- **Expected result:** See OQ-ATTR-03.
- **Requirements:** REQ-ATTR-05
- **Source:** `docs:part/#component`

## Trackable

### UI-ATTR-007: Serial number input syntax
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** For each row, a new test-owned part with *Trackable* on and no stock, and a test-owned stock location. Where serial numbers are entered: see OQ-ATTR-04.
- **Steps:** For each row, create a stock item for the part with the quantity and serial number input shown, then check the serial numbers of the created stock.

  | Quantity | Serial number input | Expected serial numbers |
  |---|---|---|
  | 1 | `1` | 1 |
  | 3 | `1,3,5` | 1, 3, 5 |
  | 5 | `1-5` | 1, 2, 3, 4, 5 |
  | 3 | `4+` | 4, 5, 6 |
  | 3 | `2+2` | 2, 3, 4 |
  | 7 | `1 3-5 9+2` | 1, 3, 4, 5, 9, 10, 11 |
- **Expected result:** Each row creates stock items with exactly the serial numbers shown.
- **Requirements:** REQ-ATTR-06
- **Source:** `docs:part/trackable/#assign-serial-numbers`

### UI-ATTR-008: Serial numbers are unique across a template and its variants
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** A test-owned trackable template part `T` with two variants `V1` and `V2`. `V1` has a stock item with serial number `100`. `V2` has no stock.
- **Steps:**
  1. Create a stock item for `V2` with quantity 1 and serial number `100`.
  2. Check `V2`'s stock.
- **Expected result:** The stock item is not created, and `V2` has no stock item with serial number `100`. How the rejection is shown: see OQ-ATTR-04.
- **Requirements:** REQ-ATTR-07
- **Source:** `docs:part/template/#part-templates`

## Consumable

### UI-ATTR-009: A consumable part can have stock
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned part with *Consumable* on and a test-owned stock location.
- **Steps:**
  1. Open the part's *Stock* tab.
  2. Create a stock item with quantity 10.
- **Expected result:** The stock item is listed with quantity 10.
- **Requirements:** REQ-ATTR-08
- **Source:** `docs:part/consumable/#stock-items`

### UI-ATTR-010: Consumable stock is not adjusted by a completed build
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned assembly whose BOM has a test-owned consumable part. The consumable part has 10 units in stock.
- **Steps:**
  1. Create a build order for one assembly and complete it.
  2. Check the consumable part's stock.
- **Expected result:** The consumable part was not allocated to the build, and its stock is still 10.
- **Requirements:** REQ-ATTR-08
- **Source:** `docs:part/consumable/#build-orders`

## Purchaseable and Salable

### UI-ATTR-011: Order eligibility by Purchaseable and Salable
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** A test-owned supplier and customer. Test-owned parts as in the table; each purchaseable row's part has a supplier part.
- **Steps:** For each row, try to add the part to the order type shown.

  | Part | Order | Expected result |
  |---|---|---|
  | Purchaseable on | New purchase order line | The part can be added |
  | Purchaseable off | New purchase order line | See OQ-ATTR-07 |
  | Salable on | New sales order line | The part can be added |
  | Salable off | New sales order line | See OQ-ATTR-07 |
- **Expected result:** As shown in the table.
- **Requirements:** REQ-ATTR-09
- **Source:** `docs:part/#purchaseable`, `docs:part/#salable`

## Active and Inactive

### UI-ATTR-012: Mark a part inactive
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned active part with one stock item.
- **Steps:**
  1. Open the part's detail page and turn *Active* off (OQ-ATTR-01).
  2. Reload the detail page.
- **Expected result:** The part still exists, its detail page opens, and *Active* is off. Its stock item still exists.
- **Requirements:** REQ-ATTR-10
- **Source:** `docs:part/#active-parts`

### UI-ATTR-013: Inactive part restrictions
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** A test-owned inactive part with *Component*, *Purchaseable*, and *Salable* on and a supplier part. A test-owned assembly, stock location, supplier, and customer.
- **Steps:** Try each action with the inactive part.

  | Action |
  |---|
  | Create a new stock item for the part |
  | Add the part to the assembly's BOM |
  | Add the part to a new purchase order |
  | Add the part to a new sales order |
- **Expected result:** See OQ-ATTR-05. The documentation states only that an inactive part "is not available for many actions".
- **Requirements:** REQ-ATTR-10
- **Source:** `docs:part/#active-parts`

### UI-ATTR-014: Reactivate a part
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned inactive part.
- **Steps:**
  1. Open the part's detail page and turn *Active* on (OQ-ATTR-01).
  2. Reload the detail page.
- **Expected result:** *Active* is on.
- **Requirements:** REQ-ATTR-10
- **Source:** `docs:part/#active-parts`

### UI-ATTR-015: Delete an active part
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** Part locking disabled, or the part is not locked. A test-owned active part with no stock.
- **Steps:**
  1. Open the part's detail page.
  2. Try to delete the part.
- **Expected result:** See OQ-ATTR-06.
- **Requirements:** REQ-ATTR-10
- **Source:** `docs:part/#active-parts`

### UI-ATTR-016: Delete an inactive part
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned inactive, unlocked part with a unique name, no stock, and a test-owned category.
- **Steps:**
  1. Open the part's detail page and delete the part.
  2. Open the category's part list.
- **Expected result:** The part is deleted and is no longer listed in the category.
- **Requirements:** REQ-ATTR-10, REQ-ATTR-11
- **Source:** `docs:part/#active-parts`, `docs:part/#locked-parts`

## Locked

### UI-ATTR-017: A locked part cannot be deleted
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** Part locking (`PART_ENABLE_LOCKING`) is enabled. A test-owned inactive part with no stock, marked *Locked*.
- **Steps:**
  1. Open the part's detail page.
  2. Try to delete the part.
  3. Reload the detail page.
- **Expected result:** The part is not deleted; its detail page still opens. How the restriction is shown: see OQ-TAB-07.
- **Requirements:** REQ-ATTR-11
- **Source:** `docs:part/#locked-parts`

### UI-ATTR-018: Locked state is ignored when locking is disabled
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** Part locking (`PART_ENABLE_LOCKING`) is disabled. A test-owned inactive part with no stock, marked *Locked*.
- **Steps:**
  1. Open the part's detail page and delete the part.
- **Expected result:** The part is deleted.
- **Requirements:** REQ-ATTR-11
- **Source:** `docs:part/#locked-parts`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Attribute Changes and Tabs | 0 | 2 | 0 | 2 |
| Virtual | 0 | 0 | 2 | 2 |
| Assembly and Component | 0 | 2 | 0 | 2 |
| Trackable | 1 | 1 | 0 | 2 |
| Consumable | 0 | 0 | 2 | 2 |
| Purchaseable and Salable | 0 | 1 | 0 | 1 |
| Active and Inactive | 3 | 2 | 0 | 5 |
| Locked | 1 | 1 | 0 | 2 |
| **Total** | **5** | **9** | **4** | **18** |

All 11 requirements are covered by at least one case. Together with UI-TAB-001 to UI-TAB-004, every attribute named in the index (Virtual, Template, Assembly, Component, Trackable, Purchaseable, Salable, Active/Inactive) has at least one case for how it changes tabs or actions.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-ATTR-01 | Are all attribute flags (including *Active*) changed with the part options in the *Details* tab, as documented for *Template*, or through an edit form? | UI-ATTR-002, UI-ATTR-012, UI-ATTR-014 | Open |
| OQ-ATTR-02 | Which settings enable the return order and transfer order features, and are they enabled by default? | UI-ATTR-002 | Open |
| OQ-ATTR-03 | Can a part with *Component* off be added to a BOM? `part/` says a Component "can be used" in an assembly but does not say other parts cannot. | UI-ATTR-006 | Open |
| OQ-ATTR-04 | In which form are serial numbers entered for a new stock item, and how is a rejected (duplicate) serial number shown? | UI-ATTR-007, UI-ATTR-008 | Open |
| OQ-ATTR-05 | Which actions are blocked for an inactive part (new stock, BOM, purchase and sales orders, builds), and how is the restriction shown? The documentation says only "not available for many actions". Required by the assessment's negative scenarios. | UI-ATTR-013 | Open |
| OQ-ATTR-06 | Can an active part be deleted? The documentation recommends deactivating instead but states no restriction. On local 1.6.3, `DELETE /api/part/{id}/` for an active part returned 400 "Cannot delete this part as it is still active" (OQ-PART-02, awaiting user confirmation). | UI-ATTR-015 | Open |
| OQ-ATTR-07 | Can a part with *Purchaseable* off be added to a purchase order, or one with *Salable* off to a sales order? The documentation says the flags "allow" these actions but not that they are required. | UI-ATTR-011 | Open |
