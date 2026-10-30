# API Manual Tests: Parts List

Covers pagination, search, filtering, and ordering on the Parts list endpoint. Index, shared assumptions, and overall coverage: [api-manual-tests.md](../api-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`. Schema operations are cited as they appear on `docs:api/schema/part/` (for example, `GET /api/part/`).

**Version check:** the schema page documents API version 561; the index records `apiVersion` 561 for the local instance. No mismatch.

**Out of scope here (one home per concern):** the basic list response → API-PART-007 in [parts-crud.md](parts-crud.md). Invalid query values (for example a non-numeric `category`) and unauthenticated access → Edge cases. Category list filters → [categories-crud.md](categories-crud.md).

**Test isolation:** every request is scoped to test-owned data, by a test-owned `category`, a unique `search` token, or both, so results do not depend on other records in the instance. Every request includes `limit`, which the local OpenAPI schema marks as required (see API-PART-007 and the README correction log).

## Endpoints

| Method | Path | Documented response |
|---|---|---|
| `GET` | `/api/part/` | 200, paginated: `count` (integer) and `results` (array of Part) required; `next`/`previous` nullable URIs |

Query parameters used in this area, from the schema (not exhaustive):

| Group | Parameters |
|---|---|
| Pagination | `limit` ("Number of results to return per page"), `offset` ("The initial index from which to return the results") |
| Search and ordering | `search` (searched fields: IPN, category name, description, keywords, manufacturer part MPN, name, revision, supplier part SKU, tag name, tag slug), `ordering` ("Which field to use when ordering the results") |
| Attribute flags (boolean) | `active`, `assembly`, `component`, `consumable`, `is_template`, `purchaseable`, `salable`, `testable`, `trackable`, `virtual` |
| Category | `category` ("Filter by numeric category ID or the literal 'null'"), `cascade` ("If true, include items in child categories of the given category") |
| Text | `IPN` ("Filter by exact IPN"), `IPN_regex`, `name_regex`, `has_ipn` |
| Stock | `has_stock`, `low_stock` |
| Other | `exclude_id` ("Exclude parts with these IDs (comma-separated)"), `created_after` ("Updated after"), `created_before` ("Updated before") |

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:api/schema/` | Schema categories and API version |
| `docs:api/schema/part/` | `GET /api/part/` query parameters, their descriptions, and the paginated response schema |
| `docs:part/` | Category part lists include sub-categories; minimum stock and the "low stock" flag |

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-LIST-01 | `GET /api/part/` returns 200 with `count` and `results`; `next` and `previous` are URIs or null. `limit` sets the number of results per page and `offset` the initial index. | `docs:api/schema/part/` `GET /api/part/` |
| REQ-LIST-02 | `search` matches the term against IPN, category name, description, keywords, manufacturer part MPN, name, revision, supplier part SKU, and tags. | `docs:api/schema/part/` `GET /api/part/` `search` |
| REQ-LIST-03 | The attribute flags `active`, `assembly`, `component`, `consumable`, `is_template`, `purchaseable`, `salable`, `testable`, `trackable`, and `virtual` filter the list by boolean value. | `docs:api/schema/part/` `GET /api/part/` |
| REQ-LIST-04 | `category` filters by category ID, or by the literal `null` for parts without a category. With `cascade=true`, parts in child categories are included; a category's part list includes parts in its sub-categories. | `docs:api/schema/part/` `category`, `cascade`; `docs:part/#part-category` |
| REQ-LIST-05 | `IPN` filters by exact IPN; `IPN_regex` and `name_regex` filter by regular expression; `has_ipn` filters by whether an IPN is set. | `docs:api/schema/part/` `GET /api/part/` |
| REQ-LIST-06 | `has_stock` filters by whether the part has stock. A part whose total stock is below its minimum stock is flagged "low stock"; `low_stock` filters on it. | `docs:api/schema/part/` `has_stock`, `low_stock`; `docs:part/#minimum-stock` |
| REQ-LIST-07 | `exclude_id` excludes the parts with the given comma-separated IDs. | `docs:api/schema/part/` `exclude_id` |
| REQ-LIST-08 | `ordering` selects the field used to order the results. | `docs:api/schema/part/` `ordering` |
| REQ-LIST-09 | `created_after` and `created_before` filter by date (described as "Updated after" and "Updated before"). | `docs:api/schema/part/` `created_after`, `created_before` |

## Pagination

### API-LIST-001: First page with limit
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with exactly three test-owned parts.
- **Request:** `GET /api/part/?category=<id>&limit=2`
- **Expected status:** 200
- **Expected business result:** `count` is 3, `results` has 2 Part objects from the category, `next` is a URI, and `previous` is null.
- **Requirements:** REQ-LIST-01
- **Sources:** schema `GET /api/part/`

### API-LIST-002: Last page with offset
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** As API-LIST-001.
- **Request:** `GET /api/part/?category=<id>&limit=2&offset=2`, and `GET /api/part/?category=<id>&limit=2&offset=0`.
- **Expected status:** 200 for both.
- **Expected business result:** The second page has `count` 3, one result, `next` null, and `previous` a URI. The two pages together contain all three parts, with no part on both pages.
- **Requirements:** REQ-LIST-01
- **Sources:** schema `GET /api/part/`

### API-LIST-003: Offset beyond the last record
- **Priority:** P3
- **Type:** Boundary
- **Automation candidate:** Yes, after OQ-LIST-01
- **Preconditions:** As API-LIST-001.
- **Request:** `GET /api/part/?category=<id>&limit=2&offset=10`
- **Expected status:** See OQ-LIST-01.
- **Expected business result:** See OQ-LIST-01.
- **Requirements:** REQ-LIST-01
- **Sources:** schema `GET /api/part/`

### API-LIST-004: Request without limit
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes, once the application returns the documented paginated list without `limit` (application finding, OQ-LIST-02); the test is `fixme` until then
- **Preconditions:** As API-LIST-001.
- **Request:** `GET /api/part/?category=<id>`
- **Expected status:** 200.
- **Expected business result:** The response is the documented paginated list (`count`, `next`, `previous`, `results`). Observed on local 1.6.3: a bare array (application finding).
- **Requirements:** REQ-LIST-01
- **Sources:** schema `GET /api/part/`; local OpenAPI schema (`/api/schema/`, API 561)

## Search

### API-LIST-005: Search matches each searchable field
- **Priority:** P1
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** For each row, a test-owned part (and, for the category row, a test-owned category) whose field contains a unique token that appears nowhere else.
- **Request:** For each row, `GET /api/part/?search=<token>&limit=<n>`.

  | Field holding the token | Part setup |
  |---|---|
  | `name` | Part name contains the token |
  | `IPN` | Part IPN contains the token |
  | `description` | Part description contains the token |
  | `keywords` | Part keywords contain the token |
  | Category name | Part is in a category whose name contains the token |
- **Expected status:** 200 for each request.
- **Expected business result:** Each search returns the row's part, and `count` is 1.
- **Requirements:** REQ-LIST-02
- **Sources:** schema `GET /api/part/` `search`

### API-LIST-006: Search with no match
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A unique token used by no record.
- **Request:** `GET /api/part/?search=<token>&limit=<n>`
- **Expected status:** 200
- **Expected business result:** `count` is 0 and `results` is empty.
- **Requirements:** REQ-LIST-02, REQ-LIST-01
- **Sources:** schema `GET /api/part/` `search`

## Filtering

### API-LIST-007: Filter by each attribute flag
- **Priority:** P1
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** For each flag in REQ-LIST-03, a test-owned category with part `A` (flag `true`) and part `B` (flag `false`).
- **Request:** For each flag, `GET /api/part/?category=<id>&<flag>=true&limit=<n>` and `GET /api/part/?category=<id>&<flag>=false&limit=<n>`.
- **Expected status:** 200 for each request.
- **Expected business result:** `<flag>=true` returns only `A`; `<flag>=false` returns only `B`. Every returned part has the requested flag value.
- **Requirements:** REQ-LIST-03
- **Sources:** schema `GET /api/part/`; `docs:part/#part-attributes`

### API-LIST-008: Category filter with and without cascade
- **Priority:** P1
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** Test-owned category `Parent` with sub-category `Child`. Test-owned part `P` in `Parent` and part `C` in `Child`.
- **Request:** `GET /api/part/?category=<Parent id>&cascade=true&limit=<n>`, `GET /api/part/?category=<Parent id>&cascade=false&limit=<n>`, and `GET /api/part/?category=<Child id>&cascade=true&limit=<n>`.
- **Expected status:** 200 for each request.
- **Expected business result:**

  | Request | Returned parts |
  |---|---|
  | `Parent`, `cascade=true` | `P`, `C` |
  | `Parent`, `cascade=false` | `P` |
  | `Child`, `cascade=true` | `C` |
- **Requirements:** REQ-LIST-04
- **Sources:** schema `GET /api/part/` `category`, `cascade`; `docs:part/#part-category`

### API-LIST-009: Parts without a category
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes, once `category=null` returns only uncategorized parts (application finding, OQ-LIST-06); the test is `fixme` until then
- **Preconditions:** Two test-owned parts whose names share a unique token: `U` with no category, and `K` in a test-owned category.
- **Request:** `GET /api/part/?category=null&search=<token>&limit=<n>`
- **Expected status:** 200
- **Expected business result:** Only `U` is returned. Observed on local 1.6.3 (default `cascade=true`): both `U` and `K` (application finding).
- **Requirements:** REQ-LIST-04
- **Sources:** schema `GET /api/part/` `category`; local 1.6.3 observation (OQ-LIST-06)

### API-LIST-010: Exact and regular-expression text filters
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with part `A` (name `<token>-alpha`, IPN `<token>-100`) and part `B` (name `<token>-beta`, IPN `<token>-1000`).
- **Request:** For each row, `GET /api/part/?category=<id>&<parameter>=<value>&limit=<n>`.

  | Parameter | Value | Expected parts |
  |---|---|---|
  | `IPN` | `<token>-100` | `A` |
  | `IPN_regex` | `100$` | `A` |
  | `IPN_regex` | `-100` | `A`, `B` |
  | `name_regex` | `beta$` | `B` |
- **Expected status:** 200 for each request.
- **Expected business result:** Each request returns exactly the parts in the table. The `IPN` row shows the exact match does not return `B`, whose IPN starts with the same value.
- **Requirements:** REQ-LIST-05
- **Sources:** schema `GET /api/part/` `IPN`, `IPN_regex`, `name_regex`

### API-LIST-011: Filter by whether an IPN is set
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with part `A` (with an IPN) and part `B` (no IPN).
- **Request:** `GET /api/part/?category=<id>&has_ipn=true&limit=<n>` and `...&has_ipn=false&limit=<n>`.
- **Expected status:** 200 for both.
- **Expected business result:** `has_ipn=true` returns only `A`; `has_ipn=false` returns only `B`.
- **Requirements:** REQ-LIST-05
- **Sources:** schema `GET /api/part/` `has_ipn`

### API-LIST-012: Stock and low-stock filters
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category, a test-owned stock location, and three test-owned parts with `minimum_stock` 10:

  | Part | Stock | Below minimum |
  |---|---|---|
  | `N` | None | Yes |
  | `L` | 5 | Yes |
  | `E` | 10 | No (equal to minimum) |
- **Request:** `GET /api/part/?category=<id>&has_stock=true&limit=<n>` and `GET /api/part/?category=<id>&low_stock=true&limit=<n>`.
- **Expected status:** 200 for both.
- **Expected business result:** `has_stock=true` returns `L` and `E`. `low_stock=true` returns `L` and not `E`; whether it returns `N` (no stock at all): see OQ-LIST-05.
- **Requirements:** REQ-LIST-06
- **Sources:** schema `GET /api/part/` `has_stock`, `low_stock`; `docs:part/#minimum-stock`

### API-LIST-013: Exclude parts by ID
- **Priority:** P3
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with parts `A`, `B`, and `C`.
- **Request:** `GET /api/part/?category=<id>&exclude_id=<A id>,<B id>&limit=<n>`
- **Expected status:** 200
- **Expected business result:** Only `C` is returned.
- **Requirements:** REQ-LIST-07
- **Sources:** schema `GET /api/part/` `exclude_id`

### API-LIST-014: Filter by creation date
- **Priority:** P3
- **Type:** Boundary
- **Automation candidate:** Yes, after OQ-LIST-04
- **Preconditions:** A test-owned category with one part created today.
- **Request:** `GET /api/part/?category=<id>&created_after=<yesterday>&limit=<n>` and `...&created_before=<yesterday>&limit=<n>`.
- **Expected status:** 200 for both.
- **Expected business result:** See OQ-LIST-04.
- **Requirements:** REQ-LIST-09
- **Sources:** schema `GET /api/part/` `created_after`, `created_before`

## Ordering and Combination

### API-LIST-015: Order by name
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes, after OQ-LIST-03
- **Preconditions:** A test-owned category with parts named `<token>-b`, `<token>-a`, and `<token>-c`, created in that order.
- **Request:** `GET /api/part/?category=<id>&ordering=name&limit=<n>` and `...&ordering=-name&limit=<n>`.
- **Expected status:** See OQ-LIST-03.
- **Expected business result:** See OQ-LIST-03.
- **Requirements:** REQ-LIST-08
- **Sources:** schema `GET /api/part/` `ordering`

### API-LIST-016: Combined filters must all match
- **Priority:** P2
- **Type:** Positive
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category with parts sharing a unique name token:

  | Part | Assembly | Name contains `match` |
  |---|---|---|
  | `A` | true | yes |
  | `B` | true | no |
  | `C` | false | yes |
- **Request:** `GET /api/part/?category=<id>&assembly=true&search=<token>-match&limit=<n>`
- **Expected status:** 200
- **Expected business result:** Only `A` is returned.
- **Requirements:** REQ-LIST-02, REQ-LIST-03, REQ-LIST-04
- **Sources:** schema `GET /api/part/`

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Pagination | 1 | 2 | 1 | 4 |
| Search | 1 | 1 | 0 | 2 |
| Filtering | 2 | 3 | 3 | 8 |
| Ordering and Combination | 0 | 2 | 0 | 2 |
| **Total** | **4** | **8** | **4** | **16** |

All 9 requirements are covered by at least one case. Search fields not covered by test data (manufacturer part MPN, supplier part SKU, revision, tags) depend on linked records and are left to Relational integrity.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-LIST-01 | What does an `offset` beyond the last record return: 200 with empty `results`, or an error? The schema does not say. | API-LIST-003 | Open |
| OQ-LIST-02 | What is returned when `limit` is omitted? The local OpenAPI schema marks `limit` as required; an earlier local run without it returned an unpaginated array (README correction log, API-PART-007). Not yet confirmed by the user as intended behaviour. | API-LIST-004 | Resolved as an application finding, confirmed by the user (2026-10-30): without `limit` the server returns a bare array instead of the documented paginated list, although the schema marks `limit` required. Local 1.6.3. |
| OQ-LIST-03 | Which fields does `ordering` accept, and is `name` one of them? The schema gives no list. | API-LIST-015 | Open |
| OQ-LIST-04 | Do `created_after` and `created_before` filter on the creation date or the update date? The schema names them "created" but describes them as "Updated after" and "Updated before"; the date format is not stated. | API-LIST-014 | Open |
| OQ-LIST-05 | Is a part with no stock at all (total 0, below its minimum) included by `low_stock=true`, or only by `depleted_stock`? Neither filter is defined in the schema. | API-LIST-012 | Open |
| OQ-LIST-06 | Should `category=null` return only parts without a category? The schema describes `category` as "Filter by numeric category ID or the literal 'null'" and does not mention `cascade`. On local 1.6.3 the request returned parts that have a category as well as parts without one. In the local source (`part/api.py`, `filter_category`), `null` filters to uncategorized parts only when `cascade=false`; `cascade` defaults to true, and then the whole list is returned. Documented expectation: only uncategorized parts. Not yet confirmed by the user as intended behaviour. | API-LIST-009 | Resolved as an application finding, confirmed by the user (2026-10-30): with the default `cascade=true`, `category=null` returns every part, not only uncategorized ones. Local 1.6.3. |
