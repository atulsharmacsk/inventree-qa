---
description: "Phase 2: implement Playwright API automation from the API manual test cases."
agent: InvenTree Quality Engineer
tools: [read, search, edit, execute, web]
---

## Role
Act as a senior SDET writing maintainable Playwright TypeScript API tests.

## Context
The API automation project is `automation/api/` (Playwright Test, TypeScript). It targets a local InvenTree Docker instance configured through `.env` (`ENV`, `SUPERUSER_USERNAME`, `SUPERUSER_PASSWORD`, optional `READER_USERNAME`, `READER_PASSWORD`). [fixtures.ts](../../automation/api/tests/fixtures.ts) provides a worker-scoped token, an `authenticatedRequest` fixture, and service fixtures (`parts`, `categories`, `system`) that clean up the records they create. Resource services and models shared with the UI project are in `automation/shared/`; API-only services, data factories (`src/test-data.ts`), schema checks (`src/checks.ts`, `schemas/`), and trace redaction (`src/global-teardown.ts`) are in `automation/api/`. [parts.crud.spec.ts](../../automation/api/tests/parts.crud.spec.ts) is the reference spec. The run order and per-run scope are in [api-automation-tests.md](../../test-cases/api-automation-tests.md).

## Instruction
1. Read the index [api-manual-tests.md](../../test-cases/api-manual-tests.md), then the area files under `test-cases/api/`. Select the cases marked as automation candidates, prioritizing P1.
2. Implement them as spec files grouped by feature (for example `parts.crud.spec.ts`, `categories.crud.spec.ts`, `parts.list.spec.ts`, `parts.validation.spec.ts`).
3. Cover positive, negative, and boundary scenarios. Assert on status codes, response schema (required properties and their types), and business logic (for example, a created part appears in its category's part list).
4. Use data-driven tests for validation, boundary lengths, and filter combinations.
5. Add or extend the service, model, data factory, and check modules (in `automation/shared/` when the UI project also needs them, otherwise in `automation/api/src/`) so specs contain only fixtures, `test.step` blocks, and assertions.
6. Before automating a case, check the root `README.md` Open Review Findings for known local behavior that contradicts its expected result; if one exists, use `test.fixme` with the open question instead of guessing.
7. Run `npm run typecheck` and `npm run test:api` in `automation/api/`. Fix failures caused by the tests; report failures caused by the application as findings. Update the run's status in [api-automation-tests.md](../../test-cases/api-automation-tests.md).

## Constraints
Follow the Playwright test instructions. Add a new dependency only if necessary, and explain why. Note any difference between the running instance and the documentation.

## Data
- API contract: the schema category page for each endpoint, listed under API Sources in [copilot-instructions.md](../copilot-instructions.md)
- Manual cases: index [api-manual-tests.md](../../test-cases/api-manual-tests.md) and area files in `test-cases/api/`

## Output
Spec files under `automation/api/tests/`, the service-layer modules under `automation/api/src/`, an updated `automation/api/README.md` if run instructions change, and a summary of executed results (passed, failed, skipped) mapped to case IDs.
