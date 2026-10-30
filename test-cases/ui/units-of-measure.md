# UI Manual Tests: Units of Measure

Covers configuration and use of units of measure: the part *Units* field, built-in and custom units (*Physical Units* settings tab), supplier part pack quantity units, parameter template units, and accepted value notations. Index, shared assumptions, and overall coverage: [ui-manual-tests.md](../ui-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`.

**Out of scope here (one home per concern):**
- Creating a part with a valid unit (`kg`) and rejecting a wrong-case unit (`KG`) → UI-CREATE-007 and UI-CREATE-008 in [part-creation.md](part-creation.md); invalid unit on import → UI-IMPORT-004.
- Rejecting a parameter value with incompatible units (`10 kg` for `ohm`) → UI-TAB-016 in [part-detail-tabs.md](part-detail-tabs.md).
- Unit-aware parametric sorting and filtering → UI-CAT-011, UI-CAT-014, and UI-CAT-019 in [part-categories.md](part-categories.md).

**Default settings for every case unless stated:** parameter unit validation is enabled (which setting controls it is OQ-TAB-08). Cases that create custom units delete them afterwards, after deleting any test-owned parts or templates that use them.

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:concepts/units/` | Pint-based units, unit conversion, engineering and scientific notation, feet and inches shorthand, case sensitivity, subsystems that use units (part, supplier part, parameter), built-in custom units, creating custom units in the *Physical Units* settings tab, dimensionless units |
| `docs:part/` | Part *Units of Measure* (default blank = pieces), physical units for parts, supplier part pack quantity units, conversion example, incompatible-unit error |
| `docs:part/views/` | *Units* field (default `pcs`), *Suppliers* tab visible only for *Purchaseable* parts, *Parameters* tab |
| `docs:concepts/parameters/` | Template *Units* must be a valid physical unit, creating templates and parameters, compatible-unit input, incompatible-unit rejection and the setting that disables it |

Also checked: the root `README.md` (Agent Output Corrections for UI-CREATE-008 and OQ-CREATE-09; Open Review Finding that a rejected invalid unit is not yet confirmed locally) and the open questions in the other UI area files (OQ-CREATE-09, OQ-TAB-08, OQ-CAT-05).

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-UNIT-01 | Each part can define a unit of measure. By default it is blank, meaning the part is tracked in dimensionless pieces (`part/views/` states the default is `pcs`; see OQ-CREATE-09). | `docs:part/#units-of-measure`, `docs:part/views/#part-details` |
| REQ-UNIT-02 | The part *Units* field uses real-world units, so parts can be tracked in physical quantities such as metres or litres. | `docs:part/#physical-units`, `docs:concepts/units/#part` |
| REQ-UNIT-03 | Built-in custom units `piece`, `each`, `dozen`, `hundred`, and `thousand` are provided (all dimensionless). | `docs:concepts/units/#built-in-custom-units` |
| REQ-UNIT-04 | Custom units are viewed, edited, and created in the *Physical Units* tab of the settings panel. They can define a new quantity, link existing units, or alias an existing unit. | `docs:concepts/units/#custom-units`, `#create-custom-units` |
| REQ-UNIT-05 | A dimensionless custom unit is created by entering the literal `1` as its definition. | `docs:concepts/units/#dimensionless-units` |
| REQ-UNIT-06 | Units are case sensitive (`kg` is valid, `KG` is not). | `docs:concepts/units/#case-sensitivity` |
| REQ-UNIT-07 | A supplier part pack quantity can be given in any unit compatible with the base part's unit and is converted to the base unit (base `metres`: `100 ft` = 30.48 m; `50 cm` and `12 inches` are also valid). | `docs:part/#supplier-part-units`, `docs:concepts/units/#supplier-part` |
| REQ-UNIT-08 | A pack quantity without units is assumed to be in the base part's units. | `docs:part/#supplier-part-units` |
| REQ-UNIT-09 | If a pack quantity uses an incompatible unit type, an error is displayed. | `docs:part/#supplier-part-units` |
| REQ-UNIT-10 | A parameter template's *Units* field is optional and must be a valid physical unit. Templates are created in *Settings* > *Parameters* > *New Parameter*. | `docs:concepts/parameters/#parameter-templates`, `#create-template` |
| REQ-UNIT-11 | Parameter values for a template with units must be in compatible units and may be entered in any compatible unit (for example, a different SI prefix). | `docs:concepts/parameters/#parameter-units` |
| REQ-UNIT-12 | Engineering notation is valid: `10k3` = 10,300; `10M3` = 10,000,000; `3n02` = 0.00000000302. | `docs:concepts/units/#engineering-notation` |
| REQ-UNIT-13 | Scientific notation is valid and case sensitive: `1E-3`, `1E3`, and `-123.45E-3` are valid; `1e3` is not. | `docs:concepts/units/#scientific-notation` |
| REQ-UNIT-14 | Feet and inches shorthand is valid (`3'` = 3 feet, `6"` = 6 inches); compound measurements such as `3'6"` are not supported. | `docs:concepts/units/#feet-and-inches` |

## Part Units

### UI-UNIT-001: Default unit of a new part
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** Logged in with Part "create" permission. A test-owned category.
- **Steps:**
  1. Open the *Add Part* form in the test-owned category.
  2. Fill in the required fields, leave *Units* unchanged, and submit.
  3. Open the new part's details (*Show Part Details*) and check *Units*.
- **Expected result:** The part is created and is tracked in dimensionless pieces. Whether *Units* is shown blank or as `pcs`: see OQ-CREATE-09.
- **Requirements:** REQ-UNIT-01
- **Source:** `docs:part/#units-of-measure`, `docs:part/views/#part-details`

### UI-UNIT-002: Built-in custom units can be used as part units
- **Priority:** P2
- **Type:** Positive (data-driven)
- **Preconditions:** Logged in with Part "create" permission. A test-owned category.
- **Steps:** For each unit in `piece`, `each`, `dozen`, `hundred`, `thousand`:
  1. Open the *Add Part* form, fill in the required fields, and set *Units* to the unit.
  2. Submit and open the part's details.
- **Expected result:** Each part is created without a form error and its *Units* shows the unit exactly as entered.
- **Requirements:** REQ-UNIT-03, REQ-UNIT-02
- **Source:** `docs:concepts/units/#built-in-custom-units`

## Custom Units

### UI-UNIT-003: Create a custom unit linked to an existing unit and use it on a part
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** Logged in as a user who can change global settings. No unit named `qa_span` exists.
- **Steps:**
  1. Open the settings panel and select the *Physical Units* tab.
  2. Create a custom unit named `qa_span` with definition `0.5 m` (form fields: OQ-UNIT-01) and submit.
  3. Open the *Add Part* form, fill in the required fields, set *Units* to `qa_span`, and submit.
- **Expected result:** `qa_span` is listed in the *Physical Units* tab. The part is created without a form error and its *Units* shows `qa_span`.
- **Requirements:** REQ-UNIT-04, REQ-UNIT-02
- **Source:** `docs:concepts/units/#custom-units`, `#create-custom-units`

### UI-UNIT-004: Create a dimensionless custom unit
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** As UI-UNIT-003. No unit named `qa_reel` exists.
- **Steps:**
  1. In the *Physical Units* tab, create a custom unit named `qa_reel` with definition `1` and submit.
  2. Create a test-owned part with *Units* set to `qa_reel`.
- **Expected result:** `qa_reel` is listed in the *Physical Units* tab and the part is created with *Units* `qa_reel`.
- **Requirements:** REQ-UNIT-05, REQ-UNIT-04
- **Source:** `docs:concepts/units/#dimensionless-units`

### UI-UNIT-005: Dimensionless custom unit without the literal `1` definition
- **Priority:** P3
- **Type:** Negative
- **Preconditions:** As UI-UNIT-003. No unit named `qa_tray` exists.
- **Steps:**
  1. In the *Physical Units* tab, create a custom unit named `qa_tray` with an empty definition.
  2. Submit.
- **Expected result:** See OQ-UNIT-02.
- **Requirements:** REQ-UNIT-05
- **Source:** `docs:concepts/units/#dimensionless-units`

### UI-UNIT-006: Edit a custom unit definition
- **Priority:** P3
- **Type:** Positive
- **Preconditions:** As UI-UNIT-003, with test-owned custom unit `qa_span` (definition `0.5 m`) not used by any part.
- **Steps:**
  1. In the *Physical Units* tab, edit `qa_span` and change the definition to `0.25 m`.
  2. Submit and reopen the unit.
- **Expected result:** The unit's definition is `0.25 m`.
- **Requirements:** REQ-UNIT-04
- **Source:** `docs:concepts/units/#create-custom-units`

### UI-UNIT-007: Custom unit names are case sensitive
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** As UI-UNIT-003, with test-owned custom unit `qa_span`. No unit named `QA_SPAN` exists.
- **Steps:**
  1. Open the *Add Part* form, fill in the required fields, and set *Units* to `QA_SPAN`.
  2. Submit.
- **Expected result:** `QA_SPAN` is not a valid unit: the form is not submitted, a form error is displayed, and no part is created (same unconfirmed local behavior as UI-CREATE-008; see README Open Review Findings).
- **Requirements:** REQ-UNIT-06, REQ-UNIT-04
- **Source:** `docs:concepts/units/#case-sensitivity`

### UI-UNIT-008: Delete a custom unit that is in use
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** As UI-UNIT-003, with test-owned custom unit `qa_span` and a test-owned part whose *Units* is `qa_span`.
- **Steps:**
  1. In the *Physical Units* tab, delete `qa_span`.
  2. Open the test-owned part's detail page and check *Units*.
  3. Open the part's *Edit Part* form and submit it unchanged.
- **Expected result:** See OQ-UNIT-03.
- **Requirements:** REQ-UNIT-04
- **Source:** `docs:concepts/units/#create-custom-units`

## Supplier Part Units

Preconditions shared by this group: logged in with permission to create supplier parts; a test-owned supplier company; a test-owned *Purchaseable* part (so the *Suppliers* tab is visible).

### UI-UNIT-009: Pack quantity in a compatible unit is converted to the base unit
- **Priority:** P1
- **Type:** Positive (data-driven)
- **Preconditions:** Shared group preconditions. The part's *Units* is `m`.
- **Steps:** For each pack quantity in `100 ft`, `50 cm`, `12 inches`:
  1. Open the part's *Suppliers* tab and add a supplier part for the test-owned supplier.
  2. Enter the pack quantity and submit.
  3. Check the supplier part's pack quantity in base units (where shown: OQ-UNIT-04).
- **Expected result:** Each supplier part is saved without an error. The pack quantity converted to the base unit is 30.48 m, 0.5 m, and 0.3048 m respectively.
- **Requirements:** REQ-UNIT-07
- **Source:** `docs:part/#supplier-part-units`

### UI-UNIT-010: Pack quantity without units uses the base unit
- **Priority:** P2
- **Type:** Boundary
- **Preconditions:** Shared group preconditions. The part's *Units* is `m`.
- **Steps:**
  1. Open the part's *Suppliers* tab and add a supplier part.
  2. Enter pack quantity `25` (no unit) and submit.
  3. Check the pack quantity in base units (OQ-UNIT-04).
- **Expected result:** The supplier part is saved without an error and its pack quantity is 25 m.
- **Requirements:** REQ-UNIT-08
- **Source:** `docs:part/#supplier-part-units`

### UI-UNIT-011: Pack quantity in an incompatible unit is rejected
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** Shared group preconditions. The part's *Units* is `m`.
- **Steps:**
  1. Open the part's *Suppliers* tab and add a supplier part.
  2. Enter pack quantity `5 kg` and submit.
- **Expected result:** An error is displayed, the form is not submitted, and no supplier part is created for the part.
- **Requirements:** REQ-UNIT-09
- **Source:** `docs:part/#supplier-part-units`

### UI-UNIT-012: Pack quantity with a physical unit for a part without units
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** Shared group preconditions. The part's *Units* is blank (dimensionless pieces).
- **Steps:**
  1. Open the part's *Suppliers* tab and add a supplier part.
  2. Enter pack quantity `100 ft` and submit.
- **Expected result:** See OQ-UNIT-05.
- **Requirements:** REQ-UNIT-01, REQ-UNIT-09
- **Source:** `docs:part/#supplier-part-units`

## Parameter Units

### UI-UNIT-013: Create a parameter template with a valid unit
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** Logged in as a user who can manage parameter templates. No template named `QA Length` exists.
- **Steps:**
  1. Open *Settings* > *Parameters* and select *New Parameter*.
  2. Enter *Name* `QA Length` and *Units* `mm`, and submit.
- **Expected result:** The template is listed with units `mm`.
- **Requirements:** REQ-UNIT-10
- **Source:** `docs:concepts/parameters/#create-template`

### UI-UNIT-014: Reject a parameter template with an invalid unit
- **Priority:** P2
- **Type:** Negative (data-driven)
- **Preconditions:** As UI-UNIT-013. No templates named `QA Bad Unit 1` or `QA Bad Unit 2` exist.
- **Steps:** For each *Units* value in `KG` (wrong case), `qa_not_a_unit` (undefined):
  1. Open *Settings* > *Parameters* and select *New Parameter*.
  2. Enter a unique *Name* and the *Units* value, and submit.
- **Expected result:** The form is not submitted, a form error is displayed, and no template is created.
- **Requirements:** REQ-UNIT-10, REQ-UNIT-06
- **Source:** `docs:concepts/parameters/#parameter-templates`, `docs:concepts/units/#case-sensitivity`

### UI-UNIT-015: Parameter value in a compatible unit is accepted
- **Priority:** P2
- **Type:** Positive (data-driven)
- **Preconditions:** A test-owned part and a test-owned parameter template with units `m`.
- **Steps:** For each value in `25 mm`, `2 km`, `12 inches`:
  1. Open the part's *Parameters* tab and select *New Parameter*.
  2. Select the template, enter the value in *Data*, and submit. Delete the parameter before the next value.
- **Expected result:** Each value is accepted and the parameter is listed in the *Parameters* tab.
- **Requirements:** REQ-UNIT-11
- **Source:** `docs:concepts/parameters/#parameter-units`

### UI-UNIT-016: Engineering notation in parameter values
- **Priority:** P2
- **Type:** Positive (data-driven)
- **Preconditions:** A test-owned part and a test-owned parameter template with units `ohm`.
- **Steps:** For each value in `10k3`, `10M3`, `3n02`: add a parameter for the template with that value as in UI-UNIT-015, then delete it.
- **Expected result:** Each value is accepted and the parameter is listed in the *Parameters* tab.
- **Requirements:** REQ-UNIT-12, REQ-UNIT-11
- **Source:** `docs:concepts/units/#engineering-notation`

### UI-UNIT-017: Scientific notation in parameter values
- **Priority:** P3
- **Type:** Positive (data-driven)
- **Preconditions:** As UI-UNIT-016.
- **Steps:** For each value in `1E-3`, `1E3`, `-123.45E-3`: add a parameter for the template with that value, then delete it.
- **Expected result:** Each value is accepted and the parameter is listed in the *Parameters* tab.
- **Requirements:** REQ-UNIT-13
- **Source:** `docs:concepts/units/#scientific-notation`

### UI-UNIT-018: Lowercase scientific notation
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** As UI-UNIT-016.
- **Steps:** Add a parameter for the template with value `1e3`.
- **Expected result:** See OQ-UNIT-06. The documentation states only that `1e3` is not a valid value.
- **Requirements:** REQ-UNIT-13
- **Source:** `docs:concepts/units/#scientific-notation`

### UI-UNIT-019: Feet and inches shorthand in parameter values
- **Priority:** P3
- **Type:** Positive (data-driven)
- **Preconditions:** A test-owned part and a test-owned parameter template with units `m`.
- **Steps:** For each value in `3'`, `6"`: add a parameter for the template with that value, then delete it.
- **Expected result:** Each value is accepted and the parameter is listed in the *Parameters* tab.
- **Requirements:** REQ-UNIT-14, REQ-UNIT-11
- **Source:** `docs:concepts/units/#feet-and-inches`

### UI-UNIT-020: Compound feet and inches value
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** As UI-UNIT-019.
- **Steps:** Add a parameter for the template with value `3'6"`.
- **Expected result:** See OQ-UNIT-07. The documentation states only that compound measurements are not supported.
- **Requirements:** REQ-UNIT-14
- **Source:** `docs:concepts/units/#feet-and-inches`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Part units | 0 | 1 | 1 | 2 |
| Custom units | 1 | 2 | 3 | 6 |
| Supplier part units | 2 | 1 | 1 | 4 |
| Parameter units | 0 | 4 | 4 | 8 |
| **Total** | **3** | **8** | **9** | **20** |

All 14 requirements (REQ-UNIT-01 to REQ-UNIT-14) are covered. REQ-UNIT-06 is also covered for part units by UI-CREATE-008, and incompatible parameter units by UI-TAB-016.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-UNIT-01 | Which fields does the *Physical Units* create form have (name, definition, symbol?) and which are required? `concepts/units/` shows only the tab and the dimensionless `1` definition; it does not show the tab exists in local 1.6.3. | UI-UNIT-003 to UI-UNIT-008 | Open |
| OQ-UNIT-02 | What happens when a custom unit is created with an empty (or non-`1`) definition: a form error, or a unit that is not dimensionless? | UI-UNIT-005 | Open |
| OQ-UNIT-03 | What happens when a custom unit used by a part (or parameter template) is deleted: is the delete blocked, or does the part keep an unresolvable unit that then fails validation on save? | UI-UNIT-008 | Open |
| OQ-UNIT-04 | Where does the UI show a supplier part's pack quantity converted to the base unit? | UI-UNIT-009, UI-UNIT-010 | Open |
| OQ-UNIT-05 | Is a pack quantity with a physical unit (`100 ft`) accepted for a part with blank (dimensionless) units, or rejected as incompatible? | UI-UNIT-012 | Open |
| OQ-UNIT-06 | Is `1e3` rejected with an error, or accepted with a different meaning (pint may read `e` as a unit)? | UI-UNIT-018 | Open |
| OQ-UNIT-07 | Is the compound value `3'6"` rejected with an error, or accepted with a different value? | UI-UNIT-020 | Open |

Related open questions in other areas: OQ-CREATE-09 (default unit, UI-UNIT-001) and OQ-TAB-08 (parameter unit validation setting, UI-UNIT-015 to UI-UNIT-020).
