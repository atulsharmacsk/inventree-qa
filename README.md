# InvenTree QA Submission

This submission contains quality-engineering instructions, manual test case documents, Playwright API and UI automation, and a location for optional execution evidence.

## Structure

- `agents/` indexes the agent artifacts required by the brief: `agents.md` (custom agent definitions), `prompts.md` (phase prompts and how to run them), and `system-instructions.md` (instruction files). All point to the files in `.github/`.
- `.github/` contains the GitHub Copilot agent configuration:
  - `copilot-instructions.md`: shared scope and rules applied to every request
  - `agents/inventree-quality-engineer.agent.md`: the custom agent used for all phases
  - `instructions/`: file-specific rules for manual test cases and Playwright tests
  - `prompts/`: one prompt per phase, run in order as slash commands: `/ui-manual-tests`, `/api-manual-tests`, `/api-automation`, `/ui-automation`, `/review-and-correct`
- `test-cases/` contains the manual test cases. `ui-manual-tests.md` and `api-manual-tests.md` are index pages with coverage summaries; the cases are in one file per feature area under `test-cases/ui/` and `test-cases/api/`. `api-automation-tests.md` and `ui-automation-tests.md` give the run order for the automation phases.
- `automation/api/` contains authenticated API checks. See its README for setup and commands.
- `automation/ui/` contains browser-based checks with a one-time login setup.
- `automation/shared/` contains TypeScript source used by both projects (API token handling, part and category API services, models, test-name helper, cleanup annotations, redaction patterns). It has no `package.json`; each project compiles it with its own dependencies, so the two projects stay separate npm packages.
- `video/` is reserved for an execution recording or a link to one; no recording was supplied.

## Setup

The API and UI projects are independent npm packages. In each project directory, run `npm ci`. Configure `automation/api/.env` from `.env.example` for API tests. Set `ENV=LOCALHOST` (default, `http://localhost`) or `ENV=REMOTE` (`https://demo.inventree.org`); the URL mapping is in `automation/shared/environments.ts`.

Run the API checks with `npm run test:api` and the UI checks with `npm run test:ui`, each from its corresponding project directory. Install the Playwright Chromium browser for UI checks with `npx playwright install chromium`. Run only the smoke set with `npx playwright test --grep @smoke`.

## Continuous Integration

[.github/workflows/playwright.yml](.github/workflows/playwright.yml) runs the API and UI projects in parallel jobs (typecheck, then tests).

| Trigger | Tests run | Environment |
|---|---|---|
| Pull request to `main` that changes `automation/**` | `@smoke` | `REMOTE` |
| Push (merge) to `main` that changes `automation/**` | `@smoke` | `REMOTE` |
| Manual (*Actions > Playwright automation > Run workflow*) | `tags` input as a `--grep` filter (default `@smoke`) | `environment` input |

Build parameters (manual runs):

| Parameter | Values |
|---|---|
| `environment` | `LOCALHOST` → `http://localhost` (runs on a `self-hosted` runner on the Docker host); `REMOTE` → `https://demo.inventree.org` (GitHub-hosted runner). Passed to the tests as `ENV`; the URL comes from `automation/shared/environments.ts` |
| `tags` | Playwright `--grep` filter, default `@smoke` |

**Roles are chosen in code, not in the pipeline,** so one build can run tests as several users. A test passes its role (`SUPERUSER` by default, or `READER`) with `test.use({ role: 'READER' })`, and `automation/shared/roles.ts` reads `<ROLE>_USERNAME` / `<ROLE>_PASSWORD` (for example `SUPERUSER_USERNAME`, `READER_USERNAME`). In the API project the role applies to every request in that block; in the UI project it selects the browser login (one storage state per role, saved by `auth.setup.ts`), while API setup and cleanup stay on the superuser. Tests for a role with no credentials in the current environment are skipped with a reason. Each login is checked against `GET /api/user/me/`: `SUPERUSER` must be a superuser, and `READER` must be a non-staff, non-superuser account. `LOCALHOST` has only the superuser, so leave the reader variables empty there. Trace redaction covers every configured password.

Create two GitHub environments (*Settings > Environments*) with these secrets. Never commit the values.

