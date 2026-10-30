# UI Manual Tests: Part Categories

Covers the part category hierarchy, the category part list and its filters, category default parameters, and the parametric parts table. Index, shared assumptions, and overall coverage: [ui-manual-tests.md](../ui-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`.

**Out of scope here (one home per concern):** a new part appearing in its category and parent category → UI-CREATE-003 in [part-creation.md](part-creation.md). Adding parameters, unit validation, and uniqueness on a part's *Parameters* tab → UI-TAB-015 to UI-TAB-017 in [part-detail-tabs.md](part-detail-tabs.md).

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:part/` | Category hierarchy, category part list contents, sub-category list, part list filters, link to part detail |
| `docs:concepts/parameters/` | Category default parameters and the uniqueness caveat; parametric table view, sorting, unit-aware sorting, filtering, filter operators, removing filters |

The Documentation Map pages do not describe creating, editing, or deleting categories, structural categories, or category default locations. These are recorded in OQ-CAT-07 rather than covered by cases.

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-CAT-01 | Parts are arranged in hierarchical categories, used to organize and filter parts by function. | `docs:part/#part` |
| REQ-CAT-02 | A category's part list shows all parts *under* the category: parts in the category and parts in a sub-category. | `docs:part/#part-category` |
| REQ-CAT-03 | Each category shows a list of the sub-categories underneath it. | `docs:part/#part-category` |
| REQ-CAT-04 | The category part list shows each part's name and description, image thumbnail, category, and stock level. | `docs:part/#part-category` |
| REQ-CAT-05 | The parts under a category can be filtered by multiple user-configurable filters. | `docs:part/#part-category` |
| REQ-CAT-06 | Clicking a part name in the category part list opens the *Part Detail* view. | `docs:part/#part-category` |
| REQ-CAT-07 | A parameter template can be linked to a part category with a default value, which is automatically applied to new parts created in that category or a sub-category. | `docs:concepts/parameters/#category-parameter-caveats` |
| REQ-CAT-08 | A category default value is not applied for a parameter template that has a uniqueness requirement. | `docs:concepts/parameters/#category-parameter-caveats` |
| REQ-CAT-09 | Table views that support parametric filtering and sorting have a *Parametric View* button above the table. Parametric tables gather all parameters of the objects of a type. | `docs:concepts/parameters/#parametric-tables` |
| REQ-CAT-10 | Clicking a parameter column header sorts the parts by that parameter's value. | `docs:concepts/parameters/#sorting-by-parameter-value` |
| REQ-CAT-11 | Parameter sorting takes unit conversion into account, so values in different compatible units are sorted correctly. | `docs:concepts/parameters/#parameter-unit-sorting` |
| REQ-CAT-12 | The filter button on a parameter column filters parts by that parameter's value. Filter options depend on the parameter type: a parameter with choices filters by those choices; a numeric parameter filters by a value and an operator. | `docs:concepts/parameters/#filtering-by-parameter-value` |
| REQ-CAT-13 | The filter operators are `=`, `>`, `>=`, `<`, `<=`, `!=`, and `~` (contains, for text parameters). | `docs:concepts/parameters/#available-filter-operators` |
| REQ-CAT-14 | With filters on multiple parameters, only parts that match *all* filters are shown. Each parameter column indicates whether a filter is applied. | `docs:concepts/parameters/#filtering-by-multiple-parameters` |
| REQ-CAT-15 | Multiple filters can be applied to the same parameter, for example a lower and an upper bound. | `docs:concepts/parameters/#multiple-filters-against-the-same-parameter` |
| REQ-CAT-16 | For a parameter with units, the filter value can be entered in any compatible unit and is converted to the template's base unit (`10k` and `10000` both mean 10,000 ohms). | `docs:concepts/parameters/#unit-aware-filtering` |
| REQ-CAT-17 | A filter is removed with the remove button associated with it. | `docs:concepts/parameters/#removing-filters` |

## Hierarchy

### UI-CAT-001: Sub-categories are listed under their parent
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** Test-owned category tree: `Parent` with sub-categories `Child A` and `Child B`; `Child A` has sub-category `Grandchild A1`.
- **Steps:**
  1. Open `Parent` and view its sub-category list.
  2. Open `Child A` and view its sub-category list.
  3. Open `Child B` and view its sub-category list.
- **Expected result:** `Parent` lists `Child A` and `Child B`. `Child A` lists `Grandchild A1`. `Child B` lists no sub-categories. Whether `Parent` also lists `Grandchild A1`: see OQ-CAT-01.
- **Requirements:** REQ-CAT-03, REQ-CAT-01
- **Source:** `docs:part/#part-category`

### UI-CAT-002: Category part list across three levels
- **Priority:** P1
- **Type:** Boundary
- **Preconditions:** The category tree from UI-CAT-001. Test-owned parts: `Part P` in `Parent`, `Part C` in `Child A`, `Part G` in `Grandchild A1`.
- **Steps:**
  1. Open `Parent` and view its part list.
  2. Open `Child A` and view its part list.
  3. Open `Grandchild A1` and view its part list.
- **Expected result:**

  | Category | Listed | Not listed |
  |---|---|---|
  | `Parent` | `Part P`, `Part C` | – (`Part G`: see OQ-CAT-01) |
  | `Child A` | `Part C`, `Part G` | `Part P` |
  | `Grandchild A1` | `Part G` | `Part P`, `Part C` |
- **Requirements:** REQ-CAT-02, REQ-CAT-01
- **Source:** `docs:part/#part-category`

### UI-CAT-003: Sibling category does not list the other sibling's parts
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** The category tree from UI-CAT-001. Test-owned `Part C` in `Child A` and `Part D` in `Child B`.
- **Steps:**
  1. Open `Child A` and view its part list.
  2. Open `Child B` and view its part list.
- **Expected result:** `Child A` lists `Part C` and not `Part D`. `Child B` lists `Part D` and not `Part C`.
- **Requirements:** REQ-CAT-02
- **Source:** `docs:part/#part-category`

### UI-CAT-004: Open a part from the category part list
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned category with one test-owned part.
- **Steps:**
  1. Open the category and view its part list.
  2. Click the part name.
- **Expected result:** The part's *Part Detail* view opens.
- **Requirements:** REQ-CAT-06
- **Source:** `docs:part/#part-category`

## Category Part List

### UI-CAT-005: Category part list columns
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** Test-owned category `Parent` with sub-category `Child A`. Test-owned `Part C` in `Child A`, with a description, an image, and one stock item of quantity 25.
- **Steps:**
  1. Open `Parent` and view its part list.
  2. Find the row for `Part C`.
- **Expected result:** The row shows the part name and description, an image thumbnail, the category `Child A`, and a stock level of 25.
- **Requirements:** REQ-CAT-04, REQ-CAT-02
- **Source:** `docs:part/#part-category`

### UI-CAT-006: Filter the category part list
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned category with test-owned `Part A` (*Assembly* on) and `Part B` (*Assembly* off). Filter names: see OQ-CAT-03.
- **Steps:** Open the category's part list, apply each filter below, and check the listed parts. Clear the filter between rows.

  | Filter | Expected parts |
  |---|---|
  | Assembly = Yes | `Part A` |
  | Assembly = No | `Part B` |
  | None | `Part A`, `Part B` |
- **Expected result:** Each filter lists the parts in the table.
- **Requirements:** REQ-CAT-05
- **Source:** `docs:part/#part-category`

## Category Parameters

### UI-CAT-007: Category default parameter is applied to a new part
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned parameter template `Voltage Rating` (no uniqueness requirement) linked to a test-owned category with default value `50` (OQ-CAT-04).
- **Steps:**
  1. Create a new part in the category.
  2. Open the new part's *Parameters* tab.
- **Expected result:** The part has a `Voltage Rating` parameter with value `50`.
- **Requirements:** REQ-CAT-07
- **Source:** `docs:concepts/parameters/#category-parameter-caveats`

### UI-CAT-008: Category default parameter is applied in a sub-category
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** The template and category link from UI-CAT-007. The category has a test-owned sub-category with no parameter templates of its own.
- **Steps:**
  1. Create a new part in the sub-category.
  2. Open the new part's *Parameters* tab.
- **Expected result:** The part has a `Voltage Rating` parameter with value `50`.
- **Requirements:** REQ-CAT-07
- **Source:** `docs:concepts/parameters/#category-parameter-caveats`

### UI-CAT-009: Category default is not applied for a unique template
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** A test-owned parameter template `Asset Code` with *Unique* set to "Unique for model type", linked to a test-owned category with default value `AC-1` (OQ-CAT-04).
- **Steps:**
  1. Create a new part in the category.
  2. Open the new part's *Parameters* tab.
- **Expected result:** The part has no `Asset Code` parameter.
- **Requirements:** REQ-CAT-08
- **Source:** `docs:concepts/parameters/#category-parameter-caveats`

## Parametric View and Sorting

Shared preconditions for UI-CAT-010 to UI-CAT-019: parameter templates are test-owned and have values only on test-owned parts, so the expected parts do not depend on whether the parametric table is limited to the category (OQ-CAT-02).

### UI-CAT-010: Parametric View shows parameter columns
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned template `Resistance` with units `ohm`. Test-owned parts in a test-owned category: `R1` with `Resistance` = `100`, `R2` with `Resistance` = `1k`.
- **Steps:**
  1. Open the category's part list.
  2. Select *Parametric View* above the table.
- **Expected result:** The table has a `Resistance` column showing the value of each part.
- **Requirements:** REQ-CAT-09
- **Source:** `docs:concepts/parameters/#parametric-tables`

### UI-CAT-011: Sort by a parameter with mixed units
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** The `Resistance` template from UI-CAT-010. Test-owned parts: `S1` = `2k`, `S2` = `500`, `S3` = `1500`.
- **Steps:**
  1. Open the parametric view.
  2. Click the `Resistance` column header; note the order.
  3. Click the header again; note the order.
- **Expected result:** The parts are sorted by converted value: ascending `S2`, `S3`, `S1`, and descending `S1`, `S3`, `S2`.
- **Requirements:** REQ-CAT-10, REQ-CAT-11
- **Source:** `docs:concepts/parameters/#sorting-by-parameter-value`, `docs:concepts/parameters/#parameter-unit-sorting`

## Parametric Filtering

### UI-CAT-012: Numeric filter operators
- **Priority:** P1
- **Type:** Boundary
- **Preconditions:** The `Resistance` template from UI-CAT-010. Test-owned parts: `F1` = `100`, `F2` = `1k`, `F3` = `10k`.
- **Steps:** Open the parametric view. For each row, apply the filter with the filter button on the `Resistance` column, check the listed parts, and remove the filter.

  | Operator | Value | Expected parts |
  |---|---|---|
  | `=` | `1000` | `F2` |
  | `>` | `1000` | `F3` |
  | `>=` | `1000` | `F2`, `F3` |
  | `<` | `1000` | `F1` |
  | `<=` | `1000` | `F1`, `F2` |
  | `!=` | `1000` | `F1`, `F3` |
- **Expected result:** Each filter lists exactly the parts in the table.
- **Requirements:** REQ-CAT-12, REQ-CAT-13
- **Source:** `docs:concepts/parameters/#available-filter-operators`

### UI-CAT-013: Text "contains" filter
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned template `Series` without units. Test-owned parts: `T1` = `Alpha`, `T2` = `Alphabet`, `T3` = `Beta`.
- **Steps:**
  1. Open the parametric view.
  2. Apply the filter `~` `Alph` to the `Series` column.
- **Expected result:** `T1` and `T2` are listed; `T3` is not.
- **Requirements:** REQ-CAT-13
- **Source:** `docs:concepts/parameters/#available-filter-operators`

### UI-CAT-014: Unit-aware filter value
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** The `Resistance` template from UI-CAT-010. Test-owned parts: `U1` = `4.7k`, `U2` = `22k`, `U3` = `100k`.
- **Steps:**
  1. Open the parametric view.
  2. Apply the filter `>` `10k` to the `Resistance` column; note the listed parts; remove the filter.
  3. Apply the filter `>` `10000`; note the listed parts.
- **Expected result:** Both filters list `U2` and `U3`, and not `U1`.
- **Requirements:** REQ-CAT-16
- **Source:** `docs:concepts/parameters/#unit-aware-filtering`

### UI-CAT-015: Range filter on one parameter
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** The `Resistance` template from UI-CAT-010. Test-owned parts: `V1` = `4.7k`, `V2` = `10k`, `V3` = `22k`, `V4` = `100k`.
- **Steps:**
  1. Open the parametric view.
  2. Apply two filters to the `Resistance` column: `>` `10k` and `<` `100k`.
- **Expected result:** Only `V3` is listed. `V2` and `V4`, on the bounds, are excluded.
- **Requirements:** REQ-CAT-15, REQ-CAT-13
- **Source:** `docs:concepts/parameters/#multiple-filters-against-the-same-parameter`

### UI-CAT-016: Filters on two parameters must all match
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** The `Resistance` template from UI-CAT-010 and the `Series` template from UI-CAT-013. Test-owned parts:

  | Part | Resistance | Series |
  |---|---|---|
  | `M1` | `1k` | `Alpha` |
  | `M2` | `1k` | `Beta` |
  | `M3` | `10k` | `Alpha` |
- **Steps:**
  1. Open the parametric view.
  2. Apply `=` `1k` to the `Resistance` column.
  3. Apply `~` `Alpha` to the `Series` column.
- **Expected result:** Only `M1` is listed. The `Resistance` and `Series` columns both indicate that a filter is applied.
- **Requirements:** REQ-CAT-14
- **Source:** `docs:concepts/parameters/#filtering-by-multiple-parameters`

### UI-CAT-017: Remove a parameter filter
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** As UI-CAT-016, after step 3.
- **Steps:**
  1. Remove the `Series` filter with its remove button.
- **Expected result:** `M1` and `M2` are listed, `M3` is not, and the `Series` column no longer indicates a filter.
- **Requirements:** REQ-CAT-17, REQ-CAT-14
- **Source:** `docs:concepts/parameters/#removing-filters`

### UI-CAT-018: Filter a parameter with choices
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** A test-owned template `Finish` with *Choices* `Matte, Gloss, Satin`. Test-owned parts: `C1` = `Matte`, `C2` = `Gloss`.
- **Steps:**
  1. Open the parametric view.
  2. Open the filter for the `Finish` column.
  3. Select `Gloss`.
- **Expected result:** The filter offers the choices `Matte`, `Gloss`, and `Satin`. After selecting `Gloss`, only `C2` is listed.
- **Requirements:** REQ-CAT-12
- **Source:** `docs:concepts/parameters/#filtering-by-parameter-value`

### UI-CAT-019: Filter value with incompatible units
- **Priority:** P3
- **Type:** Negative
- **Preconditions:** The `Resistance` template and parts from UI-CAT-014.
- **Steps:**
  1. Open the parametric view.
  2. Apply the filter `>` `10 kg` to the `Resistance` column.
- **Expected result:** See OQ-CAT-05.
- **Requirements:** REQ-CAT-16
- **Source:** `docs:concepts/parameters/#unit-aware-filtering`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Hierarchy | 1 | 2 | 1 | 4 |
| Category Part List | 0 | 1 | 1 | 2 |
| Category Parameters | 1 | 2 | 0 | 3 |
| Parametric View and Sorting | 0 | 2 | 0 | 2 |
| Parametric Filtering | 1 | 3 | 4 | 8 |
| **Total** | **3** | **10** | **6** | **19** |

All 17 requirements are covered by at least one case. Category create, edit, and delete are not covered (OQ-CAT-07).

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-CAT-01 | Do a category's part list and sub-category list include items more than one level down (for example, parts in a sub-category of a sub-category)? The documentation says "under" the category, and then names only parts in the category or "a sub-category". | UI-CAT-001, UI-CAT-002 | Open |
| OQ-CAT-02 | Is *Parametric View* available on the category part list, and is it limited to that category's parts? | UI-CAT-010 to UI-CAT-019 | Open |
| OQ-CAT-03 | Which filters does the category part list offer, and what are they called? The documentation says only that filters are user-configurable. | UI-CAT-006 | Open |
| OQ-CAT-04 | How is a parameter template linked to a category with a default value in the UI? The documentation states the rule but not the screen. | UI-CAT-007, UI-CAT-008, UI-CAT-009 | Open |
| OQ-CAT-05 | What happens when a filter value uses units incompatible with the template (for example `10 kg` for `ohm`): an error, no results, or the filter is ignored? | UI-CAT-019 | Open |
| OQ-CAT-06 | Is a category default parameter applied to parts that already exist in the category when the template is linked? The documentation mentions only new parts. | None until answered | Open |
| OQ-CAT-07 | The Documentation Map pages do not describe creating, editing, or deleting categories, structural categories, or category default locations. What happens to parts and sub-categories when a category is deleted? | None until answered (coverage gap) | Open |
