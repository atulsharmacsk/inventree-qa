# API Manual Test Cases

Application: InvenTree, Part and Part Category API. Sources: API contract from the [API schema](https://docs.inventree.org/en/stable/api/schema/#api-schema-documentation) category pages (API version 561); functional behavior from the Parts documentation. Local instance: InvenTree 1.6.3 (API 561) at `http://localhost`. Cases are split into one file per feature area under [api/](api/). This page is the index and overall coverage summary.

## Areas

Areas are listed in suggested run order.

| Area | File | ID prefix | Minimum coverage | Status | P1 | P2 | P3 | Total | Open questions |
|---|---|---|---|---|---|---|---|---|---|
| Parts CRUD | [parts-crud.md](api/parts-crud.md) | `API-PART` | Create, retrieve, update, delete | Drafted | 5 | 5 | 2 | 12 | 4 |
| Part Categories CRUD | [categories-crud.md](api/categories-crud.md) | `API-CAT` | Create, retrieve, update, delete | Drafted | 7 | 6 | 3 | 16 | 4 |
| Field-level validation | [field-validation.md](api/field-validation.md) | `API-VAL` | Required, maximum-length, nullable, and read-only fields | Drafted | 6 | 9 | 6 | 21 | 2 |
| Parts list | [parts-list.md](api/parts-list.md) | `API-LIST` | Filtering, pagination, search | Drafted | 4 | 8 | 4 | 16 | 4 |
| Relational integrity | [relational-integrity.md](api/relational-integrity.md) | `API-REL` | Category assignment, default locations, supplier linkage | Drafted | 4 | 6 | 5 | 15 | 5 |
| Edge cases | [edge-cases.md](api/edge-cases.md) | `API-EDGE` | Invalid payloads, unauthorized access, conflict scenarios | Drafted | 6 | 6 | 3 | 15 | 3 |
| **Total** | | | | | **32** | **40** | **23** | **95** | **22** |

## Automation Candidates

| Area | Ready | Ready after an open question is resolved |
|---|---|---|
| Parts CRUD | API-PART-001, 002, 005, 007, 008, 009, 010, 011 | API-PART-003 (OQ-PART-03) |
| Part Categories CRUD | API-CAT-001, 002, 003, 004, 005, 007, 008, 009, 010, 011, 012, 014, 016 | API-CAT-013 (OQ-ACAT-02), API-CAT-015 (OQ-ACAT-06). Application finding (`fixme`): API-CAT-014 without a request body (OQ-ACAT-03) |
| Field-level validation | API-VAL-001, 002, 004, 005, 006, 007, 008 (all rows except `icon`), 009, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021 | API-VAL-003 (OQ-VAL-03), 008 `icon` row (OQ-VAL-04) |
| Parts list | API-LIST-001, 002, 005, 006, 007, 008, 010, 011, 012, 013, 016 | API-LIST-003 (OQ-LIST-01), API-LIST-014 (OQ-LIST-04), API-LIST-015 (OQ-LIST-03). Application findings (`fixme`): API-LIST-004 (OQ-LIST-02), API-LIST-009 (OQ-LIST-06) |
| Relational integrity | API-REL-001, 002, 003, 005, 006, 007, 009, 010, 013, 014 | API-REL-004 (OQ-REL-01), 008 (OQ-REL-02), 011 (OQ-REL-03), 012 (OQ-REL-04), 015 (OQ-REL-05) |
| Edge cases | API-EDGE-001, 002, 003, 004, 008, 009, 010, 012 | API-EDGE-007 (application finding: malformed JSON returns 500, OQ-EDGE-02), 011 (OQ-EDGE-04), 013 (OQ-EDGE-05), 014 (OQ-CREATE-08), 015 (OQ-EDGE-06). Not candidates: 005, 006 (need a view-only user) |

## Shared Assumptions

- Requests use test-owned data and remove only those records.
- Expected results come from the schema. Differences seen on the local 1.6.3 instance are recorded as findings in the area file.