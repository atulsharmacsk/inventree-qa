# InvenTree UI Tests

## Requirements

- Node.js 20 or newer
- An accessible InvenTree instance
- Playwright Chromium browser

## Setup and Run

From this directory:

```powershell
npm ci
npx playwright install chromium
Copy-Item .env.example .env   # fill SUPERUSER_USERNAME and SUPERUSER_PASSWORD yourself
npm run typecheck
npm run test:ui
npm run report
```

Set `ENV=LOCALHOST` (default, `http://localhost`) or `ENV=REMOTE` (`https://demo.inventree.org`); the URLs are mapped in `automation/shared/environments.ts`. Test results are written to `test-results/` and the HTML report to `playwright-report/`.

## Authentication

The `setup` project (`tests/auth.setup.ts`) logs in once through the login page and saves the session to `playwright/.auth/user.json`. The `ui` project depends on it and reuses that storage state, so specs never log in. The file holds the session cookie and is git-ignored (`automation/.gitignore`: `/ui/playwright/.auth/`). API setup and cleanup use a separate per-worker token that is revoked when the worker finishes.

## Structure

| Path | Purpose |
|---|---|
| `tests/auth.setup.ts` | One-time login; saves storage state |
| `tests/fixtures.ts` | Page objects, components, API services (`parts`, `categories`, `stockItems`, `settings`), automatic cleanup reported as `cleanup` annotations |
| `tests/*.spec.ts` | Specs: fixtures, `test.step`, and assertions only (`smoke.spec.ts`, `part.create.spec.ts`, `part.attributes.spec.ts`, `part.tabs.spec.ts`, `part.flow.spec.ts`) |
| `src/pages/` | `LoginPage`, `PartsListPage` (category Parts panel, Add Parts menu), `PartDetailPage` (title, Part Details values, tabs, Part Actions menu: Edit and Delete, Stock tab Add Stock Item) |
| `src/components/` | `NavigationComponent` (header tabs), `ModalFormComponent` (base for API form dialogs: fields by API name, form error, submit with response), `PartFormComponent` (Add/Edit Part, Active switch), `StockItemFormComponent` (Add Stock Item), `DeleteDialogComponent` (delete confirmation) |
| `../shared/` | Code shared with the API project: token handling, `PartService`, `CategoryService`, `StockItemService`, `SettingsService` (read-only setting checks), models, `uniqueName`, cleanup annotations, and the redaction patterns |
| `src/models/`, `src/data/` | UI-only types (`PartFormInput`), routes, storage-state path, unique-name factories |
| `src/global-teardown.ts` | Rewrites every `trace.zip` with the shared `hideSecrets` patterns (session and CSRF cookies, auth and CSRF headers, tokens, the password) before the HTML report copies it |

## Selectors

Role-based locators are used throughout. InvenTree exposes many controls only through generated aria-labels (for example `login-username`, `text-field-name`, `number-field-quantity`, `boolean-field-active`, `action-menu-part-actions-edit`, `action-button-add-stock-item`, `panel-tabs-part`); these are used where no visible label is associated, and each page object notes why. The Mantine switch input is visually hidden behind its track, so `PartFormComponent.setActive` sets it with `force`.

## Known Behaviors

- Tests run with one worker. With two or more, the local Docker instance stops answering some requests (for example `/api/user/me/`) and the front-end falls back to the login page.
- A "First Use Tour available" toast can cover the form's Submit button. Forms are submitted by keyboard so the tests do not start or dismiss the tour for the shared user.
- The part Delete action is disabled while a part is active; cleanup deactivates (and unlocks) parts before deleting them, newest first so variants go before their template.
- Tests never change global settings. UI-ATTR-017 reads `PART_ENABLE_LOCKING` and skips itself when it is off.

## Results (2026-10-30, local 1.6.3, `ENV=LOCALHOST`)

| Case | Result |
|---|---|
| setup | Passed |
| SMOKE-001, SMOKE-002 | Passed |
| UI-CREATE-001, UI-CREATE-003, UI-CREATE-005, UI-CREATE-013 | Passed |
| UI-ATTR-008, UI-ATTR-012, UI-ATTR-016, UI-ATTR-017 | Passed |
| UI-TAB-005, UI-TAB-006, UI-TAB-009, UI-TAB-011, UI-TAB-015, UI-TAB-019 (`part.tabs.spec.ts`) | Passed (per the Run D plan entry; not re-run in this update) |
| UI-TAB-013, UI-TAB-018 | Skipped (`fixme`, blocked by OQ-TAB-07) |
| UI-CREATE-009, UI-IMPORT-007, UI-IMPORT-008, UI-ATTR-013 | Skipped (`fixme`, blocked) |

Full suite: 12 passed, 4 skipped, 0 failed; no `cleanup` annotations.

Run E (`tests/part.flow.spec.ts`, 2026-10-30): UI-CREATE-015 passed in about 56 s, so the spec sets a 120 s timeout (the default 30 s ended the first run mid-flow while a page was still loading). Setup and the spec: 3 passed, 0 failed.

## Results (2026-10-29, local 1.6.3)

| Case | Result |
|---|---|
| setup | Passed |
| SMOKE-001, SMOKE-002 | Passed |
| UI-CREATE-001, UI-CREATE-003, UI-CREATE-005 | Passed |
| UI-CREATE-009, UI-CREATE-013, UI-IMPORT-007, UI-IMPORT-008 | Skipped (`fixme`, blocked) |

## Traces and Screenshots

Traces are kept for failed tests (`retain-on-failure`) and screenshots only on failure. Global teardown redacts traces first. After adding a new auth mechanism or secret, extend `hideSecrets` and rescan the trace archives.

## Inspecting Pages

`npm run snapshot -- <path> ["Click target" ...]` logs in with `.env` credentials (falling back to `../api/.env`) and prints the page's accessibility tree with the username redacted. Click targets match an accessible button name or visible text, for example:

```powershell
npm run snapshot -- /web/part/category/index/parts action-menu-add-parts
```