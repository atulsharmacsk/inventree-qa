# UI Automation Plan

Run order for the UI automation phase (`/ui-automation`). Each run automates the P1 cases of one manual area from [ui-manual-tests.md](ui-manual-tests.md). Project: `automation/ui/` (Playwright Test, TypeScript, Chromium). Rules: [playwright-tests.instructions.md](../.github/instructions/playwright-tests.instructions.md).

## Prerequisite

An area can be automated only after its manual file is `Drafted` in the index. Manual runs, in order:

| # | Command | File | Prefix | Main doc pages | Status |
|---|---|---|---|---|---|
| 1 | `/ui-manual-tests Part creation` | ui/part-creation.md | UI-CREATE, UI-IMPORT | part/create/, concepts/data_import/, concepts/units/ | Done |
| 2 | `/ui-manual-tests Part detail view tabs` | ui/part-detail-tabs.md | UI-TAB | part/views/, part/template/, part/test/, concepts/parameters/, manufacturing/bom/ | Done |
| 3 | `/ui-manual-tests Part attributes` (include edit, activate/deactivate, delete, inactive-part restrictions) | ui/part-attributes.md | UI-ATTR | part/, part/virtual/, part/trackable/, part/consumable/ | Done |
| 4 | `/ui-manual-tests Part categories` | ui/part-categories.md | UI-CAT | part/#part-category, concepts/parameters/ | Done |
| 5 | `/ui-manual-tests Units of measure` | ui/units-of-measure.md | UI-UNIT | concepts/units/, part/#units-of-measure | To do |
| 6 | `/ui-manual-tests Part revisions` | ui/part-revisions.md | UI-REV | part/revision/ | Done |
| 1b | `/ui-manual-tests Part creation` (append UI-CREATE-015 cross-functional flow and the duplicate IPN case) | ui/part-creation.md | UI-CREATE | part/create/, concepts/parameters/, part/views/ | Done |

Part attributes is ordered before Part categories because Part CRUD automation (edit, deactivate, delete) depends on it.

## Automation Runs

| # | Command | Spec file | Cases | Status |
|---|---|---|---|---|
| A | `/ui-automation Setup: auth, fixtures, page objects, redaction` | tests/auth.setup.ts, tests/fixtures.ts, tests/smoke.spec.ts | Framework only; smoke checks SMOKE-001, SMOKE-002 | Done (3 passed) |
| B | `/ui-automation Part creation P1` | tests/part.create.spec.ts | UI-CREATE-001, 003, 005; fixme: 009 (setting), 013 (non-superuser), UI-IMPORT-007 (OQ-CREATE-05), UI-IMPORT-008 (OQ-CREATE-06); deferred: UI-IMPORT-002, 004 (file upload) | Done (3 passed, 4 fixme) |
| C | `/ui-automation Part attributes P1` | tests/part.attributes.spec.ts | UI-ATTR edit, deactivate; delete fixme until OQ-PART-02 | To do |
| D | `/ui-automation Part detail view tabs P1` | tests/part.tabs.spec.ts | UI-TAB-005, 006, 011, 015, 019; fixme: 013, 018 (part locking setting) | To do |
| E | `/ui-automation Cross-functional flow` | tests/part.flow.spec.ts | UI-CREATE-015: create part, add parameter, create stock, verify in category view | To do |
| F | `/ui-automation <area> P1` | tests/part.<area>.spec.ts | P1 cases of UI-CAT, UI-UNIT, UI-REV as they are drafted | To do |
| G | `/review-and-correct` | - | All | After each run, or once at the end |

## Framework Layout (Run A)

| Layer | Path | Content |
|---|---|---|
| Auth setup | tests/auth.setup.ts | Logs in once with `INVENTREE_USERNAME` / `INVENTREE_PASSWORD` from `.env`; saves `playwright/.auth/user.json` (git-ignored) |
| Fixtures | tests/fixtures.ts | Page objects, API services for setup and cleanup, `cleanup` annotations |
| Pages | src/pages/ | parts-list, part-create form, part-detail, category |
| Components | src/components/ | modal form, table, tabs |
| Services | src/services/ | part, category, stock location, stock item, parameter template (token auth) |
| Data, models, assertions | src/data/, src/models/, src/assertions/ | Unique-name factories, types, reusable checks |
| Redaction | src/global-teardown.ts | Removes session cookie, CSRF token, auth headers, and password from traces before the HTML report copies them |

Config: a `setup` project that the `ui` project depends on; `trace: 'retain-on-failure'` and screenshots only on failure, enabled after redaction exists.

## What Each Automation Run Does

1. Reads the area file and selects its P1 cases; blocked cases become `test.fixme('<ID>: ... (blocked by ...)')`.
2. Inspects the running app (integrated browser or `npm run snapshot`) to choose accessible locators; test IDs or CSS only with a one-line reason.
3. Adds page objects, components, services, and factories; specs use only fixtures and `test.step`, with web-first assertions and no fixed sleeps.
4. Runs `npm run typecheck` and the new spec, classifies failures, and asks the user before treating observed behavior as expected.
5. Scans traces for secrets, then updates `automation/ui/README.md` and the root `README.md` with corrections and results by case ID.

## Decisions Needed Before Run A

| Decision | Options |
|---|---|
| Where edit and deactivate cases live | New UI-ATTR area (manual run 3), or append to Part creation |
| Cross-functional flow case | Add UI-CREATE-015 (manual run 1b) |
| Server settings (*Create Initial Stock*, `PART_ENABLE_LOCKING`) | Tests toggle and restore them, or keep UI-CREATE-009, UI-TAB-013, UI-TAB-018 as `fixme` |

## Known Constraints

- `automation/.gitignore` includes `/ui/playwright/.auth/` (added in Run A).
- The configured user is a superuser; UI-CREATE-013 and UI-IMPORT-008 need a restricted test user or stay `fixme`.
- Test-owned data only, created and removed through API services.
