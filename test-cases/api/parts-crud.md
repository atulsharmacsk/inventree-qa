# API Manual Tests: Parts CRUD

Covers creating, retrieving, updating, and deleting parts through the Part API. Index, shared assumptions, and overall coverage: [api-manual-tests.md](../api-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`. Schema operations are cited as they appear on `docs:api/schema/part/` (for example, `POST /api/part/`).

**Version check:** the schema page documents API version 561; the local instance reports `apiVersion` 561 at `http://localhost/api/`. No mismatch.

**Out of scope here (one home per concern):** field limits, nullability, and read-only fields → Field-level validation. Filtering, pagination, and search → Parts list. Category, location, and supplier links → Relational integrity. Unauthenticated access, invalid payloads, and conflicts → Edge cases.

## Endpoints

| Method | Path | Documented response |
|---|---|---|
| `GET` | `/api/part/` | 200, paginated: `count` (integer) and `results` (array of Part) required; `next`/`previous` nullable URIs |
| `POST` | `/api/part/` | 201, Part |
| `GET` | `/api/part/{id}/` | 200, Part. Optional boolean query flags (default `false`): `category_detail`, `location_detail`, `parameters`, `path_detail`, `price_breaks`, `tags` |
| `PATCH` | `/api/part/{id}/` | 200, Part |
| `PUT` | `/api/part/{id}/` | 200, Part |
| `DELETE` | `/api/part/{id}/` | 204, no content |
| `PATCH`, `PUT` | `/api/part/` | 200; custom list-level operations. Not covered (OQ-PART-05) |

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:api/schema/` | Schema categories and API version |
| `docs:api/schema/part/` | Part endpoints, methods, success statuses, request and response schemas, write-only `initial_stock` and `duplicate` |
| `docs:part/create/` | Parts can be created through the REST API; initial stock behavior |
| `docs:part/` | Part attributes; total stock is the sum of stock items |

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-APART-01 | `POST /api/part/` creates a part and returns 201 with a Part body. The response always includes `barcode_hash`, `full_name`, `name`, `pk`, `starred`, and `thumbnail`; `category_name` is included only when the part has a category (OQ-PART-06). | `docs:api/schema/part/` `POST /api/part/`; `category_name`: Local 1.6.3, confirmed by user (2026-10-29) |
| REQ-APART-02 | `name` is the only writable field listed as required; other writable fields are optional (`IPN` and `revision` default to `""`). | `docs:api/schema/part/` Part schema |
| REQ-APART-03 | `GET /api/part/{id}/` returns 200 with a Part body and accepts optional boolean detail flags. | `docs:api/schema/part/` `GET /api/part/{id}/` |
| REQ-APART-04 | `GET /api/part/` with the required `limit` query parameter returns 200 with a paginated list (`count`, `results` required). | `docs:api/schema/part/` `GET /api/part/`; `limit` required per the local OpenAPI schema (`/api/schema/`, API 561) |
| REQ-APART-05 | `PATCH /api/part/{id}/` partially updates a part and returns 200 with a Part body. | `docs:api/schema/part/` `PATCH /api/part/{id}/` |
| REQ-APART-06 | `PUT /api/part/{id}/` updates a part and returns 200 with a Part body. | `docs:api/schema/part/` `PUT /api/part/{id}/` |
| REQ-APART-07 | `DELETE /api/part/{id}/` returns 204 No Content. | `docs:api/schema/part/` `DELETE /api/part/{id}/` |
| REQ-APART-08 | Write-only `initial_stock` (`location`, `quantity`) creates initial stock for the new part; a quantity of zero adds no stock. | `docs:api/schema/part/` InitialStock; `docs:part/create/#initial-stock` |
| REQ-APART-09 | Write-only `duplicate` (`original`, `copy_bom`, `copy_image`, `copy_notes`, `copy_parameters`, `copy_tests`) copies initial data from another part. | `docs:api/schema/part/` PartDuplicateOptions |
| REQ-APART-10 | Attribute flags `active`, `assembly`, `component`, `consumable`, `is_template`, `purchaseable`, `salable`, `testable`, `trackable`, and `virtual` are writable booleans. | `docs:api/schema/part/` Part schema; `docs:part/#part-attributes` |
| REQ-APART-11 | A part's total stock is the sum of its stock items. | `docs:part/#part-stock` |

## Create

### API-PART-001: Create a part with only a name
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** Authenticated user with Part create permission.
- **Request:** `POST /api/part/` with body `{"name": "<unique test name>"}`.
- **Expected status:** 201
- **Expected business result:** The body is a Part with the submitted `name`, an integer `pk`, and the response fields the schema lists as required (`barcode_hash`, `full_name`, `name`, `pk`, `starred`, `thumbnail`). `category_name` is absent because the part has no category (OQ-PART-06).
- **Requirements:** REQ-APART-01, REQ-APART-02
- **Sources:** schema `POST /api/part/`; `docs:part/create/#other-part-creation-methods`

### API-PART-002: Create a part with optional writable fields
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category.
- **Request:** `POST /api/part/` with `name`, `description`, `IPN`, `keywords`, `units` (`kg`), `category`, `minimum_stock`, `maximum_stock`, and `assembly: true`.
- **Expected status:** 201
- **Expected business result:** Each submitted value is returned unchanged in the response.
- **Requirements:** REQ-APART-01, REQ-APART-02, REQ-APART-10
- **Sources:** schema `POST /api/part/`, Part schema; `docs:part/#part-attributes`

### API-PART-003: Create a part with initial stock
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned stock location.
- **Request:** For each row, `POST /api/part/` with a unique `name` and `initial_stock: {"quantity": <q>, "location": <location id>}`, then `GET /api/part/{id}/`.

  | `quantity` | Expected stock |
  |---|---|
  | `5` | `total_in_stock` = 5 |
  | `0` | No stock added |
- **Expected status:** 201 for each create; 200 for each retrieve.
- **Expected business result:** The part's stock matches the table.
- **Requirements:** REQ-APART-08, REQ-APART-11
- **Sources:** schema InitialStock; `docs:part/create/#initial-stock`, `docs:part/#part-stock`; OQ-PART-03 (local 1.6.3, confirmed by user, 2026-10-31)
- **Open question:** OQ-PART-03 (resolved: the API applies `initial_stock` even when the *Initial Stock Data* setting is off).

### API-PART-004: Create a part by duplicating another part
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** No
- **Preconditions:** A test-owned original part with a description.
- **Request:** `POST /api/part/` with a unique `name` and `duplicate: {"original": <original id>, "copy_bom": false, "copy_image": false, "copy_notes": false, "copy_parameters": false, "copy_tests": false}`.
- **Expected status:** 201
- **Expected business result:** A new part is created with a different `pk`; the original part is unchanged.
- **Requirements:** REQ-APART-09
- **Sources:** schema PartDuplicateOptions

## Read

### API-PART-005: Retrieve a part by ID
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part with a description and IPN.
- **Request:** `GET /api/part/{id}/`
- **Expected status:** 200
- **Expected business result:** The returned Part has the same `pk` and the values submitted at creation.
- **Requirements:** REQ-APART-03
- **Sources:** schema `GET /api/part/{id}/`

### API-PART-006: Retrieve a part with detail flags
- **Priority:** P3
- **Type:** Boundary
- **Automation candidate:** No
- **Preconditions:** A test-owned part in a test-owned category.
- **Request:** `GET /api/part/{id}/` once with each flag set to `true`: `category_detail`, `path_detail`, `parameters`, `tags`.
- **Expected status:** 200 for each request.
- **Expected business result:** See OQ-PART-04.
- **Requirements:** REQ-APART-03
- **Sources:** schema `GET /api/part/{id}/`

### API-PART-007: List parts
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** At least one test-owned part exists.
- **Request:** `GET /api/part/?limit=<n>` (`limit` is a required query parameter in the schema).
- **Expected status:** 200
- **Expected business result:** The body has an integer `count` and a `results` array of Part objects; `next` and `previous` are URIs or null. Filtering and paging are covered in Parts list.
- **Requirements:** REQ-APART-04
- **Sources:** schema `GET /api/part/`

## Update

### API-PART-008: Partially update a part
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part with a description and IPN.
- **Request:** `PATCH /api/part/{id}/` with `{"description": "<new value>"}`, then `GET /api/part/{id}/`.
- **Expected status:** 200 for both.
- **Expected business result:** `description` has the new value; `name` and `IPN` are unchanged.
- **Requirements:** REQ-APART-05, REQ-APART-03
- **Sources:** schema `PATCH /api/part/{id}/`

### API-PART-009: Fully update a part
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part.
- **Request:** `PUT /api/part/{id}/` with a new unique `name` and a new `description`, then `GET /api/part/{id}/`.
- **Expected status:** 200 for both.
- **Expected business result:** The part has the new `name` and `description`.
- **Requirements:** REQ-APART-06
- **Sources:** schema `PUT /api/part/{id}/`

### API-PART-010: Update attribute flags
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part.
- **Request:** For each flag in REQ-APART-10, `PATCH /api/part/{id}/` setting it to the opposite of its current value, then `GET /api/part/{id}/`.
- **Expected status:** 200 for each request.
- **Expected business result:** Each flag holds the new value after the update.
- **Requirements:** REQ-APART-05, REQ-APART-10
- **Sources:** schema Part schema; `docs:part/#part-attributes`

## Delete

### API-PART-011: An active part must be made inactive before it is deleted
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned active part with no stock.
- **Request:** `DELETE /api/part/{id}/`; then `PATCH /api/part/{id}/` with `active=false`; then `DELETE /api/part/{id}/` again; then list parts by the part's name.
- **Expected status:** 400 for the first delete, 200 for the `PATCH`, 204 for the second delete. The status of a later `GET` of the deleted part is not asserted (OQ-PART-01).
- **Expected business result:** The first delete changes nothing and the part is still active. After the second delete the part no longer exists.
- **Requirements:** REQ-APART-07
- **Sources:** schema `DELETE /api/part/{id}/`; `docs:part/#active-parts`; Local 1.6.3, confirmed by user (2026-10-30)
- **Open question:** OQ-PART-02 (resolved).

### API-PART-012: Operations on a part that does not exist
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** No
- **Preconditions:** An ID that belongs to no part (for example, the ID of a part deleted in API-PART-011).
- **Request:** `GET`, `PATCH`, and `DELETE` on `/api/part/{id}/`.
- **Expected status:** See OQ-PART-01.
- **Expected business result:** No part is created or changed.
- **Requirements:** REQ-APART-03, REQ-APART-05, REQ-APART-07
- **Sources:** schema `GET`/`PATCH`/`DELETE /api/part/{id}/`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Create | 2 | 1 | 1 | 4 |
| Read | 1 | 1 | 1 | 3 |
| Update | 1 | 2 | 0 | 3 |
| Delete | 1 | 1 | 0 | 2 |
| **Total** | **5** | **5** | **2** | **12** |

All 11 requirements are covered by at least one case.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-PART-01 | Which status is returned for a part ID that does not exist? The schema documents only success responses. | API-PART-011, API-PART-012 | Partly resolved: `GET` of a part ID that does not exist returns 404 `No Part matches the given query.` (local 1.6.3, confirmed by user, 2026-10-30). `PATCH` and `DELETE` on a missing part are not yet observed; API-PART-012 is not an automation candidate. |
| OQ-PART-02 | Can an active part be deleted, or must it be made inactive first? The schema documents only 204; `docs:part/#active-parts` recommends marking obsolete parts inactive but states no restriction. | API-PART-011 | Resolved: intended behaviour. Deleting an active part returns 400 "Cannot delete this part as it is still active"; after `active=false` it returns 204. Local 1.6.3, confirmed by user (2026-10-30). |
| OQ-PART-03 | Is `initial_stock` applied through the API when the *Initial Stock Data* setting is off? The documentation describes the setting only for the creation form. | API-PART-003 | Resolved: the API applies `initial_stock` whatever the *Initial Stock Data* setting (`PART_CREATE_INITIAL`, off on local 1.6.3): quantity 5 creates one stock item of 5 at the location; quantity 0 creates none. The setting only controls the creation form. Confirmed by user (2026-10-31). |
| OQ-PART-04 | What does each detail flag add to the response? The schema gives no description for `category_detail`, `path_detail`, or `tags`. | API-PART-006 | Open |
| OQ-PART-05 | How do `PATCH` and `PUT` on the list endpoint `/api/part/` select which parts to update? | Not covered | Open |
| OQ-PART-06 | The schema lists `category_name` as required, but the response omits it for parts with no category. | API-PART-001, 005, 007, 009 | Resolved: intended behaviour; the schema marks every read-only field as required by default (drf-spectacular). Recorded as a schema documentation defect. Local 1.6.3, confirmed by user (2026-10-29). |
| OQ-PART-07 | The schema (API 561, and API 567) defines `pricing_min` / `pricing_max` as decimal strings or null and `IPN` as a non-nullable string, but the demo server returns numbers (for example `5.25`) and `IPN: null` for some parts. | API-PART-007 | Resolved: intended behaviour, recorded as a schema documentation defect. Demo 1.7.0 dev (API 567), confirmed by user (2026-10-30). Local 1.6.3 matches the schema. |
