# InvenTree QA Submission

## Scope

- Application: InvenTree, Parts module only (creation, categories, parameters, templates and variants, revisions, units, stock, BOM, and related API endpoints).
- Sources: https://docs.inventree.org/en/stable/part/ (and sub-pages) for functional behavior, https://docs.inventree.org/en/stable/api/schema/ (and category pages) for the API contract, https://github.com/inventree/InvenTree, optional https://demo.inventree.org.
- Target: local Docker instance selected with `ENV=LOCALHOST` (`http://localhost`; `ENV=REMOTE` targets `https://demo.inventree.org`, mapped in `automation/shared/environments.ts`). Note when its behavior differs from the stable documentation.
- Frameworks: Playwright Test with TypeScript for API (`automation/api/`) and UI (`automation/ui/`). Each is an independent npm package.

## Documentation Map

Use the page matching the functionality under test, and cite it as the source reference. Base URL: `https://docs.inventree.org/en/stable/`. The docs version may be newer than the local instance; record differences.

| Functionality | Page | Use for |
|---|---|---|
| Parts overview, categories, attributes, locked and active parts, units, images | `part/` | Category hierarchy and filtering; attribute flags (Virtual, Template, Assembly, Component, Testable, Trackable, Purchaseable, Salable, Consumable); locking (`PART_ENABLE_LOCKING`); inactive parts; min/max stock |
| Part creation and import | `part/create/` | Create Part form, initial stock, supplier options, import from file, import from supplier, permissions |
| Part detail view and tabs | `part/views/` | Part fields (IPN, name, revision, units); tab visibility rules per attribute (Stock, BOM, Allocated, Build Orders, Used In, Variants, Parameters, Attachments, Related Parts, Test Templates, etc.) |
| Revisions | `part/revision/` | Revision fields, restrictions (circular reference, unique code, template revisions, template references), revision settings, revision selector |
| Templates and variants | `part/template/` | Enabling templates, creating variants, serial number uniqueness across variants, stock roll-up |
| Virtual parts | `part/virtual/` | No stock items, BOM, build and sales order behavior |
| Consumable parts | `part/consumable/` | Part-level vs BOM-line consumable, build order behavior |
| Trackable parts | `part/trackable/` | Batch and serial numbers, serial number input syntax |
| Test templates | `part/test/` | Test template fields, generated test key, cascade to variants |
| Parameters and parametric tables | `concepts/parameters/` | Parameter templates, uniqueness, unit validation, category defaults, parametric filtering and sorting |
| Units of measure | `concepts/units/` | Valid units, conversion, notation, case sensitivity, custom units |
| Bill of Materials | `manufacturing/bom/` | BOM line item fields, editing, import, substitutes, inherited items, validation |
| Data import | `concepts/data_import/` | Import sessions, field mapping, row processing, permissions |

If a page is unreachable or does not cover the behavior, record an open question instead of using another source.

## API Sources

API cases and tests use two kinds of source. Cite both in each case.

1. **Functional behavior** (what the feature should do): the matching functional page in the Documentation Map above.
2. **API contract** (endpoints, methods, parameters, fields, constraints, status codes): start at the [API Schema overview](https://docs.inventree.org/en/stable/api/schema/#api-schema-documentation), then use the category page for the endpoint under test. Never infer API contract details from functional pages.

The schema overview page states the API version it documents. Compare it with `apiVersion` from `http://localhost/api/`, and record any mismatch in the area file.

| Endpoints | Schema category page |
|---|---|
| Parts, part categories, parameters, test templates, related parts, part stocktake | `api/schema/part/` |
| BOM items and substitutes | `api/schema/bom/` |
| Stock items and stock locations | `api/schema/stock/` |
| Suppliers, manufacturers, supplier parts, manufacturer parts | `api/schema/company/` |
| Build orders | `api/schema/build/` |
| Purchase, sales, and return orders | `api/schema/order/` |
| Token and authentication | `api/schema/auth/` |
| Settings (for example part locking or initial stock) | `api/schema/settings/` |
| Users and permissions | `api/schema/user/` |
| Endpoints not listed above | the overview page, to find the right category |

If an endpoint is not on its category page, record an open question instead of guessing.

## Inspecting the Local Instance

Use these, in order:

1. **Unauthenticated checks:** fetch `http://localhost/api/` for the server version, API version, and active plugins; fetch `http://localhost/web/` for the login page.
2. **Playwright MCP (`playwright` tools):** navigate to `http://localhost/web/` and use `browser_snapshot` to read the accessibility tree and choose role, label, or test-id selectors for page objects and to check open questions. Each action reports the Playwright code it ran; reuse those locators. Never type credentials into the page yourself. If the page shows the login form, ask the user to log in in the Playwright MCP browser window, then continue. Its snapshots and logs are written to `.playwright-mcp/`, which is git-ignored and is not a deliverable.
3. **Integrated browser (`browser` tool):** use only if Playwright MCP is unavailable, with the same login rule.
4. **Fallback for authenticated pages:** if no browser tool is available, run `npm run snapshot -- <path> ["Click target" ...]` from `automation/ui/` (for example `npm run snapshot -- /web/part/category/index/parts action-menu-add-parts`). It logs in with `.env` credentials and prints the page's accessibility tree with the username redacted.

The configured user is a superuser, so permission-restricted behavior cannot be observed with it. Do not save screenshots or page output that contain record data or the username into deliverables without reviewing them.

### Observed Behavior Needs User Confirmation

The documentation is the source of truth for expected results. Behavior seen on the local instance does not change test cases until the user confirms it:

1. Report each observation to the user: what was observed, where, the related open question or case, and what the documentation says (or that it is silent).
2. Ask whether this is the correct, intended behavior. Ask about one observation at a time and wait for the answer before asking the next. Do not edit test cases before the user answers.
3. Apply the answer:
   - **Confirmed:** update the expected result, mark the open question resolved, and cite "Local <server version>, confirmed by user (YYYY-MM-DD)" as the source.
   - **Not correct:** keep the documented expected result and record the observation as an application finding.
   - **Unsure:** leave the open question open and add the observation to it.
4. Record each change in the `README.md` correction log.

## Rules

- Treat the local InvenTree application source as read-only. Keep deliverables inside this workspace.
- Confirm behavior against the supplied requirements, API schema, or product documentation before asserting expected results.
- Mark unsupported behavior and ambiguous requirements as open questions rather than guessing.
- Keep secrets out of source files, test output, generated artifacts, prompts, screenshots, and recordings.
- Prioritize by risk: P1 = data integrity or core workflow failure, P2 = important with a workaround, P3 = low impact.
- Give every manual case a unique ID and source reference, and put that ID in the title of any test that automates it.
- Run the narrowest relevant test, the project's type check, and `npm run lint:specs` after code changes. Report actual results and unresolved gaps.
- Record every correction made to agent-generated output in the `README.md` correction log, with the reason.

<!-- Customization set v1.3 (2026-10-30). History: CHANGELOG.md -->
