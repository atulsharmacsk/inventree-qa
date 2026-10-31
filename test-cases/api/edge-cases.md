# API Manual Tests: Edge Cases

Covers requests the API should refuse: unauthenticated and unauthorized access, invalid payloads, and conflicts with the current state of a record. Index, shared assumptions, and overall coverage: [api-manual-tests.md](../api-manual-tests.md).

`docs:` = `https://docs.inventree.org/en/stable/`. Schema operations are cited by the category page they appear on (`docs:api/schema/part/`, `docs:api/schema/auth/`).

**Version check:** the schema pages document API version 561; the index records `apiVersion` 561 for the local instance. No mismatch.

**Out of scope here (one home per concern):** missing required fields, maximum lengths, nullability, and read-only fields → Field-level validation. Part and category IDs that do not exist → OQ-PART-01 (API-PART-011, 012) and OQ-ACAT-01 (API-CAT-016). Circular category parents → API-CAT-013. Category delete rules → API-CAT-014, 015. Structural categories and supplier-link rules → [relational-integrity.md](relational-integrity.md).

**Test isolation:** every case creates its own records and removes only those. Checks that nothing was created or changed are made with an authenticated request. Cases that change a global setting restore its original value.

**Status codes:** the Parts schema lists only success responses (200, 201, 204). The only documented error status for these endpoints is 403 for an action outside the user's roles (`docs:api/#permission-denied`). Every other error status is an open question; the business result (nothing created, changed, or returned) is still asserted.

## Endpoints

| Method | Path | Schema page | Used for |
|---|---|---|---|
| `GET`, `POST` | `/api/part/` | `part` | Unauthenticated and unauthorized access, invalid payloads, duplicate IPN; `DELETE` is not listed for this path |
| `PATCH`, `DELETE` | `/api/part/{id}/` | `part` | Unauthorized changes, locked parts |
| `POST` | `/api/part/category/` | `part` | Nonexistent parent, duplicate names |
| Security schemes | `basicAuth`, `tokenAuth` (prefix `Token`), `cookieAuth`, `oauth2` | `part`, `auth` | Credentials sent with each request |
| `GET` | `/api/user/me/roles/` | `docs:api/#user-roles` | Confirms the restricted user's roles before API-EDGE-005 and 006 |

## Sources Ingested

| Page | Used for |
|---|---|
| `docs:api/schema/` | Schema categories and API version |
| `docs:api/schema/part/` | Part and category endpoints, success statuses, field types, `locked` ("Locked parts cannot be edited"), security schemes |
| `docs:api/schema/auth/` | Security schemes; the allauth endpoints on this page do not cover the Parts API, so no error status is taken from it |
| `docs:api/` | Authentication is required; token format `Token <TOKEN-VALUE>`; role-based authorization; 403 on permission denied |
| `docs:part/` | Locked parts and `PART_ENABLE_LOCKING`; active parts |
| `docs:part/create/` | Part "create" permission |

Also checked: the root `README.md` (correction log entry on a revoked token returning 401; Open Review Finding on OQ-PART-02) and the open questions in the other API area files and in `ui/part-creation.md` (OQ-CREATE-08).

## Requirements Traceability

| Req ID | Requirement | Source |
|---|---|---|
| REQ-EDGE-01 | Users must be authenticated to use the API (basic, token, or OAuth2). A token is sent as `Token <TOKEN-VALUE>`. | `docs:api/#authentication`, `#using-a-token`; schema security schemes |
| REQ-EDGE-02 | Users can only perform API actions that match their role permissions; an action outside their roles gets a 403 permission error. | `docs:api/#user-roles`, `#permission-denied` |
| REQ-EDGE-03 | Part fields have defined types: flags are boolean, `minimum_stock` is a number, `category` and `default_location` are nullable integers that refer to existing records. Request bodies are JSON, form-encoded, or multipart. | `docs:api/schema/part/` Part schema, request body media types |
| REQ-EDGE-04 | `/api/part/` documents `GET`, `PATCH`, `POST`, and `PUT` only. | `docs:api/schema/part/` |
| REQ-EDGE-05 | With part locking (`PART_ENABLE_LOCKING`) enabled, locked parts cannot be deleted. With it disabled, the locked state is ignored and all operations are permitted. The schema describes `locked` as "Locked parts cannot be edited". | `docs:part/#locked-parts`; schema Part `locked` |

## Unauthenticated and Unauthorized Access

### API-EDGE-001: List parts without credentials
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `GET /api/part/?limit=<n>` with no `Authorization` header and no session cookie.
- **Expected status:** 401.
- **Expected business result:** No part data is returned (the body has no `results`).
- **Requirements:** REQ-EDGE-01
- **Sources:** schema security schemes for `GET /api/part/`; `docs:api/#authentication`