| Environment | Secrets |
|---|---|
| `LOCALHOST` | `SUPERUSER_USERNAME`, `SUPERUSER_PASSWORD` |
| `REMOTE` | `SUPERUSER_USERNAME`, `SUPERUSER_PASSWORD`, `READER_USERNAME`, `READER_PASSWORD` |

The superuser secrets are required; the job fails before tests run without them. The public demo may run a newer version than local 1.6.3 / API 561. Pull requests from forks receive no secrets. Reports and redacted traces are uploaded as `playwright-report-api` and `playwright-report-ui` artifacts.

Smoke set: API-PART-001, API-PART-005, API-CAT-001, API-CAT-003, SMOKE-001, SMOKE-002, UI-CREATE-001 (the UI login setup always runs).

## Tool Choices and Approach

Playwright Test with TypeScript is used for both automation projects. API authentication is provided by the shared worker-scoped fixture in `automation/api/tests/fixtures.ts`; tests must not duplicate credential or token handling. UI checks use accessible browser-level behavior and explicit assertions. Manual cases must be grounded in the InvenTree schema and documentation referenced by the prompt, with unsupported details recorded as open questions.

Credentials and tokens belong only in ignored local environment files. Do not put secrets in test cases, reports, prompts, screenshots, or recordings.

## Agent Output Corrections

Review of agent-generated artifacts on 2026-10-29 (`/review-and-correct`).

