---
description: "Rules for Playwright TypeScript API and UI tests."
applyTo: "automation/**/*.ts"
---

## Layered framework

Specs describe behavior only. Every HTTP call or page interaction goes through a lower layer.

| Layer | API project (`automation/api/`) | UI project (`automation/ui/`) |
|---|---|---|
| Specs | `tests/<area>.<feature>.spec.ts` | `tests/<area>.<feature>.spec.ts` |
| Fixtures | `tests/fixtures.ts`: test-scoped `role` option, worker-scoped `apiTokens` (one token per role, revoked at worker end), `authenticatedRequest`, service instances, automatic cleanup | `tests/fixtures.ts`: `role` option selecting storage state, page objects, API services (superuser) for setup and cleanup |
| Actions | Shared resource services in `automation/shared/services/<resource>.service.ts`; API-only services in `src/services/` | `src/pages/<page>.page.ts` and `src/components/<widget>.component.ts` |
| Models | `automation/shared/models.ts`; project-only types next to their use | `src/models/` |
| Test data | `src/test-data.ts` and `automation/shared/data.ts`: factories that return unique, valid payloads with overrides | `src/data/factories.ts` |
| Assertions | `src/checks.ts` with JSON schemas in `schemas/` | Web-first `expect` in specs; reusable checks in `src/assertions/` when needed |
| Redaction | `src/global-teardown.ts` with patterns from `automation/shared/redaction.ts` | Same |

This table describes the current layout. Check the files before adding a layer, and update this table when the layout changes.

- Never call `request.get/post/...`, `page.goto`, `page.locator`, or `page.getBy*` in a spec. Add or extend a service, page object, or component instead. `npm run lint:specs` (rules in `automation/shared/check-spec-layering.mjs`) enforces this, and also rejects raw request fixtures, `waitForTimeout`, and `.only`; CI runs it before the tests.
- Services return the raw `APIResponse` for the action under test, so specs can assert status codes. `*OrFail` helpers are only for arrange steps; they throw with the status and body if the call fails.
- Page objects expose readonly locators and intent-level methods (for example `createPart(data)`). Keep `expect` out of page objects and services, except for readiness waits.
- Services track the records they create; fixtures delete them in teardown and report failed deletes as `cleanup` annotations. Order fixture dependencies so dependents are deleted first.
- Reuse existing layers before adding new ones. Add a layer file when a spec would otherwise need a direct operation, even if only one spec uses it.
- Code needed by both projects (API services for setup and cleanup, token handling, models, redaction patterns) lives in `automation/shared/`. It has no `node_modules`: import packages there with `import type` only, and keep runtime package code (for example `jszip`) in the project.

## Test design

- Wrap each Arrange, Act, and Assert phase in `test.step` with a business-readable name that includes the endpoint or user action (for example `PATCH /api/part/{id}/ with active=false`).
- Each test checks one behavior, has `<CASE-ID>: <behavior>` in its title, and sits in a `test.describe` for its area.
- Every top-level `test.describe` declares its user with `test.use({ role: 'SUPERUSER' })` or `'READER'`; credentials come from `<ROLE>_USERNAME` / `<ROLE>_PASSWORD`.
- Tag a small set of fast P1 tests with `{ tag: '@smoke' }`. CI (`.github/workflows/playwright.yml`) runs `@smoke` on pull requests and pushes to `main` that touch `automation/**`.
- Assert status codes, response schema (required properties and their types), and business effects (re-read the record after a write).
- Use data-driven loops over typed tables for flags, validation, boundaries, and filters. Generated titles must be unique.
- Use `test.fixme('<CASE-ID>: ... (blocked by OQ-...)')` for cases blocked by an open question. Use `test.fail` with an annotation for a user-confirmed application finding. Never weaken an assertion to make a test pass.
- API tests: reuse `authenticatedRequest`. It is wrapped by `shared/http-logging.ts`, which attaches every request and response (method, URL, params, body, status) to the step that made it, with secrets hidden and auth headers omitted. The UI project's `apiRequest` (setup and cleanup) uses the same wrapper. For unauthenticated cases, add a fixture with a credential-free context instead of changing the existing one.
- UI tests: use accessible locators (`getByRole`, `getByLabel`, `getByText`), then test IDs. Use CSS only with a comment explaining why. Use web-first assertions and condition-based waits; never use fixed sleeps.
- Create uniquely named, test-owned data through factories, and clean up only that data. Tests must run independently and in parallel, with no state shared between them.
- Only tests in `tests/*.settings.spec.ts` may change a global setting, and only through the `globalSetting` fixture, which restores the original value and fails the test if the restore fails. Those files run in the `settings` project, which runs after all other tests, and skip unless `ENV=LOCALHOST`, so the shared demo is never changed. Every other test reads settings as preconditions only.
- Do not invent endpoints or expected status codes; verify them against the schema or the running instance.

## Code quality

- Strict TypeScript: no `any`, no non-null assertions on API data, typed models for payloads and responses.
- No magic values in specs: put endpoints in services, field lists in models, and defaults in factories.
- Naming: `*.service.ts`, `*.page.ts`, `*.component.ts`, `*.assertions.ts`, `*.spec.ts`; specs use camelCase variables named after the domain (`parts`, `category`).
- Keep functions small and single-purpose. Write a comment only to explain why, in one line.
- Never commit `test.only`. Workers and retries come only from the `WORKERS` and `RETRIES` build parameters (`automation/shared/run-options.ts`); keep the config defaults (workers 2, retries 2, set in `run-options.ts` and the configs by user decision on 2026-10-31) and never hard-code retries in a spec. Treat a test that passes only on retry (`flaky`) as a defect to investigate, not a pass. If the local instance is unreliable under parallel load, lower `workers` and record it as an environment issue.

## Artifacts and secrets

- Traces are enabled (`retain-on-failure`). Each project's `src/global-teardown.ts` rewrites every `trace.zip` in `test-results/` and `playwright-report/` to scrub tokens, basic-auth headers, session and CSRF cookies, token response bodies, and the configured password. If you add a new auth mechanism or secret, extend `automation/shared/redaction.ts` and re-verify by scanning the trace zips.
- UI: log in once in a setup project and reuse storage state; never log in inside specs. Keep redaction in place before enabling UI traces, screenshots, or video.
- Do not leave scratch files (for example `*.tmp.ts`) in the projects.
- Never print tokens, credentials, or full auth responses in logs, annotations, or error messages.

## Verification

- Run `npm run typecheck`, `npm run lint:specs`, and the narrowest relevant spec after each change, then report pass, fail, and skip counts by case ID.

<!-- Customization set v1.3 (2026-10-30). History: ../CHANGELOG.md -->
