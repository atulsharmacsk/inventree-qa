# UI Manual Tests: Part Revisions

Covers creating part revisions and the revision restrictions: circular references, unique revision codes, template parts, template references, and the revision settings. Index, shared assumptions, and overall coverage: [ui-manual-tests.md](../ui-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`.

**Out of scope here (one home per concern):**
- The *Select Part Revision* drop-down and navigating between revisions → UI-TAB-020 and UI-TAB-021 in [part-detail-tabs.md](part-detail-tabs.md). Whether a separate *Revisions* tab exists → OQ-TAB-02.
- Creating variants of a template part → UI-TAB-019. Enabling *Template* → UI-ATTR-001.
- Name uniqueness when revisions share a name → OQ-CREATE-04 in [part-creation.md](part-creation.md).

**Default settings for every case unless stated:** *Part Revisions* is enabled and *Assembly Revision Only* is disabled (both documented defaults). Cases that change a setting restore its original value.

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:part/revision/` | Revisions are parts; revision fields; restrictions (circular references, unique revisions, template revisions, template references); revision settings; creating a revision |
| `docs:part/template/` | Template and variant setup used in the template-restriction preconditions |
| `docs:part/create/` | Form errors must be fixed before the form can be submitted |

Also checked: the root `README.md` (Open Review Findings, including the required revision-of-revision scenario) and the open questions in the other UI area files (OQ-TAB-02, OQ-CREATE-04).

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-REV-01 | A revision is itself a part with its own part number, stock items, parameters, and BOM; it is linked to the original part. Data that refers to the original part (stock items, build orders, purchase orders) is not affected by creating a revision. | `docs:part/revision/#part-revisions`, `#revisions-are-parts` |
| REQ-REV-02 | Each part has a *Revision* field (user-defined, any string) and a *Revision Of* field (the part this part is a revision of). | `docs:part/revision/#revision-fields` |
| REQ-REV-03 | A revision is created from the part actions menu with *Duplicate Part*: set *Revision Of* to the original part and *Revision* to a unique code, then submit. The user is redirected to the new revision, which is linked to the original part. | `docs:part/revision/#create-a-revision` |
| REQ-REV-04 | A part cannot be a revision of itself (circular reference). | `docs:part/revision/#revision-restrictions` |
| REQ-REV-05 | A part cannot have two revisions with the same revision code; each revision of a given part must have a unique code. | `docs:part/revision/#revision-restrictions` |
| REQ-REV-06 | A template part cannot have revisions. Variant parts can have revisions. | `docs:part/revision/#revision-restrictions` |
| REQ-REV-07 | A revision of a variant part must point to the same template as the original part. | `docs:part/revision/#revision-restrictions` |
| REQ-REV-08 | *Part Revisions* (default `True`) enables the revision field for parts. *Assembly Revision Only* (default `False`) only allows revisions for assembly parts. | `docs:part/revision/#revision-settings` |
| REQ-REV-09 | If a part form has errors, they must be fixed before the form can be submitted. | `docs:part/create/#create-part-form` |

## Creating Revisions

### UI-REV-001: Create a revision with Duplicate Part
- **Priority:** P1
- **Type:** Positive
- **Preconditions:** A test-owned, non-template part A with no revisions.
- **Steps:**
  1. Open part A's detail page and open the part actions menu.
  2. Select *Duplicate Part*.
  3. Set *Revision Of* to part A and *Revision* to a unique code, for example `B`.
  4. Press *Submit*.
- **Expected result:** The form submits without errors and the browser opens the new part's detail page. The new part's *Revision* is `B` and its *Revision Of* is part A.
- **Requirements:** REQ-REV-03, REQ-REV-02
- **Source:** `docs:part/revision/#create-a-revision`

### UI-REV-002: A revision is a separate part and leaves the original's data unchanged
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned, non-template part A with one test-owned stock item of known quantity.
- **Steps:**
  1. Note part A's stock quantity.
  2. Create revision `B` of part A as in UI-REV-001.
  3. On the revision's detail page, check its stock.
  4. Open part A's detail page and check its stock.
- **Expected result:** The revision has its own part detail page with no stock items. Part A's stock item and quantity are unchanged.
- **Requirements:** REQ-REV-01
- **Source:** `docs:part/revision/#part-revisions`, `#revisions-are-parts`

### UI-REV-003: Revision code accepts any string
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** A test-owned, non-template part A with no revisions.
- **Steps:** Create a revision of part A as in UI-REV-001 with *Revision* set to a code containing letters, digits, spaces, punctuation, and a non-ASCII character, for example `Rev 2.1-β`.
- **Expected result:** The revision is created and its *Revision* shows the code exactly as entered.
- **Requirements:** REQ-REV-02
- **Source:** `docs:part/revision/#revision-fields`

### UI-REV-004: Create several revisions of the same part
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned, non-template part A with no revisions.
- **Steps:**
  1. Create revision `B` of part A as in UI-REV-001.
  2. Return to part A and create revision `C` of part A the same way.
- **Expected result:** Both revisions are created. Each has *Revision Of* set to part A and its own *Revision* code.
- **Requirements:** REQ-REV-03, REQ-REV-05
- **Source:** `docs:part/revision/#create-a-revision`

## Revision Restrictions

### UI-REV-005: A part cannot be a revision of itself
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** A test-owned, non-template part A with no revisions.
- **Steps:**
  1. Open part A's detail page and open the *Edit Part* form (see OQ-REV-01).
  2. Set *Revision Of* to part A and *Revision* to a unique code.
  3. Press *Submit*.
- **Expected result:** The form shows an error and is not submitted (OQ-REV-05 for where the error appears). Part A's *Revision Of* stays empty.
- **Requirements:** REQ-REV-04, REQ-REV-09
- **Source:** `docs:part/revision/#revision-restrictions`

### UI-REV-006: Two parts cannot be revisions of each other
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** A test-owned part A and its test-owned revision B (*Revision Of* = A).
- **Steps:**
  1. Open part A's *Edit Part* form (see OQ-REV-01).
  2. Set *Revision Of* to part B and *Revision* to a unique code.
  3. Press *Submit*.
- **Expected result:** See OQ-REV-02.
- **Requirements:** REQ-REV-04
- **Source:** `docs:part/revision/#revision-restrictions`

### UI-REV-007: Create a revision of a revision
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** A test-owned part A and its test-owned revision B (*Revision Of* = A, *Revision* `B`).
- **Steps:**
  1. Open revision B's detail page and select *Duplicate Part*.
  2. Set *Revision Of* to revision B and *Revision* to `C`.
  3. Press *Submit*.
- **Expected result:** See OQ-REV-03.
- **Requirements:** REQ-REV-03, REQ-REV-04
- **Source:** `docs:part/revision/#revision-restrictions`

### UI-REV-008: Reject a duplicate revision code for the same part
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** A test-owned part A with test-owned revision `B`.
- **Steps:**
  1. Open part A's detail page and select *Duplicate Part*.
  2. Set *Revision Of* to part A and *Revision* to `B`.
  3. Press *Submit*.
- **Expected result:** The form shows an error and is not submitted (OQ-REV-05). Part A still has exactly one revision with code `B`.
- **Requirements:** REQ-REV-05, REQ-REV-09
- **Source:** `docs:part/revision/#revision-restrictions`

### UI-REV-009: The same revision code is allowed for different parts
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** Test-owned parts A and X; part A has test-owned revision `B`; part X has no revisions.
- **Steps:** Create a revision of part X as in UI-REV-001 with *Revision* set to `B`.
- **Expected result:** The revision is created with *Revision Of* = X and *Revision* `B`. Part A's revision is unchanged.
- **Requirements:** REQ-REV-05
- **Source:** `docs:part/revision/#revision-restrictions` ("each revision (of a given part)")

## Template Restrictions

### UI-REV-010: A template part cannot have revisions
- **Priority:** P1
- **Type:** Negative
- **Preconditions:** A test-owned template part T (*Template* on).
- **Steps:**
  1. Open part T's detail page and select *Duplicate Part*.
  2. Set *Revision Of* to part T and *Revision* to a unique code.
  3. Press *Submit*.
- **Expected result:** The form shows an error and is not submitted (OQ-REV-05). Part T has no revisions.
- **Requirements:** REQ-REV-06, REQ-REV-09
- **Source:** `docs:part/revision/#revision-restrictions`

### UI-REV-011: A variant part can have a revision
- **Priority:** P2
- **Type:** Positive
- **Preconditions:** A test-owned template part T and its test-owned variant V (*Variant Of* = T).
- **Steps:**
  1. Open variant V's detail page and select *Duplicate Part*.
  2. Set *Revision Of* to variant V, *Revision* to a unique code, and keep *Variant Of* as part T.
  3. Press *Submit*.
- **Expected result:** The revision is created with *Revision Of* = V and *Variant Of* = T.
- **Requirements:** REQ-REV-06, REQ-REV-07
- **Source:** `docs:part/revision/#revision-restrictions`

### UI-REV-012: A revision of a variant must point to the same template
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** Test-owned template parts T and T2; a test-owned variant V of T.
- **Steps:**
  1. Open variant V's detail page and select *Duplicate Part*.
  2. Set *Revision Of* to variant V, *Revision* to a unique code, and *Variant Of* to template T2.
  3. Press *Submit*.
- **Expected result:** The form shows an error and is not submitted (OQ-REV-05). Variant V has no revisions.
- **Requirements:** REQ-REV-07, REQ-REV-09
- **Source:** `docs:part/revision/#revision-restrictions`

## Revision Settings

### UI-REV-013: Revision field is not available when Part Revisions is disabled
- **Priority:** P3
- **Type:** Boundary
- **Preconditions:** *Part Revisions* is disabled; restore it afterwards. A test-owned, non-template part A.
- **Steps:** Open part A's detail page, select *Duplicate Part*, and check the form fields.
- **Expected result:** The *Revision* field is not available. For *Revision Of*, see OQ-REV-04.
- **Requirements:** REQ-REV-08
- **Source:** `docs:part/revision/#revision-settings`

### UI-REV-014: Assembly Revision Only limits revisions to assemblies
- **Priority:** P2
- **Type:** Negative
- **Preconditions:** *Assembly Revision Only* is enabled; restore it afterwards. A test-owned assembly part A (*Assembly* on) and a test-owned non-assembly part N, both non-template.
- **Steps:** For each part, select *Duplicate Part*, set *Revision Of* to that part and *Revision* to a unique code, and press *Submit*.

  | Part | Expected |
  |---|---|
  | A (assembly) | The revision is created with *Revision Of* = A |
  | N (not an assembly) | The form shows an error and is not submitted (OQ-REV-05); N has no revisions |

- **Expected result:** As in the table.
- **Requirements:** REQ-REV-08, REQ-REV-09
- **Source:** `docs:part/revision/#revision-settings`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Creating Revisions | 1 | 2 | 1 | 4 |
| Revision Restrictions | 3 | 1 | 1 | 5 |
| Template Restrictions | 1 | 2 | 0 | 3 |
| Revision Settings | 0 | 1 | 1 | 2 |
| **Total** | **5** | **6** | **3** | **14** |

All 9 requirements are covered by at least one case.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-REV-01 | Can *Revision Of* be changed on an existing part in the *Edit Part* form? The documentation only describes setting it in the *Duplicate Part* form. If it cannot, the self-reference and mutual-reference checks can only be tested through the API. | UI-REV-005, UI-REV-006 | Open |
| OQ-REV-02 | Is an indirect circular reference (A a revision of B while B is a revision of A) rejected? The documentation only forbids a part being a revision of itself. | UI-REV-006 | Open |
| OQ-REV-03 | Can a revision have its own revisions? The documentation does not say whether *Revision Of* must point to an original part rather than to another revision. Required by the assessment's negative scenarios (revision-of-revision prevention). | UI-REV-007 | Open |
| OQ-REV-04 | When *Part Revisions* is disabled, is *Revision Of* also hidden, and what happens to existing revisions and the revision selector? The setting is described only as "Enable revision field for Part". | UI-REV-013 | Open |
| OQ-REV-05 | How is a revision restriction shown: as an error on the *Revision Of* or *Revision* field, or as a form-level error? The documentation only says form errors must be fixed before submitting. | UI-REV-005, 008, 010, 012, 014 | Open |
