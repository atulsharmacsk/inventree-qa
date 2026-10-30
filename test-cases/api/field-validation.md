# API Manual Tests: Field-Level Validation

Covers required, maximum-length, nullable, read-only, and write-only fields on the Part and Part Category APIs, plus the one numeric minimum (`default_expiry`) and the supplier part `SKU` limit that [relational-integrity.md](relational-integrity.md) points here. Index, shared assumptions, and overall coverage: [api-manual-tests.md](../api-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`. Schema operations are cited by the category page they appear on (`docs:api/schema/part/`, `docs:api/schema/company/`).

**Version check:** both schema pages document API version 561; the index records `apiVersion` 561 for the local instance. No mismatch.

**Out of scope here (one home per concern):** wrong types, malformed JSON, and references to records that do not exist → API-EDGE-007 to 009 in [edge-cases.md](edge-cases.md). Creating a part with only a name and with all optional fields → API-PART-001, 002. Partial update without `name` → API-PART-008. Clearing `category` and `default_location` with `null` → API-REL-003, 007. Moving a category to the top level (`parent: null`) → API-CAT-012. Unit validity (`KG` vs `kg`) → UI-CREATE-008 and the Units of measure UI area.

**Test isolation:** every case creates its own records with unique names and removes only those. "Not created" is checked with `GET /api/part/?search=<token>&limit=<n>` (or the category equivalent); "unchanged" is checked with `GET` on the record.

**Status codes:** the schema lists only success responses (200, 201, 204). A rejected value returns 400 with a field-keyed body on local 1.6.3 (OQ-VAL-01, confirmed by the user, 2026-10-30); the business result (nothing created or changed) is also asserted.

## Endpoints

| Method | Path | Schema page | Used for |
|---|---|---|---|
| `POST` | `/api/part/` | `part` | Required `name`, maximum lengths, read-only and write-only fields on create, `default_expiry` minimum |
| `PATCH`, `PUT` | `/api/part/{id}/` | `part` | Maximum lengths and `null` on update, read-only fields on update, required `name` on `PUT` |
| `GET` | `/api/part/{id}/`, `/api/part/?search=&limit=` | `part` | Confirms stored values and that nothing was created |
| `POST` | `/api/part/category/` | `part` | Required `name`, maximum lengths |
| `PATCH`, `PUT` | `/api/part/category/{id}/` | `part` | `null` handling, read-only fields, required `name` on `PUT` |
| `GET` | `/api/part/category/{id}/`, `/api/part/category/?search=&limit=` | `part` | Confirms stored values and that nothing was created |
| `POST` | `/api/company/part/` | `company` | Supplier part `SKU` maximum length |

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:api/schema/` | Schema categories and API version |
| `docs:api/schema/part/` | Part and Category request/response schemas: `required`, `maxLength`, `nullable`, `readOnly`, `writeOnly`, `minimum`, `format` |
| `docs:api/schema/company/` | SupplierPart `SKU` (required, maxLength 100), required `part` and `supplier` |
| `docs:part/views/` | Part fields (IPN, Name, Description, Revision, Keywords, External Link, Units) |
| `docs:part/create/` | Form errors block creation; only *Name* is required (OQ-CREATE-01, resolved) |
| `docs:part/` | Part categories; supplier parts |

Also checked: the root `README.md` (OQ-PART-06 and OQ-PART-07 schema documentation defects; the `limit` parameter rule) and the open questions in the other API area files (OQ-EDGE-02 for error statuses).

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-VAL-01 | In the Part request body, `name` is the only writable field listed as required; the other required entries (`barcode_hash`, `category_name`, `full_name`, `pk`, `starred`, `thumbnail`) are read-only. | `docs:api/schema/part/` `POST`/`PUT /api/part/`; `docs:part/create/` (OQ-CREATE-01) |
| REQ-VAL-02 | In the Category request body, `name` is the only writable field listed as required (`level`, `pathstring`, `pk`, `starred` are read-only). | `docs:api/schema/part/` `POST`/`PUT /api/part/category/` |
| REQ-VAL-03 | Part maximum lengths: `name` 100, `description` 250, `IPN` 100, `revision` 100, `keywords` 250, `units` 20, `link` 2000 (`format: uri`) or an empty string (maxLength 0). | `docs:api/schema/part/` Part schema |
| REQ-VAL-04 | Category maximum lengths: `name` 100, `description` 250, `default_keywords` 250, `icon` 100. | `docs:api/schema/part/` Category schema |
| REQ-VAL-05 | Part writable fields marked nullable: `keywords`, `revision`, `units`, `link`, `category`, `default_location`, `responsible`, `revision_of`, `variant_of`, `creation_user`, `image`. Not nullable: `name`, `description`, `IPN`, the boolean flags, `minimum_stock`, `maximum_stock`, `default_expiry`. | `docs:api/schema/part/` Part schema |
| REQ-VAL-06 | Category writable fields marked nullable: `default_keywords`, `default_location`, `icon`, `parent`. Not nullable: `name`, `description`, `structural`. | `docs:api/schema/part/` Category schema |
| REQ-VAL-07 | Part read-only fields include `pk`, `barcode_hash`, `full_name`, `category_name`, `creation_date`, `starred`, `thumbnail`, `in_stock`, `total_in_stock`, `unallocated_stock`, `stock_item_count`, `revision_count`, `pricing_min`, `pricing_max`. | `docs:api/schema/part/` Part schema |
| REQ-VAL-08 | Category read-only fields: `pk`, `level`, `pathstring`, `path`, `part_count`, `subcategories`, `starred`, `parameters`, `parent_default_location`. | `docs:api/schema/part/` Category schema |
| REQ-VAL-09 | Part write-only fields: `copy_category_parameters` (default `true`), `duplicate`, `existing_image`, `initial_stock`, `initial_supplier`. | `docs:api/schema/part/` Part schema |
| REQ-VAL-10 | Part `default_expiry` is an integer with `minimum: 0`. | `docs:api/schema/part/` Part schema |
| REQ-VAL-11 | Supplier part `SKU` is required with maxLength 100; `part` and `supplier` are required. | `docs:api/schema/company/` `POST /api/company/part/`; `docs:part/#supplier-parts` |

## Required Fields

### API-VAL-001: Create a part without `name`
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` with body `{"description": "<unique token>"}`, then `GET /api/part/?search=<token>&limit=<n>`.
- **Expected status:** 400 for the `POST`; 200 for the `GET`.
- **Expected business result:** No part is created: the search returns `count` 0.
- **Requirements:** REQ-VAL-01
- **Sources:** schema `POST /api/part/` request body `required`; `docs:part/create/#create-part-form`

### API-VAL-002: Create a category without `name`
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/category/` with body `{"description": "<unique token>"}`, then `GET /api/part/category/?search=<token>&limit=<n>`.
- **Expected status:** 400 for the `POST`; 200 for the `GET`.
- **Expected business result:** No category is created: the search returns `count` 0.
- **Requirements:** REQ-VAL-02
- **Sources:** schema `POST /api/part/category/` request body `required`; `docs:part/#part-category`

### API-VAL-003: Empty or whitespace-only `name`
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes, after OQ-VAL-03
- **Preconditions:** None.
- **Request:** One request per row, each with a unique `description` token, then search for the token on the matching list endpoint.

  | Endpoint | `name` |
  |---|---|
  | `POST /api/part/` | `""` |
  | `POST /api/part/` | `"   "` |
  | `POST /api/part/category/` | `""` |
  | `POST /api/part/category/` | `"   "` |

- **Expected status:** See OQ-VAL-03.
- **Expected business result:** See OQ-VAL-03.
- **Requirements:** REQ-VAL-01, REQ-VAL-02
- **Sources:** schema Part and Category `name` (no `minLength` given)

### API-VAL-004: Full update without `name`
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part and a test-owned category, each with a known `name` and `description`.
- **Request:** One request per row, then `GET` the record.

  | Request | Body |
  |---|---|
  | `PUT /api/part/{id}/` | `{"description": "<new value>"}` |
  | `PUT /api/part/category/{id}/` | `{"description": "<new value>"}` |

- **Expected status:** 400 for the `PUT`; 200 for the `GET`.
- **Expected business result:** Each record keeps its original `name` and `description`.
- **Requirements:** REQ-VAL-01, REQ-VAL-02
- **Sources:** schema `PUT /api/part/{id}/`, `PUT /api/part/category/{id}/` request body `required`

## Maximum Lengths

### API-VAL-005: Part text fields at their maximum length
- **Priority:** P1
- **Type:** Boundary (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` with a unique `name`, plus one field per row set to a unique string of exactly the given length; then `GET /api/part/{id}/`.

  | Field | Length |
  |---|---|
  | `name` | 100 |
  | `description` | 250 |
  | `IPN` | 100 |
  | `revision` | 100 |
  | `keywords` | 250 |

- **Expected status:** 201, then 200.
- **Expected business result:** The field is stored and returned exactly as sent, with the same length.
- **Requirements:** REQ-VAL-03
- **Sources:** schema Part `maxLength`; `docs:part/views/#part-details`

`units` is not in this table: a 20-character value must also be a valid physical unit (`docs:part/#units-of-measure`), so a pass or fail would not isolate the length rule. Its over-length row is in API-VAL-006.

### API-VAL-006: Part text fields one character over the maximum
- **Priority:** P1
- **Type:** Negative (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` per row, with a unique `description` token (except the `description` row, which uses a unique 251-character string), then search for the token.

  | Field | Length |
  |---|---|
  | `name` | 101 |
  | `description` | 251 |
  | `IPN` | 101 |
  | `revision` | 101 |
  | `keywords` | 251 |
  | `units` | 21 |

- **Expected status:** 400.
- **Expected business result:** No part is created for any row.
- **Requirements:** REQ-VAL-03
- **Sources:** schema Part `maxLength`

### API-VAL-007: Over-length value on a partial update
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part with a known `name` and `description`.
- **Request:** `PATCH /api/part/{id}/` with `name` of 101 characters, then `GET /api/part/{id}/`.
- **Expected status:** 400 for the `PATCH`; 200 for the `GET`.
- **Expected business result:** `name` is unchanged.
- **Requirements:** REQ-VAL-03
- **Sources:** schema `PATCH /api/part/{id}/`, Part `name` maxLength

### API-VAL-008: Category text fields at their maximum length
- **Priority:** P2
- **Type:** Boundary (data-driven)
- **Automation candidate:** Yes, after OQ-VAL-04 (icon row only; the other rows are ready)
- **Preconditions:** None.
- **Request:** `POST /api/part/category/` with a unique `name`, plus one field per row at exactly the given length; then `GET /api/part/category/{id}/`.

  | Field | Length |
  |---|---|
  | `name` | 100 |
  | `description` | 250 |
  | `default_keywords` | 250 |
  | `icon` | 100 (see OQ-VAL-04) |

- **Expected status:** 201, then 200.
- **Expected business result:** The field is stored and returned exactly as sent.
- **Requirements:** REQ-VAL-04
- **Sources:** schema Category `maxLength`; `docs:part/#part-category`

### API-VAL-009: Category text fields one character over the maximum
- **Priority:** P2
- **Type:** Negative (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/category/` per row with a unique token in `name` (or `description` for the `name` row), then search for the token.

  | Field | Length |
  |---|---|
  | `name` | 101 |
  | `description` | 251 |
  | `default_keywords` | 251 |
  | `icon` | 101 |

- **Expected status:** 400.
- **Expected business result:** No category is created for any row.
- **Requirements:** REQ-VAL-04
- **Sources:** schema Category `maxLength`

### API-VAL-010: Part `link` length and format
- **Priority:** P3
- **Type:** Boundary (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` per row with a unique `name` and the given `link`, then `GET` the part (accepted rows) or search for the name (rejected rows).

  | `link` | Expected |
  |---|---|
  | `https://example.com/` followed by `a` up to exactly 2000 characters | 201; stored exactly |
  | Same pattern, 2001 characters | 400; no part created |
  | `""` | 201; stored as `""` |
  | `not a url` | 400; no part created |

- **Expected status:** As in the table.
- **Expected business result:** As in the table.
- **Requirements:** REQ-VAL-03
- **Sources:** schema Part `link` (`oneOf`: `format: uri`, maxLength 2000; or maxLength 0)

### API-VAL-011: Maximum length counts characters, not bytes
- **Priority:** P3
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` with `name` of exactly 100 multi-byte characters (for example `部` repeated, with a unique suffix inside the 100), then `GET /api/part/{id}/`.
- **Expected status:** 201, then 200.
- **Expected business result:** `name` is stored and returned exactly as sent (100 characters).
- **Requirements:** REQ-VAL-03
- **Sources:** schema Part `name` maxLength (JSON Schema `maxLength` counts characters)

## Nullable Fields

### API-VAL-012: Set nullable part fields to `null`
- **Priority:** P2
- **Type:** Positive (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part with non-empty `keywords`, `revision`, `units` (`kg`), and `link`.
- **Request:** `PATCH /api/part/{id}/` setting one field per row to `null`, then `GET /api/part/{id}/`.

  | Field |
  |---|
  | `keywords` |
  | `revision` |
  | `units` |
  | `link` |

- **Expected status:** 200 for each `PATCH`, then 200.
- **Expected business result:** The field is returned as `null`.
- **Requirements:** REQ-VAL-05
- **Sources:** schema `PATCH /api/part/{id}/`, Part `nullable` fields

### API-VAL-013: `null` on non-nullable part fields
- **Priority:** P2
- **Type:** Negative (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part with known values for every field in the table.
- **Request:** `PATCH /api/part/{id}/` setting one field per row to `null`, then `GET /api/part/{id}/`.

  | Field | Schema type |
  |---|---|
  | `name` | string |
  | `description` | string |
  | `IPN` | string (see note) |
  | `active` | boolean |
  | `minimum_stock` | number |

- **Expected status:** 400 for each `PATCH`; 200 for the `GET`.
- **Expected business result:** Every field keeps its original value.
- **Requirements:** REQ-VAL-05
- **Sources:** schema Part fields without `nullable`

Note: on `ENV=REMOTE` (demo 1.7.0 dev) some parts return `IPN: null` (OQ-PART-07, resolved as a schema documentation defect). This case targets the local instance, which matches the schema.

### API-VAL-014: Set nullable category fields to `null`
- **Priority:** P3
- **Type:** Positive (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with non-empty `default_keywords`, a test-owned stock location as `default_location`, and an `icon` in the `package:name:variant` format (for example `ti:box:outline`; see OQ-VAL-04).
- **Request:** `PATCH /api/part/category/{id}/` setting one field per row to `null`, then `GET /api/part/category/{id}/`.

  | Field |
  |---|
  | `default_keywords` |
  | `default_location` |
  | `icon` |

- **Expected status:** 200 for each `PATCH`, then 200.
- **Expected business result:** `default_keywords` and `default_location` are returned as `null`; `icon` is returned as an empty string (`""`), confirmed by the user (OQ-VAL-05).
- **Requirements:** REQ-VAL-06
- **Sources:** schema `PATCH /api/part/category/{id}/`, Category `nullable` fields

### API-VAL-015: `null` on non-nullable category fields
- **Priority:** P2
- **Type:** Negative (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with a known `name`, `description`, and `structural: false`.
- **Request:** `PATCH /api/part/category/{id}/` setting `name`, `description`, or `structural` to `null` (one per request), then `GET /api/part/category/{id}/`.
- **Expected status:** 400 for each `PATCH`; 200 for the `GET`.
- **Expected business result:** Every field keeps its original value.
- **Requirements:** REQ-VAL-06
- **Sources:** schema Category fields without `nullable`

## Read-Only and Write-Only Fields

### API-VAL-016: Read-only part fields sent on create are not stored
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** No stock exists for the new part (it is created by the test).
- **Request:** `POST /api/part/` with a unique `name` and these read-only values: `in_stock: 500`, `total_in_stock: 500`, `stock_item_count: 5`, `revision_count: 5`, `starred: true`, `creation_date: "2000-01-01"`, `barcode_hash: "pw-fake-hash"`, `full_name: "pw-fake-full-name"`. If created, `GET /api/part/{id}/`; otherwise search for the name.
- **Expected status:** 201, then 200.
- **Expected business result:** The part is created and none of the listed fields returns the submitted value.
- **Requirements:** REQ-VAL-07
- **Sources:** schema Part `readOnly` fields

### API-VAL-017: Read-only part fields sent on update do not change the part
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part; record its `pk`, `in_stock`, `total_in_stock`, `creation_date`, `full_name`, and `barcode_hash`.
- **Request:** `PATCH /api/part/{id}/` with `pk: <another integer>`, `in_stock: 999`, `total_in_stock: 999`, `creation_date: "2000-01-01"`, `full_name: "pw-fake-full-name"`, `barcode_hash: "pw-fake-hash"`, then `GET /api/part/{id}/`.
- **Expected status:** 200 for the `PATCH` and for the `GET`.
- **Expected business result:** Every recorded field still has its original value.
- **Requirements:** REQ-VAL-07
- **Sources:** schema `PATCH /api/part/{id}/`, Part `readOnly` fields

### API-VAL-018: Read-only category fields sent on update do not change the category
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with one test-owned sub-category and one test-owned part; record its `pk`, `level`, `pathstring`, `part_count`, and `subcategories`.
- **Request:** `PATCH /api/part/category/{id}/` with `level: 7`, `pathstring: "pw/fake/path"`, `part_count: 99`, `subcategories: 99`, `pk: <another integer>`, then `GET /api/part/category/{id}/`.
- **Expected status:** 200 for the `PATCH` and for the `GET`.
- **Expected business result:** Every recorded field still has its original value.
- **Requirements:** REQ-VAL-08
- **Sources:** schema `PATCH /api/part/category/{id}/`, Category `readOnly` fields

### API-VAL-019: Write-only part fields are not returned
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` with a unique `name` and `copy_category_parameters: false`, then `GET /api/part/{id}/`.
- **Expected status:** 201, then 200.
- **Expected business result:** Neither response body contains the keys `copy_category_parameters`, `duplicate`, `existing_image`, `initial_stock`, or `initial_supplier`.
- **Requirements:** REQ-VAL-09
- **Sources:** schema Part `writeOnly` fields

## Numeric and Related-Record Limits

### API-VAL-020: `default_expiry` minimum
- **Priority:** P3
- **Type:** Boundary (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` per row with a unique `name` and the given `default_expiry`, then `GET` the part or search for the name.

  | `default_expiry` | Expected |
  |---|---|
  | `0` | 201; stored as `0` |
  | `-1` | 400; no part created |

- **Expected status:** As in the table.
- **Expected business result:** As in the table.
- **Requirements:** REQ-VAL-10
- **Sources:** schema Part `default_expiry` (`minimum: 0`)

### API-VAL-021: Supplier part `SKU` maximum length
- **Priority:** P3
- **Type:** Boundary (data-driven)
- **Automation candidate:** Yes
- **Preconditions:** A test-owned company with `is_supplier: true` and a test-owned part with `purchaseable: true`.
- **Request:** `POST /api/company/part/` per row with `part`, `supplier`, and the given `SKU`, then `GET /api/company/part/?part=<id>&limit=<n>`.

  | `SKU` length | Expected |
  |---|---|
  | 100 | 201; stored exactly |
  | 101 | 400; no supplier part created |

- **Expected status:** As in the table.
- **Expected business result:** As in the table. The test removes the supplier part it created before the part.
- **Requirements:** REQ-VAL-11
- **Sources:** schema `POST /api/company/part/`, SupplierPart `SKU`; `docs:part/#supplier-parts`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Required fields | 2 | 2 | 0 | 4 |
| Maximum lengths | 2 | 3 | 2 | 7 |
| Nullable fields | 0 | 3 | 1 | 4 |
| Read-only and write-only fields | 2 | 1 | 1 | 4 |
| Numeric and related-record limits | 0 | 0 | 2 | 2 |
| **Total** | **6** | **9** | **6** | **21** |

All 11 requirements (REQ-VAL-01 to REQ-VAL-11) are covered by at least one case.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-VAL-01 | Which status and error body are returned when a field fails validation (missing required field, over maximum length, `null` on a non-nullable field, invalid URI, value below `minimum`)? The schema documents only success responses. Same gap as OQ-EDGE-02. | API-VAL-001, 002, 004, 006, 007, 009, 010, 013, 015, 020, 021 | Resolved: 400 with a field-keyed body (for example `{"name": ["This field is required."]}`). Local 1.6.3, confirmed by user (2026-10-30). |
| OQ-VAL-02 | Are read-only fields in a request body ignored (2xx, values not stored) or rejected? The schema marks them `readOnly` but does not say. | API-VAL-016, 017, 018 | Resolved: intended behaviour. Read-only fields in a request body are ignored: the request succeeds (201 or 200) and the submitted values are not stored. Local 1.6.3, confirmed by user (2026-10-30). |
| OQ-VAL-03 | Is an empty or whitespace-only `name` accepted for parts and categories? The schema gives `maxLength` but no `minLength`; `docs:part/create/` says *Name* is required. | API-VAL-003 | Open |
| OQ-VAL-04 | What makes a category `icon` value valid? The schema says only "Icon (optional)", maxLength 100. A 100-character arbitrary string may fail for content, not length. | API-VAL-008 | Open |
| OQ-VAL-05 | When a nullable text field is set to `null`, is it returned as `null` or as `""`? Both match the schema. | API-VAL-012, 014 | Resolved: intended behaviour. A nullable field set to `null` returns `null`, except a category `icon`, which returns `""`. Local 1.6.3, confirmed by user (2026-10-30). |