### API-EDGE-002: Create a part without credentials
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` with a unique `name` and no credentials; then, authenticated, `GET /api/part/?search=<name>&limit=<n>`.
- **Expected status:** 401 for the `POST`; 200 for the authenticated `GET`.
- **Expected business result:** No part is created: the search returns `count` 0.
- **Requirements:** REQ-EDGE-01
- **Sources:** schema `POST /api/part/`; `docs:api/#authentication`

### API-EDGE-003: Use an invalid or badly formed token
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `GET /api/part/?limit=<n>` once for each `Authorization` value:

  | Variant | Header value |
  |---|---|
  | Unknown token | `Token <random string that was never issued>` |
  | Missing prefix | `<random string>` (no `Token ` prefix) |
  | Empty token | `Token ` |

- **Expected status:** 401 for each variant.
- **Expected business result:** No part data is returned for any variant.
- **Requirements:** REQ-EDGE-01
- **Sources:** schema `tokenAuth` ("required prefix 'Token'"); `docs:api/#using-a-token`

### API-EDGE-004: Use a revoked token
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned token, issued and then revoked within the test.
- **Request:** `GET /api/part/?limit=<n>` with `Authorization: Token <revoked token>`.
- **Expected status:** 401.
- **Expected business result:** No part data is returned.
- **Requirements:** REQ-EDGE-01
- **Sources:** `docs:api/#tokens` (tokens can be invalidated); schema `tokenAuth`

### API-EDGE-005: Change parts without the required role
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** No. Needs a user whose only Part role is *view*; the configured user is a superuser.
- **Preconditions:** A user whose roles (`GET /api/user/me/roles/`) include Part *view* but not *add*, *change*, or *delete*. A test-owned part `P`, created by a superuser.
- **Request:** As the restricted user, once for each row:

  | Action | Request |
  |---|---|
  | Create | `POST /api/part/` with a unique `name` |
  | Update | `PATCH /api/part/{P id}/` with a new `description` |
  | Delete | `DELETE /api/part/{P id}/` |

- **Expected status:** 403 for each request.
- **Expected business result:** No part is created; `P` still exists with its original `description`.
- **Requirements:** REQ-EDGE-02
- **Sources:** schema `POST /api/part/`, `PATCH`/`DELETE /api/part/{id}/`; `docs:api/#permission-denied`; `docs:part/create/` (Part "create" permission)

### API-EDGE-006: Read parts with view-only role
- **Priority:** P3
- **Type:** Boundary
- **Automation candidate:** No. Same restricted user as API-EDGE-005.
- **Preconditions:** The restricted user from API-EDGE-005 and a test-owned part `P`.
- **Request:** As the restricted user, `GET /api/part/{P id}/` and `GET /api/part/?limit=<n>`.
- **Expected status:** 200 for both.
- **Expected business result:** `P` is returned; the view role allows reading.
- **Requirements:** REQ-EDGE-02
- **Sources:** schema `GET /api/part/`, `GET /api/part/{id}/`; `docs:api/#user-roles`

## Invalid Payloads

### API-EDGE-007: Send a malformed JSON body
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes, once the application rejects malformed JSON with a 4xx (application finding, OQ-EDGE-02); the test is `fixme` until then
- **Preconditions:** None.
- **Request:** `POST /api/part/` with `Content-Type: application/json` and a body that is not valid JSON and contains a unique name token (for example `{"name": "<token>"`), then `GET /api/part/?search=<token>&limit=<n>`.
- **Expected status:** 400 for the `POST` (observed 500 on local 1.6.3: application finding); 200 for the `GET`.
- **Expected business result:** No part is created: the search returns `count` 0.
- **Requirements:** REQ-EDGE-03
- **Sources:** schema `POST /api/part/` request body media types

### API-EDGE-008: Send values of the wrong type
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** None.
- **Request:** `POST /api/part/` with a unique `name` and one wrong-typed field per request:

  | Field | Schema type | Value sent |
  |---|---|---|
  | `assembly` | boolean | `"not-a-boolean"` |
  | `minimum_stock` | number | `"abc"` |
  | `category` | integer \| null | `"abc"` |
  | `tags` | array of string | `"not-an-array"` |

  After each request, `GET /api/part/?search=<name>&limit=<n>`.
- **Expected status:** 400.
- **Expected business result:** No part is created for any row.
- **Requirements:** REQ-EDGE-03
- **Sources:** schema Part `assembly`, `minimum_stock`, `category`, `tags`

