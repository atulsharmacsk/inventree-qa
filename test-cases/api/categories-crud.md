# API Manual Tests: Part Categories CRUD

Covers creating, retrieving, updating, and deleting part categories through the Part Category API. Index, shared assumptions, and overall coverage: [api-manual-tests.md](../api-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`. Schema operations are cited as they appear on `docs:api/schema/part/` (for example, `POST /api/part/category/`).

**Version check:** the schema page documents API version 561; the index records `apiVersion` 561 for the local instance. No mismatch.

**Out of scope here (one home per concern):** field limits (`name` and `description` maximum lengths), nullability, and read-only fields → Field-level validation. Assigning parts to categories (including structural categories) and category default locations → Relational integrity. Unauthenticated access, invalid payloads, and duplicate-name conflicts → Edge cases. Category parameter templates (`/api/part/category/parameters/`) are not part of this area's minimum coverage.

## Endpoints

| Method | Path | Documented response |
|---|---|---|
| `GET` | `/api/part/category/` | 200, paginated: `count` (integer) and `results` (array of Category) required; `next`/`previous` nullable URIs. Query: `cascade`, `depth`, `exclude_tree`, `limit`, `name`, `offset`, `ordering`, `parent`, `path_detail` (default `false`), `search` (description, name, pathstring), `starred`, `structural`, `top_level` |
| `POST` | `/api/part/category/` | 201, Category |
| `GET` | `/api/part/category/{id}/` | 200, Category. Query: `path_detail` (default `false`) |
| `PATCH` | `/api/part/category/{id}/` | 200, Category |
| `PUT` | `/api/part/category/{id}/` | 200, Category |
| `DELETE` | `/api/part/category/{id}/` | 204, no content. No query parameters documented |
| `GET` | `/api/part/category/tree/` | 200, paginated CategoryTree. Query: `level`, `limit`, `max_level`, `offset`, `ordering`, `parent`, `search`, `tree_id` |
| `PATCH`, `PUT` | `/api/part/category/` | 200; custom list-level operations. Not covered (OQ-ACAT-04) |

**Category schema (API 561):** writable `name` (maxLength 100), `description` (maxLength 250), `default_keywords` (maxLength 250, nullable), `default_location` (integer, nullable), `icon` (maxLength 100, nullable), `parent` (integer, nullable), `structural` (boolean). Read-only `level`, `parameters`, `parent_default_location`, `part_count`, `path`, `pathstring`, `pk`, `starred`, `subcategories`. Required in the body: `level`, `name`, `pathstring`, `pk`, `starred`.

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:api/schema/` | Schema categories and API version |
| `docs:api/schema/part/` | Category endpoints, methods, query parameters, success statuses, Category and CategoryTree schemas |
| `docs:part/` | Category hierarchy; each category lists its sub-categories |

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-ACAT-01 | `POST /api/part/category/` creates a category and returns 201 with a Category body that includes `level`, `name`, `pathstring`, `pk`, and `starred`. | `docs:api/schema/part/` `POST /api/part/category/` |
| REQ-ACAT-02 | `name` is the only writable field listed as required. `description`, `default_keywords`, `default_location`, `icon`, `parent`, and `structural` are optional writable fields. | `docs:api/schema/part/` Category schema |
| REQ-ACAT-03 | `GET /api/part/category/{id}/` returns 200 with a Category body and accepts the optional `path_detail` flag. | `docs:api/schema/part/` `GET /api/part/category/{id}/` |
| REQ-ACAT-04 | `GET /api/part/category/` returns 200 with a paginated list (`count`, `results` required) and supports the `parent`, `search`, and `top_level` filters. | `docs:api/schema/part/` `GET /api/part/category/` |
| REQ-ACAT-05 | `PATCH /api/part/category/{id}/` partially updates a category and returns 200 with a Category body. | `docs:api/schema/part/` `PATCH /api/part/category/{id}/` |
| REQ-ACAT-06 | `PUT /api/part/category/{id}/` updates a category and returns 200 with a Category body. | `docs:api/schema/part/` `PUT /api/part/category/{id}/` |
| REQ-ACAT-07 | `DELETE /api/part/category/{id}/` returns 204 No Content. | `docs:api/schema/part/` `DELETE /api/part/category/{id}/` |
| REQ-ACAT-08 | `GET /api/part/category/tree/` returns 200 with a paginated list of CategoryTree items (`pk`, `name`, `parent`, `pathstring`, `level`, `structural`, `subcategories`, `tree_id`). | `docs:api/schema/part/` `GET /api/part/category/tree/` |
| REQ-ACAT-09 | Categories are hierarchical: `parent` is the parent part category, and each category shows the sub-categories underneath it. | `docs:api/schema/part/` Category `parent`; `docs:part/#part-category` |
| REQ-ACAT-10 | `structural` is a writable boolean. Parts may not be directly assigned to a structural category but may be assigned to its child categories. | `docs:api/schema/part/` Category `structural` |

## Create

### API-CAT-001: Create a category with only a name
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** Authenticated user with Part Category create permission.
- **Request:** `POST /api/part/category/` with body `{"name": "<unique test name>"}`.
- **Expected status:** 201
- **Expected business result:** The body is a Category with the submitted `name`, an integer `pk`, and the required fields `level`, `pathstring`, and `starred`.
- **Requirements:** REQ-ACAT-01, REQ-ACAT-02
- **Sources:** schema `POST /api/part/category/`; `docs:part/#part-category`

### API-CAT-002: Create a category with optional writable fields
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/category/` with a unique `name`, `description`, `default_keywords`, and `structural: false`.
- **Expected status:** 201
- **Expected business result:** Each submitted value is returned unchanged in the response.
- **Requirements:** REQ-ACAT-01, REQ-ACAT-02
- **Sources:** schema `POST /api/part/category/`, Category schema

### API-CAT-003: Create a sub-category
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned parent category.
- **Request:** `POST /api/part/category/` with a unique `name` and `parent: <parent id>`, then `GET /api/part/category/?parent=<parent id>&limit=<n>`.
- **Expected status:** 201 for the create; 200 for the list.
- **Expected business result:** The created category's `parent` is the parent's `pk`, and the filtered list contains the new sub-category. Values of `level`, `pathstring`, and the parent's `subcategories`: see OQ-ACAT-05.
- **Requirements:** REQ-ACAT-01, REQ-ACAT-04, REQ-ACAT-09
- **Sources:** schema `POST` and `GET /api/part/category/`; `docs:part/#part-category`

### API-CAT-004: Create a structural category
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/category/` with a unique `name` and `structural: true`, then `GET /api/part/category/{id}/`.
- **Expected status:** 201 for the create; 200 for the retrieve.
- **Expected business result:** `structural` is `true` in both responses. Assigning parts to it is covered in Relational integrity.
- **Requirements:** REQ-ACAT-01, REQ-ACAT-10
- **Sources:** schema Category `structural`

## Read

### API-CAT-005: Retrieve a category by ID
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with a description.
- **Request:** `GET /api/part/category/{id}/`
- **Expected status:** 200
- **Expected business result:** The returned Category has the same `pk` and the `name` and `description` submitted at creation.
- **Requirements:** REQ-ACAT-03
- **Sources:** schema `GET /api/part/category/{id}/`

### API-CAT-006: Retrieve a category with path detail
- **Priority:** P3
- **Type:** Boundary
- **Automation candidate:** No
- **Preconditions:** A test-owned sub-category of a test-owned parent.
- **Request:** `GET /api/part/category/{id}/?path_detail=true`, and the same request without the flag.
- **Expected status:** 200 for both.
- **Expected business result:** See OQ-ACAT-05.
- **Requirements:** REQ-ACAT-03
- **Sources:** schema `GET /api/part/category/{id}/`

### API-CAT-007: List and search categories
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with a unique name.
- **Request:** `GET /api/part/category/?search=<unique name>&limit=<n>`
- **Expected status:** 200
- **Expected business result:** The body has an integer `count` and a `results` array of Category objects that includes the test-owned category. Detailed paging and filtering are out of scope.
- **Requirements:** REQ-ACAT-04
- **Sources:** schema `GET /api/part/category/`

### API-CAT-008: Category tree includes a new category
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned sub-category with a unique name under a test-owned parent.
- **Request:** `GET /api/part/category/tree/?search=<unique name>&limit=<n>`
- **Expected status:** 200
- **Expected business result:** The paginated results include an item with the sub-category's `pk`, `name`, and `parent`.
- **Requirements:** REQ-ACAT-08, REQ-ACAT-09
- **Sources:** schema `GET /api/part/category/tree/`

## Update

### API-CAT-009: Partially update a category
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with a description.
- **Request:** `PATCH /api/part/category/{id}/` with `{"description": "<new value>"}`, then `GET /api/part/category/{id}/`.
- **Expected status:** 200 for both.
- **Expected business result:** `description` has the new value; `name` and `parent` are unchanged.
- **Requirements:** REQ-ACAT-05, REQ-ACAT-03
- **Sources:** schema `PATCH /api/part/category/{id}/`

### API-CAT-010: Fully update a category
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category.
- **Request:** `PUT /api/part/category/{id}/` with a new unique `name` and a new `description`, then `GET /api/part/category/{id}/`.
- **Expected status:** 200 for both.
- **Expected business result:** The category has the new `name` and `description`.
- **Requirements:** REQ-ACAT-06
- **Sources:** schema `PUT /api/part/category/{id}/`

### API-CAT-011: Move a category to another parent
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** Test-owned categories `A` and `B`, and test-owned `C` with `parent` = `A`.
- **Request:** `PATCH /api/part/category/{C id}/` with `{"parent": <B id>}`, then `GET /api/part/category/?parent=<A id>&limit=<n>` and `GET /api/part/category/?parent=<B id>&limit=<n>`.
- **Expected status:** 200 for each request.
- **Expected business result:** `C.parent` is `B`'s `pk`. `C` is listed under `B` and not under `A`. Changes to `pathstring` and `level`: see OQ-ACAT-05.
- **Requirements:** REQ-ACAT-05, REQ-ACAT-04, REQ-ACAT-09
- **Sources:** schema `PATCH /api/part/category/{id}/`, `GET /api/part/category/`; `docs:part/#part-category`

### API-CAT-012: Move a sub-category to the top level
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned sub-category `C` with a unique name under a test-owned parent `A`.
- **Request:** `PATCH /api/part/category/{C id}/` with `{"parent": null}`, then `GET /api/part/category/?top_level=true&search=<C name>&limit=<n>`.
- **Expected status:** 200 for both.
- **Expected business result:** `C.parent` is `null`, and `C` is returned by the top-level filter.
- **Requirements:** REQ-ACAT-05, REQ-ACAT-04, REQ-ACAT-09
- **Sources:** schema Category `parent` (nullable), `GET /api/part/category/` `top_level`

### API-CAT-013: Reject a circular parent
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes, after OQ-ACAT-02
- **Preconditions:** Test-owned category `A` with test-owned sub-category `B`.
- **Request:** For each row, send the `PATCH`, then `GET /api/part/category/{A id}/`.

  | Request | Intent |
  |---|---|
  | `PATCH /api/part/category/{A id}/` with `{"parent": <A id>}` | Category as its own parent |
  | `PATCH /api/part/category/{A id}/` with `{"parent": <B id>}` | Category under its own child |
- **Expected status:** See OQ-ACAT-02.
- **Expected business result:** See OQ-ACAT-02.
- **Requirements:** REQ-ACAT-05, REQ-ACAT-09
- **Sources:** schema `PATCH /api/part/category/{id}/`; `docs:part/#part-category`

## Delete

### API-CAT-014: Delete an empty category
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with a unique name, no sub-categories, and no parts.
- **Request:** Two variants, each followed by `GET /api/part/category/?search=<unique name>&limit=<n>`: (a) `DELETE /api/part/category/{id}/` with body `{"delete_parts": false, "delete_child_categories": false}`; (b) the same `DELETE` with no body, as the schema describes it.
- **Expected status:** 204 for the delete in both variants; 200 for the list. Observed on local 1.6.3: variant (a) returns 204; variant (b) returns 400 (application finding, OQ-ACAT-03), so (b) is `fixme`.
- **Expected business result:** The list does not contain the deleted category.
- **Requirements:** REQ-ACAT-07, REQ-ACAT-04
- **Sources:** schema `DELETE /api/part/category/{id}/`
- **Open question:** OQ-ACAT-03 (resolved as an application finding: the request needs an undocumented body).

### API-CAT-015: Delete a category that has a sub-category and a part
- **Priority:** P1
- **Type:** Boundary
- **Automation candidate:** Yes, after OQ-ACAT-06
- **Preconditions:** Test-owned category `A` with test-owned sub-category `B` and test-owned part `P` in `A`.
- **Request:** `DELETE /api/part/category/{A id}/`, then `GET /api/part/category/{B id}/` and `GET /api/part/{P id}/`.
- **Expected status:** See OQ-ACAT-06.
- **Expected business result:** See OQ-ACAT-06. No data outside the test-owned records changes.
- **Requirements:** REQ-ACAT-07, REQ-ACAT-09
- **Sources:** schema `DELETE /api/part/category/{id}/`

### API-CAT-016: Operations on a category that does not exist
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** An ID that belongs to no category (for example, the ID deleted in API-CAT-014).
- **Request:** `GET`, `PATCH`, and `DELETE` on `/api/part/category/{id}/`.
- **Expected status:** 404 for each request.
- **Expected business result:** No category is created or changed.
- **Requirements:** REQ-ACAT-03, REQ-ACAT-05, REQ-ACAT-07
- **Sources:** schema `GET`/`PATCH`/`DELETE /api/part/category/{id}/`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Create | 3 | 0 | 1 | 4 |
| Read | 1 | 1 | 2 | 4 |
| Update | 1 | 4 | 0 | 5 |
| Delete | 2 | 1 | 0 | 3 |
| **Total** | **7** | **6** | **3** | **16** |

All 10 requirements are covered by at least one case. REQ-ACAT-10 is covered only for the flag value; its part-assignment rule is covered in Relational integrity.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-ACAT-01 | Which status is returned for a category ID that does not exist? The schema documents only success responses. | API-CAT-016 | Resolved: 404 `No PartCategory matches the given query.` for `GET`, `PATCH`, and `DELETE`. Local 1.6.3, confirmed by user (2026-10-30). |
| OQ-ACAT-02 | Is a circular parent (a category as its own parent, or under its own descendant) rejected, and with which status? The schema does not describe this validation. | API-CAT-013 | Open |
| OQ-ACAT-03 | Does `DELETE /api/part/category/{id}/` need a request body? The schema (API 561) documents no query parameters or request body, but on local 1.6.3 a `DELETE` without a body returns 400, because `delete_parts` and `delete_child_categories` are required in the body. | API-CAT-014 | Resolved as an application finding, confirmed by the user (2026-10-30): the API contract is incomplete. The schema omits a required request body. |
| OQ-ACAT-04 | How do `PATCH` and `PUT` on the list endpoint `/api/part/category/` select which categories to update? | Not covered | Open |
| OQ-ACAT-05 | What do `level`, `pathstring`, `path`, `subcategories`, and `path_detail` contain? The schema gives no description or format for them. | API-CAT-003, API-CAT-006, API-CAT-011 | Open |
| OQ-ACAT-06 | What happens to the sub-categories and parts of a deleted category for each combination of `delete_parts` and `delete_child_categories`? Neither the schema nor the documentation describes the flags. | API-CAT-015 | Open |