| Artifact | Issue | Change made | Reason |
|---|---|---|---|
| `test-cases/ui/part-creation.md` UI-IMPORT-001, 002, 008, 011 | Preconditions listed only Part `change` permission, but these cases open the *Add Parts* menu, which requires Part "create" permission (REQ-CR-02). | Added Part "create" permission to the preconditions. | Without it, the menu is hidden and the case fails for the wrong reason. In UI-IMPORT-008, the non-staff check would not be isolated. |
| `test-cases/ui/part-creation.md` UI-CREATE-008 | Expected "a form error is shown for *Units*". The documentation says invalid units are not valid and form errors block submission, but not that the error is attached to the *Units* field. | Changed to "the form is not submitted, a form error is displayed, and no part is created". | Expected results must not go beyond the documentation. |
| `test-cases/ui/part-creation.md` OQ-CREATE-09 | The default-unit question was linked to UI-CREATE-007, which sets an explicit unit and does not depend on the default. | Changed *Affects* to "None yet (relevant to the Units of measure area)". | Incorrect traceability. |
| `test-cases/ui/part-creation.md` UI-CREATE-005, OQ-CREATE-01 | Expected result depended on an open question about required fields. The local 1.6.3 *Add Part* form marks only *Name* as required. | Expected result now names *Name* as the required field; OQ-CREATE-01 marked resolved. Added a Status column to the open-questions table. | Observation confirmed as correct by the user (2026-10-29). |
| `automation/api/playwright.config.ts` | The agent first set `trace: 'off'`, so failure traces were not available. | Set `trace: 'retain-on-failure'` and added `src/reporters/trace-redaction.reporter.ts` before the html reporter. It scrubs `Token` and `Basic` auth headers, token response bodies, and the configured password from every `trace.zip`. A scan of the generated traces found 0 raw credentials. | User asked to keep tracing with the token hidden (2026-10-29). |
| `automation/api/tests/parts.crud.spec.ts` | Specs made HTTP calls directly and had no step descriptions. | Added a service layer (`src/services`), models, data factories, and schema assertions. Fixtures now provide services that clean up the records they create. Specs use `test.step` for Arrange, Act, and Assert. `health.spec.ts` follows the same pattern. | User requested a maintainable, layered framework with `test.step` (2026-10-29). |
| `.github/agents`, `.github/instructions/playwright-tests.instructions.md`, automation prompts | The prompts told the agent to add helpers only when they remove duplication, which allowed direct operations in specs. | Added the layered framework, `test.step`, code-quality, artifact-redaction, and verification rules; updated both automation prompts to match. | Make future automation follow the same standards. |
| `automation/api/src/global-setup.ts`, `tests/fixtures.ts` | The token was fetched once in global setup and passed to workers through an environment variable. The VS Code Playwright extension reused a token that had since been revoked, so tests run from the editor failed with 401 "Token has been revoked". Tokens were also never revoked, and the extension's trace viewer showed them unredacted. | Removed global setup. A worker-scoped `apiToken` fixture (`src/auth.ts`) requests a uniquely named token and revokes it when the worker finishes. A recount after a run confirmed the run's token was revoked. | User reported 401 when running from the VS Code test explorer (2026-10-29). |
| `automation/api/src/services/part.service.ts` (API-PART-007) | `list()` called `GET /api/part/` without `limit`. The local OpenAPI schema (`/api/schema/`, API 561) marks `limit` as required; without it the server returns an unpaginated array and the test failed with "(root) must be object". | `list()` now sends `limit` (`DEFAULT_PAGE_LIMIT` in `src/models.ts`). | Test defect: the request did not meet the schema contract. The docs page does not show the Required flag, so the requirement was confirmed in the local schema and in `InvenTree/schema.py`. |
| `test-cases/api/parts-crud.md` API-PART-007, REQ-APART-04 | The request and requirement omitted the required `limit` parameter. | Request is now `GET /api/part/?limit=<n>`; REQ-APART-04 cites the local schema. | Same cause as above. The expected result is unchanged. |
| `test-cases/api/parts-crud.md` API-PART-005 | The precondition "A part created by API-PART-002" made the case depend on another case. | Changed to "A test-owned part with a description and IPN". | Cases must be independent. The automation already created its own part. |
| `automation/api/src/services/category.service.ts` | Category cleanup sent `DELETE` with no body. The server returns 400 (`delete_parts` and `delete_child_categories` are required), so test categories were left behind. | Cleanup sends `{ delete_parts: false, delete_child_categories: false }`. The one leftover test category (`pw-category-*`) was deleted. | Test defect (data leak). `false` prevents the delete from cascading to records the test did not create. The published schema does not list this request body (see the open findings below). |
| `automation/api/tests/fixtures.ts`, `src/services/*.service.ts` | Cleanup failures went to `console.warn` and did not appear in the report. | `deleteCreated()` returns its failures, and fixtures record them as `cleanup` annotations. | Follows the instruction to report failed deletes as `cleanup` annotations. |
| `automation/api/tests/parts.crud.spec.ts` | Step names such as "Create the part" did not include the endpoint. | Steps are renamed to include the endpoint, for example `PATCH /api/part/{id}/ with active=false`. Assertions are unchanged. | Follows the `test.step` naming rule in the Playwright instructions. |
| `automation/api/README.md` | It described `src/reporters/trace-redaction.reporter.ts`, `ResourceService`, and `src/models/`, `src/data/`, and `src/assertions/`, none of which exist. Redaction is actually done in `src/global-teardown.ts`. | The structure and trace sections now describe the actual files. | The documentation did not match the code. Earlier rows in this log that mention the reporter and `health.spec.ts` describe a previous state that was later replaced. |
| `automation/api/src/checks.ts`, `test-cases/api/parts-crud.md` (REQ-APART-01, API-PART-001, OQ-PART-06) | The case and schema check required `category_name` on every Part. The local instance omits it when `category` is null, because the schema generator marks every read-only field as required by default (`InvenTree/schema.py`). | The schema check skips only a missing `category_name` when that part's `category` is null; every other schema error still fails. The generated schema files are unchanged. Added OQ-PART-06 (Resolved). | User confirmed this is intended behaviour and a schema documentation defect (2026-10-29). |
| `automation/.gitignore` | `/playwright/.auth/` is relative to `automation/`, so it did not cover the UI project's storage state (`automation/ui/playwright/.auth/`). | Added `/ui/playwright/.auth/`. | The session cookie would otherwise be committable. |
| `automation/ui/` (Run A) | The UI project had no login, page objects, fixtures, or redaction. The smoke test called `page.goto` in the spec and had no step names. The config used `trace: 'on-first-retry'` with CI retries and no redaction. | Added `setup` project with storage state, fixtures, page objects and components, API services, factories, and `src/global-teardown.ts` redaction (session/CSRF cookies, auth and CSRF headers, tokens, password). Traces `retain-on-failure`, screenshots on failure, no retries. Replaced `app.spec.ts` with `smoke.spec.ts` (SMOKE-001, SMOKE-002). | Implements the UI automation framework rules. A forced `--trace on` run produced 6 archives with 0 matches for the real session and CSRF values, the password, raw tokens, or Basic headers. |
| `automation/ui/src/pages/parts-list.page.ts`, `src/components/navigation.component.ts` | First run failed: the Parts header tab opens the *Part Categories* panel, and the header and panel both have a "Parts" tab (strict-mode violation). | Added `openPartsPanel()`; scoped header tabs to the tablist that contains *Dashboard*. | Test defects found during the first run. |
| `automation/ui/src/components/part-form.component.ts` (Run B) | Submit clicks timed out: the "First Use Tour available" toast intercepts pointer events over Submit. An interim fix that clicked the toast's first button pressed "Start Tour" on the shared user. | Forms are submitted with keyboard activation (focus Submit, press Enter); the toast is left untouched. The dialog is matched by title text because its accessible name was not always resolved. | Test defect. The toast's only actions ("Start Tour", "Dismiss permanently") change user state, which tests must not do. The tour may have been started once during diagnosis. |
| `automation/ui/playwright.config.ts` (Run B) | With 2+ workers, UI-CREATE-001/003 failed intermittently: `GET /api/user/me/` received no response and the front-end showed the login page. No logout request was made (traces show every session check returned 200). | `workers: 1`, with a comment. Serial runs passed 3 of 3. | Environment issue: the local Docker instance does not handle parallel browsers reliably. |
| `automation/api/`, `automation/ui/` (shared code) | The UI project copied API code instead of reusing it: token request/revoke, the `apiToken` fixture, `PartService`, `CategoryService`, redaction patterns, `uniqueName`, and models. Fixes (active-part delete, category delete flags) had to be applied twice. | Moved the common code to `automation/shared/` (plain source, `import type` only for packages). Both projects import it by relative path, add `../shared/**/*.ts` to `tsconfig` `include`, and map `@playwright/test` types with `paths`. Removed the copies. The `jszip` trace rewrite stays in each project's `global-teardown.ts` because `shared/` has no `node_modules`. | User asked to remove duplication while keeping two separate npm packages, as the assignment requires (2026-10-29). Results are unchanged: API 16 passed, 2 skipped; UI 6 passed, 4 skipped. A forced-trace scan (12 UI and 32 API archives) found 0 secret matches. |
| `automation/api/playwright-report/` (generated) | An earlier HTML report (10:24) contained 8 traces with unredacted `Authorization: Basic` headers (base64 credentials). | Regenerated the report with the current config. A scan of the new report and `test-results/` found 0 raw tokens, 0 Basic headers, and 0 password matches. | Secret exposure in an artifact. That report came from a run outside the configured pipeline. The current global-teardown redaction is effective. |
| `test-cases/api/categories-crud.md` API-CAT-014, OQ-ACAT-03 | API-CAT-014 was marked automation-ready with a plain `DELETE` and expected 204, but an earlier local run showed that this request returns 400 without the `delete_parts` / `delete_child_categories` body. | API-CAT-014 now references OQ-ACAT-03 and is ready only after it is resolved; the observation was added to OQ-ACAT-03. Expected result unchanged. | Agent drafted the case without checking existing findings. The observation is not yet confirmed by the user, so it stays an open question. |
| `.github/instructions/*.md`, `.github/agents/inventree-quality-engineer.agent.md`, `.github/prompts/api-automation.prompt.md`, `ui-automation.prompt.md` | Instructions still described the earlier framework: a `ResourceService` base class, `src/reporters/trace-redaction.reporter.ts`, `src/models/`, `src/assertions/`, `health.spec.ts`, `app.spec.ts`, and "no login setup yet". None of these exist; shared code is in `automation/shared/` and redaction is in `src/global-teardown.ts`. Manual-case rules did not require checking recorded findings (which caused the API-CAT-014 error) and did not make open-question IDs unique across files. | Updated the layer table, redaction rules, and prompt context to the actual layout; prompts now read the automation plan files and the README findings; manual-case rules now require checking README findings and unique OQ IDs; added rules against scratch `*.tmp.ts` files and retries for flakiness. | Stale instructions would make the agent recreate removed files or contradict known local behavior. |
| `automation/api/playwright.config.ts` | `retries: process.env.CI ? 2 : 0` would retry failures once the tests run in GitHub Actions (which sets `CI`), contradicting the rule against using retries to hide flakiness. | `retries: 0`. | Found while adding the CI workflow (2026-10-30). The UI config already used `retries: 0`. |
| `automation/api/tests/categories.crud.spec.ts` API-CAT-003 | The step that checks `GET /api/part/category/?parent={id}` used `listOrFail`, so the 200 status from the manual case was never asserted with `expect`; the playwright instructions limit `*OrFail` helpers to arrange steps. | The step now calls `categories.list()` and asserts `status() === 200` before the schema and membership checks. | Review of API-CAT-003 (2026-10-30). Assertion strengthened, not weakened. The manual case matched `docs:api/schema/part/` (`POST` 201, `parent` filter, `limit` required) and `docs:part/#part-category`; no duplicates found. |
| `automation/api/src/checks.ts` (API-PART-007) | With `validateFormats: false`, a part with `link: ""` matched both `oneOf` branches of the Part `link` schema (`format: uri` and `maxLength: 0`), so the check reported "must match exactly one schema in oneOf" for valid data. Seen on REMOTE, where demo parts have `link: ""`. | Formats stay unchecked, except that `""` is no longer accepted as a `uri`, so it matches only the `maxLength: 0` branch. | Review of API-PART-007 (2026-10-30). Test defect in the checker. A full URL check was tried first but newly rejected relative `image` paths that were never checked before, so it was not kept. No other assertion changed. |
| `automation/api/src/checks.ts`, `test-cases/api/parts-crud.md` (API-PART-007, OQ-PART-07) | On REMOTE the part schema check failed on numeric `pricing_min` / `pricing_max` and `null` `IPN`, which the API 561 and 567 schemas do not allow. | `isKnownSchemaGap` now skips only those errors (number for `pricing_*`, `null` for `IPN`); added OQ-PART-07 (Resolved). | User confirmed this is intended behaviour and a schema documentation defect (2026-10-30). |