### API-EDGE-009: Refer to records that do not exist
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** An ID known not to exist for each referenced type (for example, the ID of a test-owned record created and then deleted).
- **Request:** One request per row, each with a unique `name`:

  | Request | Field | Value |
  |---|---|---|
  | `POST /api/part/` | `category` | Nonexistent category ID |
  | `POST /api/part/` | `default_location` | Nonexistent stock location ID |
  | `POST /api/part/category/` | `parent` | Nonexistent category ID |

  After each request, search for the name on the matching list endpoint.
- **Expected status:** 400.
- **Expected business result:** No part or category is created, so no record points to a missing category or location.
- **Requirements:** REQ-EDGE-03
- **Sources:** schema Part `category`, `default_location`; Category `parent`

### API-EDGE-010: Use a method the endpoint does not list
- **Priority:** P3
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned part.
- **Request:** `DELETE /api/part/` (the list endpoint) with no body, then `GET /api/part/{id}/` for the test-owned part.
- **Expected status:** 405 for the `DELETE`; 200 for the `GET`.
- **Expected business result:** No parts are deleted; the test-owned part still exists.
- **Requirements:** REQ-EDGE-04
- **Sources:** schema `/api/part/` operations

## Conflict Scenarios

### API-EDGE-011: Delete a locked part while locking is enabled
- **Priority:** P1
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** Part locking (`PART_ENABLE_LOCKING`) is enabled; restore the original value afterwards. One test-owned part with `locked: true` per row.
- **Request:** For each row, `DELETE /api/part/{id}/`, then `GET /api/part/{id}/`.

  | Part state |
  |---|
  | Locked and active |
  | Locked and inactive (so the active-part rule in OQ-PART-02 does not apply) |

- **Expected status:** 400 for the `DELETE`; 200 for the `GET`.
- **Expected business result:** The error body has a `non_field_errors` key (local 1.6.3: `["Cannot delete this part as it is locked"]`). The part is not deleted and is still `locked`.
- **Requirements:** REQ-EDGE-05
- **Sources:** schema `DELETE /api/part/{id}/`, Part `locked`; `docs:part/#locked-parts`; OQ-EDGE-04 (local 1.6.3, confirmed by user, 2026-10-31)

### API-EDGE-012: Delete a locked part while locking is disabled
- **Priority:** P2
- **Type:** Boundary
- **Automation candidate:** Yes
- **Preconditions:** Part locking (`PART_ENABLE_LOCKING`) is disabled; restore the original value afterwards. A test-owned inactive part (see OQ-PART-02) with `locked: true`.
- **Request:** `DELETE /api/part/{id}/`, then `GET /api/part/?search=<name>&limit=<n>`.
- **Expected status:** 204, then 200.
- **Expected business result:** The part is deleted: the search returns `count` 0.
- **Requirements:** REQ-EDGE-05
- **Sources:** schema `DELETE /api/part/{id}/`; `docs:part/#locked-parts`

### API-EDGE-013: Edit a locked part's fields
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** Part locking (`PART_ENABLE_LOCKING`) is enabled; restore the original value afterwards. A test-owned part with `locked: true` and a known `description`.
- **Request:** `PATCH /api/part/{id}/` with a new `description`, then `GET /api/part/{id}/`.
- **Expected status:** 200, then 200.
- **Expected business result:** The new `description` is stored, and the part is still `locked`. Locking restricts delete, BOM, and parameters (`docs:part/#locked-parts`), not the part's own fields.
- **Requirements:** REQ-EDGE-05
- **Sources:** schema Part `locked`, `PATCH /api/part/{id}/`; `docs:part/#locked-parts`; OQ-EDGE-05 (local 1.6.3, confirmed by user, 2026-10-31; the schema description "Locked parts cannot be edited" is a documentation defect)

### API-EDGE-014: Create a part with an IPN that is already used
- **Priority:** P2
- **Type:** Negative
- **Automation candidate:** Yes for the duplicates-allowed row; the duplicates-not-allowed row after OQ-CREATE-08
- **Preconditions:** A test-owned part `A` with a unique IPN. The duplicate IPN setting (`PART_ALLOW_DUPLICATE_IPN`) is in the row's state; tests do not change global settings, so each row runs only on an instance already in that state.
- **Request:** `POST /api/part/` with a different unique `name` and the same `IPN` as `A`, then `GET /api/part/?IPN=<IPN>&limit=<n>`.

  | `PART_ALLOW_DUPLICATE_IPN` | Expected |
  |---|---|
  | On (local 1.6.3) | 201; the IPN search lists both `A` and the new part |
  | Off | See OQ-CREATE-08 (not yet observed) |

