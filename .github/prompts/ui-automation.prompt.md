---
description: "Phase 3: implement Playwright UI automation from the UI manual test cases."
agent: InvenTree Quality Engineer
tools: [execute, read, edit, search, web, browser]
---

## Role
Act as a senior SDET writing robust Playwright TypeScript UI tests.

## Context
The UI automation project is `automation/ui/` (Playwright Test, TypeScript, Chromium). It targets the InvenTree instance selected by `ENV` (`LOCALHOST` or `REMOTE`, mapped in `automation/shared/environments.ts`). The framework already exists: a `setup` project with storage state ([auth.setup.ts](../../automation/ui/tests/auth.setup.ts)), [fixtures.ts](../../automation/ui/tests/fixtures.ts), page objects in `src/pages/`, components in `src/components/`, factories in `src/data/`, API services from `automation/shared/`, and trace redaction in `src/global-teardown.ts`. [part.create.spec.ts](../../automation/ui/tests/part.create.spec.ts) is the reference spec. The run order and per-run scope are in [ui-automation-tests.md](../../test-cases/ui-automation-tests.md); the arguments name the run.

## Instruction
1. Find the run in [ui-automation-tests.md](../../test-cases/ui-automation-tests.md), read its area file under `test-cases/ui/`, and select the listed P1 cases. Check the root `README.md` Open Review Findings for known local behavior; blocked cases become `test.fixme` with the open question.
2. Reuse the existing auth setup, fixtures, page objects, and components; extend them rather than adding parallel ones.
3. Across all runs, the tests must cover:
   - Core Part CRUD: create, view, edit, and delete or deactivate a part
   - Key UI elements, navigation, and form behavior, including required-field validation
   - At least one cross-functional flow: create a part, add parameters, create stock, and verify the part in its category view
4. Build page objects under `src/pages/`, shared widgets under `src/components/`, and fixtures that provide them. Specs use only fixtures, page objects, factories, assertions, and `test.step`. API-based setup and cleanup go through service classes in `automation/shared/services/`. Keep the `src/global-teardown.ts` redaction in place before enabling traces, screenshots, or video.
5. Inspect the running application to choose selectors. Run `npm run typecheck` and `npm run test:ui` in `automation/ui/`, then fix test defects. Update the run's status in [ui-automation-tests.md](../../test-cases/ui-automation-tests.md).

## Constraints
Follow the Playwright test instructions. Use test IDs or CSS only when no accessible locator is stable, and note why. Keep the storage-state file out of version control.

## Data
- Manual cases: index [ui-manual-tests.md](../../test-cases/ui-manual-tests.md) and area files in `test-cases/ui/`
- Application: the URL for `ENV` (default `LOCALHOST`, http://localhost)

## Output
Spec files under `automation/ui/tests/`, the auth setup and config changes, an updated `automation/ui/README.md`, and a summary of executed results mapped to case IDs.