### Open Review Findings

| Finding | Status |
|---|---|
| **Observation awaiting user confirmation (API-PART-007 on REMOTE):** `https://demo.inventree.org` (InvenTree 1.7.0 dev, API 567) returns `pricing_min` / `pricing_max` as JSON numbers (for example `5.25`) and `IPN` as `null` for some parts. Both the API 561 schema used by the tests and the published API 567 schema define `pricing_min` / `pricing_max` as decimal strings or null and `IPN` as a non-nullable string. On LOCALHOST (1.6.3, API 561) API-PART-007 passes. | Resolved: confirmed by the user as intended, a schema documentation defect (OQ-PART-07, 2026-10-30). `src/checks.ts` accepts only numeric `pricing_min` / `pricing_max` and `null` `IPN`; every other schema error still fails. |
| Schema documentation defect: the API 561 schema lists `category_name` as required, but it is omitted for parts with no category (OQ-PART-06). | Resolved: confirmed by the user as intended (2026-10-29). Handled in `src/checks.ts`. |
| Part `DELETE` returned 500 twice during parallel cleanup. A later retry on the same parts returned 204. | Environment issue (intermittent under parallel load). Not reproduced in two later runs. |
| `DELETE /api/part/category/{id}/` requires `delete_parts` and `delete_child_categories` in the body, but neither the published nor the local schema lists a request body. | Recorded as OQ-ACAT-03 in `test-cases/api/categories-crud.md` (affects API-CAT-014, 015). Awaiting user confirmation. |
| UI areas: 5 of 6 drafted (Part creation, Part detail view tabs, Part categories, Part attributes, Part revisions). API areas: 5 of 6 drafted (Parts CRUD, Part Categories CRUD, Parts list, Relational integrity, Edge cases). | Generate the remaining areas with `/ui-manual-tests <area>` and `/api-manual-tests <area>`. |
| Required negative scenarios: duplicate IPN is drafted as UI-CREATE-016 (expected result pending OQ-CREATE-08); inactive part restrictions are drafted as UI-ATTR-013 (expected result pending OQ-ATTR-05); revision-of-revision prevention is drafted as UI-REV-007 (expected result pending OQ-REV-03). | Resolve OQ-CREATE-08, OQ-ATTR-05 and OQ-REV-03 on the local instance. |
| UI-TAB-001 to UI-TAB-004 (tab visibility by attribute) overlap the planned Part attributes area ("how each changes tabs and actions"). | Resolved: `part-attributes.md` references these cases and covers only the other tabs (UI-ATTR-002). |
| UI-CREATE-008 and UI-IMPORT-004 assume an invalid unit (`KG`) is rejected at creation and import. The documentation states that `KG` is not a valid unit but does not show the error. | Kept; confirm on the local instance. |
| The UI project has only smoke checks (SMOKE-001, SMOKE-002), which do not map to manual case IDs. | Runs B to F in `test-cases/ui-automation-tests.md`. |
| **Observation awaiting user confirmation (OQ-PART-02):** On local 1.6.3, `DELETE /api/part/{id}/` on an active part returns 400 "Cannot delete this part as it is still active"; after `active=false` it returns 204. | Open. Cleanup already deactivates first. |
| Leftover test records from earlier runs: 28 parts named `pw-*` and 20 categories named `pw-*` (including `pw-api-cat-*`), created before the cleanup fixes. | Not deleted; awaiting user approval. |
| No duplicate cases found. Coverage counts were rechecked: part-creation 9/11/7 = 27 (21/21 requirements), part-detail-tabs 8/13/7 = 28 (25/25), parts-crud 5/5/2 = 12 (11/11). Spot-checked expected results against `part/views/`, `part/test/`, and `api/schema/part/`; they match. | None |

