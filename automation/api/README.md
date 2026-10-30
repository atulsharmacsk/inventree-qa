# InvenTree API Tests

## Requirements

- Node.js 20 or newer
- An accessible InvenTree instance and an account allowed to request API tokens

## Setup

From this directory, install dependencies and create a local environment file:

```powershell
npm ci
Copy-Item .env.example .env
```

Set `ENV` (`LOCALHOST` by default, or `REMOTE`), `SUPERUSER_USERNAME`, and `SUPERUSER_PASSWORD` in `.env`; the base URL for each `ENV` is mapped in `automation/shared/environments.ts`. `READER_USERNAME` / `READER_PASSWORD` are optional; tests that use `test.use({ role: 'READER' })` are skipped without them. Keep credentials local; `.env` is ignored by Git.

## Run

```powershell
npm run test:api
npm run test:api -- --grep @smoke
npm run typecheck
npm run report
```

The API tests do not require browser binaries. They target the configured InvenTree instance and create an API token for each Playwright worker. Test results are written to `test-results/`; the HTML report is written to `playwright-report/`.

## Structure

| Path | Purpose |
|---|---|
| `tests/*.spec.ts` | Specs: fixtures, `test.step`, and assertions only |
| `tests/fixtures.ts` | Token auth, service fixtures (`parts`, `categories`, `stockLocations`, `stockItems`, `companies`, `supplierParts`, `manufacturerParts`, `system`), `partsWithAuthorization` (a part service with a chosen or no `Authorization` header) and `revokedToken` for authentication checks, and automatic cleanup of records created by the test; failed deletes are reported as `cleanup` annotations |
| `../shared/` | Code shared with the UI project: token handling (`auth.ts`), `PartService` and `CategoryService`, models, `uniqueName`, cleanup annotations, and the redaction patterns |
| `src/services/system.service.ts` | API-only service |
| `src/test-data.ts`, `src/checks.ts`, `schemas/` | Payload factories with unique names, and JSON-schema checks |
| `src/global-teardown.ts` | Rewrites every `trace.zip` with the shared `hideSecrets` patterns (tokens, basic-auth headers, token response bodies, the configured password) |

## Traces

Traces are kept for failed tests (`retain-on-failure`). Open them with `npm run report`. Global teardown rewrites each `trace.zip` in `test-results/` before the HTML reporter copies it into `playwright-report/`.