- **Expected status:** As in the table.
- **Expected business result:** As in the table. `A` is unchanged in every row.
- **Requirements:** REQ-EDGE-03
- **Sources:** schema `POST /api/part/`, `GET /api/part/` `IPN` filter; OQ-CREATE-08 in [ui/part-creation.md](../ui/part-creation.md) (duplicates-allowed row confirmed by user on local 1.6.3, 2026-10-31)

### API-EDGE-015: Create a category with a name already used under the same parent
- **Priority:** P3
- **Type:** Negative
- **Automation candidate:** Yes
- **Preconditions:** A test-owned category `P` with a test-owned child `C`.
- **Request:** For each row, `POST /api/part/category/` with the row's `name` and `parent`, then `GET /api/part/category/?parent=<P id>&limit=<n>`.

  | `name` | `parent` | Expected |
  |---|---|---|
  | `C`'s name | `P` | 400, with a `non_field_errors` key (local 1.6.3: `["Duplicate names cannot exist under the same parent"]`); not created |
  | `C`'s name | none (top level) | 201 |
  | `C`'s name in upper case | `P` | 201 (the check is case-sensitive) |

- **Expected status:** As in the table.
- **Expected business result:** As in the table. `C` is unchanged in every row.
- **Requirements:** REQ-EDGE-03
- **Sources:** schema `POST /api/part/category/`, `GET /api/part/category/` `parent` filter; OQ-EDGE-06 (local 1.6.3, confirmed by user, 2026-10-31)

## Coverage

| Sub-area | P1 | P2 | P3 | Total |
|---|---|---|---|---|
| Unauthenticated and Unauthorized Access | 4 | 1 | 1 | 6 |
| Invalid Payloads | 1 | 2 | 1 | 4 |
| Conflict Scenarios | 1 | 3 | 1 | 5 |
| **Total** | **6** | **6** | **3** | **15** |

All 5 requirements are covered by at least one case.

## Open Questions

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-EDGE-01 | Which status is returned for requests with no credentials, an unknown or badly formed token, or a revoked token: 401 or 403? The documentation says users must be authenticated but gives no status; the schema lists only success responses. An earlier local run (README correction log) returned 401 "Token has been revoked" for a revoked token; not yet confirmed by the user. | API-EDGE-001, 002, 003, 004 | Resolved: 401 with `{"detail": ...}` for no credentials, an unknown token, a token without the `Token` prefix, an empty token, and a revoked token. Local 1.6.3, confirmed by user (2026-10-30). |
| OQ-EDGE-02 | Which status and error body are returned for a malformed JSON body, a wrong-typed value, or a reference to a record that does not exist? The schema documents only success responses. | API-EDGE-007, 008, 009 | Resolved: a wrong-typed value or a reference to a record that does not exist returns 400 (API-EDGE-008, 009), and 400 is the expected status for a malformed JSON body (API-EDGE-007). Local 1.6.3, confirmed by user (2026-10-30). **Application finding:** a malformed JSON body returned 500 (`{"error": "AttributeError", ...}`) instead of 400, so API-EDGE-007 is `fixme` and fails against the current build. |
| OQ-EDGE-03 | Which status is returned for a method the endpoint does not list, such as `DELETE /api/part/`? | API-EDGE-010 | Resolved: 405 `Method "DELETE" not allowed.`. Local 1.6.3, confirmed by user (2026-10-30). |
| OQ-EDGE-04 | Which status is returned when deleting a locked part with locking enabled? The documentation says it cannot be deleted but gives no status. | API-EDGE-011 | Resolved: 400 `{"non_field_errors": ["Cannot delete this part as it is locked"]}`, for active and inactive locked parts; the part is kept. Local 1.6.3, confirmed by user (2026-10-31). |
| OQ-EDGE-05 | Can the fields of a locked part be edited? The schema describes `locked` as "Locked parts cannot be edited", but `docs:part/#locked-parts` lists only delete, BOM, and parameter restrictions. | API-EDGE-013 | Resolved: intended behaviour. `PATCH` and `PUT` on a locked part return 200 and store the changes; the part stays locked. The schema description "Locked parts cannot be edited" is recorded as a schema documentation defect. Local 1.6.3, confirmed by user (2026-10-31). |
| OQ-EDGE-06 | Are duplicate category names under the same parent rejected, and with which status? Neither the schema nor the documentation states a uniqueness rule. | API-EDGE-015 | Resolved: 400 `{"non_field_errors": ["Duplicate names cannot exist under the same parent"]}` for the same name under the same parent; the same name under another parent, or in different letter case, is accepted (201). Local 1.6.3, confirmed by user (2026-10-31). |
