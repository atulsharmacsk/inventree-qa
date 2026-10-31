# API Manual Tests: Relational Integrity

Covers the links between parts and other records: category assignment, default stock locations, and supplier and manufacturer linkage. Index, shared assumptions, and overall coverage: [api-manual-tests.md](../api-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`. Schema operations are cited by the category page they appear on (`docs:api/schema/part/`, `docs:api/schema/stock/`, `docs:api/schema/company/`).

**Version check:** the schema pages document API version 561; the index records `apiVersion` 561 for the local instance. No mismatch.

**Out of scope here (one home per concern):** category CRUD and category hierarchy → [categories-crud.md](categories-crud.md). The `category` and `cascade` list filters → [parts-list.md](parts-list.md). Invalid IDs and malformed payloads → Edge cases. Field limits (for example `SKU` maxLength 100) → Field-level validation. Initial stock quantities → API-PART-003.

**Test isolation:** every case creates its own categories, stock locations, companies, parts, supplier parts, and manufacturer parts, and removes only those records. List requests include `limit`.

## Endpoints

| Method | Path | Schema page | Used for |
|---|---|---|---|
| `POST`, `GET`, `PATCH` | `/api/part/`, `/api/part/{id}/` | `part` | Part `category`, `default_location`, `initial_supplier`; read-only `category_name`, `category_path`, `category_default_location` |
| `GET` | `/api/part/` | `part` | `category` filter; `search` over supplier SKU and manufacturer MPN |
| `POST` | `/api/part/category/` | `part` | Categories with `default_location` and `structural` |
| `POST` | `/api/stock/location/` | `stock` | Test-owned stock locations (required: `name`) |
| `POST` | `/api/company/` | `company` | Test-owned companies with `is_supplier` / `is_manufacturer` (required: `name`, `currency`) |
| `POST`, `GET` | `/api/company/part/` | `company` | Supplier parts (required writable: `part`, `supplier`, `SKU`); filters `part`, `supplier`, `SKU` |
| `POST`, `GET` | `/api/company/part/manufacturer/` | `company` | Manufacturer parts (required writable: `part`, `manufacturer`); filter `part` |
| `DELETE` | `/api/part/{id}/` | `part` | 204; effect on linked supplier parts (OQ-REL-05) |

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:api/schema/` | Schema categories and API version |
| `docs:api/schema/part/` | Part `category`, `default_location`, `category_default_location`, `initial_supplier` (InitialSupplier); Category `default_location`, `structural`; part list `search` fields |
| `docs:api/schema/stock/` | `POST /api/stock/location/` and the Location schema |
| `docs:api/schema/company/` | Company, SupplierPart, and ManufacturerPart endpoints and schemas |
| `docs:part/` | Purchaseable parts can be linked to supplier parts |
| `docs:part/create/` | Supplier options when creating a purchaseable part |

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-REL-01 | A part's `category` is a writable, nullable integer. `category_name` and `category_path` are read-only; `category_name` is included only when the part has a category. | `docs:api/schema/part/` Part schema; `category_name`: OQ-PART-06 (resolved) |
| REQ-REL-02 | Parts may not be directly assigned to a structural category but may be assigned to its child categories. | `docs:api/schema/part/` Category `structural` |
| REQ-REL-03 | A part's `default_location` ("Where is this item normally stored?") is a writable, nullable integer. A category's `default_location` is the "Default location for parts in this category"; the part's `category_default_location` is read-only. | `docs:api/schema/part/` Part and Category schemas |
| REQ-REL-04 | Purchaseable parts can be linked to supplier parts. | `docs:part/#supplier-parts` |
| REQ-REL-05 | `POST /api/company/part/` creates a supplier part (writable required: `part`, `supplier`, `SKU`) and returns 201. `GET /api/company/part/` filters by `part`, `supplier`, and `SKU`. | `docs:api/schema/company/` `POST`/`GET /api/company/part/` |
| REQ-REL-06 | Write-only `initial_supplier` (`supplier`, `sku`, `manufacturer`, `mpn`) adds initial supplier information when a part is created. For a purchaseable part, *Add Supplier Data* allows supplier and manufacturer part information to be added. | `docs:api/schema/part/` InitialSupplier; `docs:part/create/#supplier-options` |
| REQ-REL-07 | `POST /api/company/part/manufacturer/` creates a manufacturer part (`part`, `manufacturer` required); a supplier part's `manufacturer_part` links to it. | `docs:api/schema/company/` ManufacturerPart, SupplierPart `manufacturer_part` |
| REQ-REL-08 | The part list `search` covers supplier part SKU and manufacturer part MPN. | `docs:api/schema/part/` `GET /api/part/` `search` |

## Category Assignment

### API-REL-001: Create a part in a category
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category `C`.
- **Request:** `POST /api/part/` with a unique `name` and `category: <C id>`, then `GET /api/part/{id}/`.
- **Expected status:** 201, then 200.
- **Expected business result:** `category` is `C`'s `pk` and `category_name` is `C`'s name in both responses.
- **Requirements:** REQ-REL-01
- **Sources:** schema `POST /api/part/`, Part schema; `docs:part/#part-category`

### API-REL-002: Move a part to another category
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** Test-owned categories `A` and `B`; test-owned part `P` in `A`.
- **Request:** `PATCH /api/part/{P id}/` with `{"category": <B id>}`, then `GET /api/part/?category=<A id>&limit=<n>` and `GET /api/part/?category=<B id>&limit=<n>`.
- **Expected status:** 200 for each request.
- **Expected business result:** `P.category` is `B`'s `pk` and `category_name` is `B`'s name. `P` is listed under `B` and not under `A`.
- **Requirements:** REQ-REL-01
- **Sources:** schema `PATCH /api/part/{id}/`, `GET /api/part/`

### API-REL-003: Remove a part's category
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part in a test-owned category.
- **Request:** `PATCH /api/part/{id}/` with `{"category": null}`, then `GET /api/part/{id}/`.
- **Expected status:** 200 for both.
- **Expected business result:** `category` is `null` and `category_name` is absent (OQ-PART-06, resolved).
- **Requirements:** REQ-REL-01
- **Sources:** schema Part `category` (nullable)

### API-REL-004: Assign a part to a structural category
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category `S` with `structural: true`, and a test-owned part `P` with no category.
- **Request:** `POST /api/part/` with a unique `name` and `category: <S id>`; and `PATCH /api/part/{P id}/` with `{"category": <S id>}`, then `GET /api/part/{P id}/`.
- **Expected status:** 400 for both requests.
- **Expected business result:** Each error body has a `category` key (local 1.6.3: `["Parts cannot be assigned to structural part categories!"]`). No part is created in `S`, and `P.category` is still `null`.
- **Requirements:** REQ-REL-02
- **Sources:** schema Category `structural`; OQ-REL-01 (local 1.6.3, confirmed by user, 2026-10-31)

### API-REL-005: Assign a part to a child of a structural category
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned structural category `S` with a non-structural child category `C`.
- **Request:** `POST /api/part/` with a unique `name` and `category: <C id>`.
- **Expected status:** 201
- **Expected business result:** The part's `category` is `C`'s `pk`.
- **Requirements:** REQ-REL-02, REQ-REL-01
- **Sources:** schema Category `structural`

## Default Locations

### API-REL-006: Set a part's default location
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned stock location `L` and a test-owned part.
- **Request:** `PATCH /api/part/{id}/` with `{"default_location": <L id>}`, then `GET /api/part/{id}/`.
- **Expected status:** 200 for both.
- **Expected business result:** `default_location` is `L`'s `pk`.
- **Requirements:** REQ-REL-03
- **Sources:** schema Part `default_location`; `POST /api/stock/location/`

### API-REL-007: Clear a part's default location
- **Priority:** P3
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part whose `default_location` is a test-owned location.
- **Request:** `PATCH /api/part/{id}/` with `{"default_location": null}`, then `GET /api/part/{id}/`.
- **Expected status:** 200 for both.
- **Expected business result:** `default_location` is `null`.
- **Requirements:** REQ-REL-03
- **Sources:** schema Part `default_location` (nullable)

### API-REL-008: Category default location seen from a part
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned stock location `L`; a test-owned category `C` with `default_location: <L id>`; a test-owned category `D` under `C` with no `default_location`; one test-owned part in each, with no `default_location` of its own.
- **Request:** `GET /api/part/{id}/` for each part.
- **Expected status:** 200
- **Expected business result:** The part in `C` has `category_default_location` = `L`. The part in `D` has `category_default_location` = `null`: the value comes from the part's own category only and is not inherited from a parent. Neither part's own `default_location` is set.
- **Requirements:** REQ-REL-03
- **Sources:** schema Part `category_default_location`, Category `default_location`; OQ-REL-02 (local 1.6.3, confirmed by user, 2026-10-31)

## Supplier Linkage

### API-REL-009: Link a supplier part to a purchaseable part
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned company `S` with `is_supplier: true`, and a test-owned part `P` with `purchaseable: true`.
- **Request:** `POST /api/company/part/` with `{"part": <P id>, "supplier": <S id>, "SKU": "<unique SKU>"}`, then `GET /api/company/part/?part=<P id>&limit=<n>`.
- **Expected status:** 201, then 200.
- **Expected business result:** The created supplier part has the submitted `part`, `supplier`, and `SKU`. The filtered list contains exactly this supplier part.
- **Requirements:** REQ-REL-04, REQ-REL-05
- **Sources:** schema `POST`/`GET /api/company/part/`; `docs:part/#supplier-parts`

### API-REL-010: Create a part with initial supplier data
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned company `S` with `is_supplier: true`.
- **Request:** `POST /api/part/` with a unique `name`, `purchaseable: true`, and `initial_supplier: {"supplier": <S id>, "sku": "<unique SKU>"}`, then `GET /api/company/part/?part=<new part id>&limit=<n>`.
- **Expected status:** 201, then 200.
- **Expected business result:** The list contains one supplier part for the new part with supplier `S` and the submitted SKU.
- **Requirements:** REQ-REL-06, REQ-REL-05
- **Sources:** schema InitialSupplier; `docs:part/create/#supplier-options`

### API-REL-011: Link a supplier part to a non-purchaseable part
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned supplier company and a test-owned part with `purchaseable: false`.
- **Request:** `POST /api/company/part/` with the part, the supplier, and a unique `SKU`; then `GET /api/company/part/?supplier=<supplier id>&limit=<n>`.
- **Expected status:** 400, then 200.
- **Expected business result:** The error body has a `part` key, and the test-owned supplier has no supplier parts (`count` 0). (`GET /api/company/part/?part=<id>` cannot be used here: it also returns 400 for a non-purchaseable part.)
- **Requirements:** REQ-REL-04
- **Sources:** schema `POST /api/company/part/`; `docs:part/#purchaseable`; OQ-REL-03 (local 1.6.3, confirmed by user, 2026-10-31)
- **Finding (minor, confirmed by user 2026-10-31):** the error text is `Invalid pk "<id>" - object does not exist.`, although the part exists. It points the user to the wrong cause. The text is not asserted.

### API-REL-012: Link a supplier part to a company that is not a supplier
- **Priority:** P3
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned company with `is_supplier: false`, and a test-owned purchaseable part.
- **Request:** `POST /api/company/part/` with the part, the company as `supplier`, and a unique `SKU`; then `GET /api/company/part/?part=<id>&limit=<n>`.
- **Expected status:** 400, then 200.
- **Expected business result:** The error body has a `supplier` key, and the part has no supplier parts (`count` 0).
- **Requirements:** REQ-REL-05
- **Sources:** schema Company `is_supplier`, `POST /api/company/part/`; OQ-REL-04 (local 1.6.3, confirmed by user, 2026-10-31)
- **Finding (minor, confirmed by user 2026-10-31):** same misleading `Invalid pk "<id>" - object does not exist.` text as API-REL-011, although the company exists. The text is not asserted.

### API-REL-013: Link a supplier part to a manufacturer part
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned purchaseable part `P`; test-owned companies `M` (`is_manufacturer: true`) and `S` (`is_supplier: true`).
- **Request:** `POST /api/company/part/manufacturer/` with `{"part": <P id>, "manufacturer": <M id>, "MPN": "<unique MPN>"}`; then `POST /api/company/part/` with `part`, `supplier`, a unique `SKU`, and `manufacturer_part: <new manufacturer part id>`; then `GET /api/company/part/manufacturer/?part=<P id>&limit=<n>`.
- **Expected status:** 201, 201, then 200.
- **Expected business result:** The supplier part's `manufacturer_part` is the new manufacturer part's `pk`, and the manufacturer part list for `P` contains it.
- **Requirements:** REQ-REL-07
- **Sources:** schema `POST /api/company/part/manufacturer/`, SupplierPart `manufacturer_part`

### API-REL-014: Find a part by supplier SKU and manufacturer MPN
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned purchaseable part `P` with a test-owned manufacturer part (unique MPN) and a test-owned supplier part (unique SKU) that appear nowhere else.
- **Request:** `GET /api/part/?search=<SKU>&limit=<n>` and `GET /api/part/?search=<MPN>&limit=<n>`.
- **Expected status:** 200 for both.
- **Expected business result:** Each search returns `P`, and `count` is 1.
- **Requirements:** REQ-REL-08
- **Sources:** schema `GET /api/part/` `search`

### API-REL-015: Delete a part that has a supplier part
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned inactive part (OQ-PART-02) with one test-owned supplier part from a test-owned supplier company.
- **Request:** `DELETE /api/part/{id}/`, then `GET /api/company/part/{supplier part id}/` and `GET /api/company/{supplier id}/`.
- **Expected status:** 204, then 404 for the supplier part and 200 for the company.
- **Expected business result:** The part's supplier parts are deleted with it (cascade); the supplier company is kept. No records other than the test-owned ones change.
- **Requirements:** REQ-REL-05
- **Sources:** schema `DELETE /api/part/{id}/`, `GET /api/company/part/{id}/`; OQ-REL-05 (local 1.6.3, confirmed by user, 2026-10-31)

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Category Assignment | 3 | 2 | 0 | 5 |
| Default Locations | 0 | 1 | 2 | 3 |
| Supplier Linkage | 1 | 3 | 3 | 7 |
| **Total** | **4** | **6** | **5** | **15** |

All 8 requirements are covered by at least one case.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-REL-01 | Which status is returned when a part is assigned to a structural category? The schema describes the rule but documents only success responses. | API-REL-004 | Resolved: 400 `{"category": ["Parts cannot be assigned to structural part categories!"]}` for both create and move; nothing changes. Local 1.6.3, confirmed by user (2026-10-31). |
| OQ-REL-02 | Is a part's `category_default_location` the `default_location` of its category, and is it inherited from a parent category? The field has no description. | API-REL-008 | Resolved: `category_default_location` is the `default_location` of the part's own category only; a child category without its own default gives `null` (not inherited). The part's own `default_location` is not filled. Local 1.6.3, confirmed by user (2026-10-31). |
| OQ-REL-03 | Can a supplier part be linked to a part with `purchaseable: false`? The documentation says the flag "allows" linking but not that it is required. | API-REL-011 | Resolved: rejected with 400 and a `part` error; no supplier part is created. The message (`Invalid pk "<id>" - object does not exist.`) is misleading because the part exists; recorded as a minor application finding. Local 1.6.3, confirmed by user (2026-10-31). |
| OQ-REL-04 | Is a supplier part rejected when its `supplier` company has `is_supplier: false`, and with which status? | API-REL-012 | Resolved: rejected with 400 and a `supplier` error; no supplier part is created. Same misleading "object does not exist" message as OQ-REL-03 (minor application finding). Local 1.6.3, confirmed by user (2026-10-31). |
| OQ-REL-05 | When a part with supplier parts is deleted, are the supplier parts deleted too, or is the delete rejected? The schema documents only 204. | API-REL-015 | Resolved: the delete returns 204 and cascades to the part's supplier parts (404 afterwards); the supplier company is kept. Local 1.6.3, confirmed by user (2026-10-31). |
