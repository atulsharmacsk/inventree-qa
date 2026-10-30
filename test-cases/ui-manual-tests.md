# UI Manual Test Cases

Application: InvenTree, Parts module. Local instance: InvenTree 1.6.3 at `http://localhost`; the stable documentation may describe a newer version. Cases are split into one file per feature area under [ui/](ui/). This page is the index and overall coverage summary.

## Areas

| Area | File | ID prefixes | Minimum coverage | Status | P1 | P2 | P3 | Total | Open questions |
|---|---|---|---|---|---|---|---|---|---|
| Part creation (manual entry and import) | [part-creation.md](ui/part-creation.md) | `UI-CREATE`, `UI-IMPORT` | Manual entry and import flows | Drafted | 11 | 11 | 7 | 29 | 8 |
| Part detail view tabs | [part-detail-tabs.md](ui/part-detail-tabs.md) | `UI-TAB` | Stock, BOM, Allocated, Build Orders, Parameters, Variants, Revisions, Attachments, Related Parts, Test Templates | Drafted | 8 | 13 | 7 | 28 | 8 |
| Part categories | [part-categories.md](ui/part-categories.md) | `UI-CAT` | Hierarchy, filtering, parametric tables | Drafted | 3 | 10 | 6 | 19 | 7 |
| Part attributes | [part-attributes.md](ui/part-attributes.md) | `UI-ATTR` | Virtual, Template, Assembly, Component, Trackable, Purchaseable, Salable, Active/Inactive, and how each changes tabs and actions | Drafted | 5 | 9 | 4 | 18 | 7 |
| Units of measure | [units-of-measure.md](ui/units-of-measure.md) | `UI-UNIT` | Units of measure configuration | Drafted | 3 | 8 | 9 | 20 | 7 |
| Part revisions | [part-revisions.md](ui/part-revisions.md) | `UI-REV` | Creation; constraints: circular references, unique revision codes, template restrictions | Drafted | 5 | 6 | 3 | 14 | 5 |
| **Total** | | | | | **35** | **57** | **36** | **128** | **42** |

## Required Negative and Boundary Scenarios

The assessment names these scenarios explicitly. Each is covered in its feature area's file.

| Scenario | Covered by |
|---|---|
| Duplicate IPN | UI-CREATE-016 in [part-creation.md](ui/part-creation.md); expected result pending OQ-CREATE-08 |
| Inactive part restrictions | UI-ATTR-013 in [part-attributes.md](ui/part-attributes.md); expected result pending OQ-ATTR-05 |
| Revision-of-revision prevention | UI-REV-007 in [part-revisions.md](ui/part-revisions.md); expected result pending OQ-REV-03 |

## Shared Assumptions

- Tests use test-owned categories, locations, companies, and parts, and remove only those records.
- Expected results describe the stable documentation. Differences seen on the local 1.6.3 instance are recorded as findings in the area file.