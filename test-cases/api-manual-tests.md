# API Manual Test Cases

Application: InvenTree, Part and Part Category API. Sources: API contract from the [API schema](https://docs.inventree.org/en/stable/api/schema/#api-schema-documentation) category pages (API version 561); functional behavior from the Parts documentation. Local instance: InvenTree 1.6.3 (API 561) at `http://localhost`. Cases are split into one file per feature area under [api/](api/). This page is the index and overall coverage summary.

## Areas

Areas are listed in suggested run order.

| Area | File | ID prefix | Minimum coverage | Status | P1 | P2 | P3 | Total | Open questions |
|---|---|---|---|---|---|---|---|---|---|
| Parts CRUD | [parts-crud.md](api/parts-crud.md) | `API-PART` | Create, retrieve, update, delete | Drafted | 5 | 5 | 2 | 12 | 3 |
| Part Categories CRUD | [categories-crud.md](api/categories-crud.md) | `API-CAT` | Create, retrieve, update, delete | Drafted | 7 | 6 | 3 | 16 | 3 |
| Field-level validation | [field-validation.md](api/field-validation.md) | `API-VAL` | Required, maximum-length, nullable, and read-only fields | Drafted | 6 | 9 | 6 | 21 | 0 |
| Parts list | [parts-list.md](api/parts-list.md) | `API-LIST` | Filtering, pagination, search | Drafted | 4 | 8 | 4 | 16 | 1 |
| Relational integrity | [relational-integrity.md](api/relational-integrity.md) | `API-REL` | Category assignment, default locations, supplier linkage | Drafted | 4 | 6 | 5 | 15 | 0 |
| Edge cases | [edge-cases.md](api/edge-cases.md) | `API-EDGE` | Invalid payloads, unauthorized access, conflict scenarios | Drafted | 6 | 6 | 3 | 15 | 0 |
| **Total** | | | | | **32** | **40** | **23** | **95** | **7** |

Open questions count only those still open (2026-10-31): OQ-PART-01 (partly), 04, 05; OQ-ACAT-04, 05, 07; OQ-LIST-05. None of them blocks an automated test.

## Automation Candidates

| Area | Ready | Ready after an open question is resolved |
|---|---|---|
| Parts CRUD | API-PART-001, 002, 003, 005, 007, 008, 009, 010, 011 | - |
| Part Categories CRUD | API-CAT-001, 002, 003, 004, 005, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016 | Application finding (`fixme`): API-CAT-014 without a request body (OQ-ACAT-03) |
| Field-level validation | API-VAL-001 to 021 (API-VAL-008 `icon` is a format check, OQ-VAL-04) | - |
| Parts list | API-LIST-001, 002, 003, 005, 006, 007, 008, 010, 011, 012, 013, 014, 015, 016 | Application findings (`fixme`): API-LIST-004 (OQ-LIST-02), API-LIST-009 (OQ-LIST-06) |
| Relational integrity | API-REL-001 to 015 | - |
| Edge cases | API-EDGE-001, 002, 003, 004, 008, 009, 010, 011, 013, 014 (duplicates allowed), 015 | API-EDGE-007 (application finding: malformed JSON returns 500, OQ-EDGE-02); 012 (needs `PART_ENABLE_LOCKING` off); 014 duplicates-not-allowed row (OQ-CREATE-08, needs `PART_ALLOW_DUPLICATE_IPN` off). Not candidates: 005, 006 (need a view-only user) |

## Shared Assumptions

- Requests use test-owned data and remove only those records.
- Expected results come from the schema. Differences seen on the local 1.6.3 instance are recorded as findings in the area file.