### Test Results

Run on 2026-10-29 against the local instance (InvenTree 1.6.3, API 561) from the terminal.

| Project | Typecheck | Result |
|---|---|---|
| API | `npm run typecheck`: passed | 16 passed, 0 failed, 2 skipped (18) |
| UI | `npm run typecheck`: passed | 6 passed, 4 skipped (setup, SMOKE-001, SMOKE-002, UI-CREATE-001, 003, 005; fixme: UI-CREATE-009, 013, UI-IMPORT-007, 008) |

| Case | Result | Classification |
|---|---|---|
| API-PART-001, 005, 009 | Failed on missing `category_name`; pass after OQ-PART-06 was resolved | Schema documentation defect (confirmed by user) |
| API-PART-007 | Failed ("(root) must be object", then missing `category_name`); passes after both fixes | Test defect (fixed) plus the same schema documentation defect |
| API-PART-002, 008, 010 (×10 flags) | Passed | - |
| API-PART-003, 011 | Skipped (`test.fixme`, blocked by OQ-PART-03 and OQ-PART-02) | - |
| UI smoke (`smoke.spec.ts`: SMOKE-001, SMOKE-002) | Passed | - |
| UI-CREATE-001, 003, 005 | Passed (serial run) | Intermittent parallel failures: environment issue |
| UI-CREATE-009, 013, UI-IMPORT-007, 008 | Skipped (`test.fixme`: setting disabled, superuser only, OQ-CREATE-05, OQ-CREATE-06) | - |
| API-CAT-003 (2026-10-30, local 1.6.3 / API 561; API and UI typecheck passed) | Passed before and after the review fix (1 passed, 0 cleanup annotations) | - |
| API-PART-007 on REMOTE (2026-10-30, demo 1.7.0 dev / API 567) | Failed: `link` oneOf errors (fixed in the checker), then `IPN` and `pricing_*` type errors that remain | Test defect (fixed) plus an observation awaiting user confirmation |
| Full API suite on LOCALHOST after the checker fix (2026-10-30, 1.6.3 / API 561) | 18 passed, 0 failed, 7 skipped (`fixme`: API-PART-003, 011, API-CAT-013 ×2, 014, 015, 016) | - |