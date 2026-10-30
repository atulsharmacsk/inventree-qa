# Agent Customization Changelog

Version history of the agent, prompts, and instruction files in `.github/`. The files change together, so they share one version; each file ends with a comment that names the version it was last checked against. Application-behavior findings and corrections to generated artifacts are recorded separately in the root [README.md](../README.md).

Versioning: a minor version for a new or changed rule, prompt step, or phase; a major version when the phase order or the set of files changes. Entries before 1.3 were reconstructed from the README correction log, so they list the rules that changed rather than every wording edit.

## 1.3 (2026-10-30)

- Layering rule is now enforced, not only documented: `npm run lint:specs` (`automation/shared/check-spec-layering.mjs`) fails on direct `page.*` or HTTP-client use in specs, raw request fixtures, `waitForTimeout`, and `.only`. The Playwright instructions, agent working method, shared rules, `/api-automation`, `/ui-automation`, and `/review-and-correct` now run it with the typecheck. CI runs it before the tests.
- Nightly full regression added to the CI workflow, with an optional `shard` input (see the root README).
- Version note added to every file in this set.

## 1.2 (2026-10-30)

- Instructions refreshed to the real framework: the layer table and prompt context now describe `automation/shared/`, `src/global-teardown.ts`, and the actual file layout. They no longer mention files that were removed (a `ResourceService` base class, a trace-redaction reporter, `health.spec.ts`, `app.spec.ts`).
- Automation prompts read the plan files (`api-automation-tests.md`, `ui-automation-tests.md`) and the README open findings before writing tests.
- Manual-case rules: check README findings and other areas' open questions before writing expected results; open-question IDs are unique across files. Added after API-CAT-014 was drafted without checking a recorded finding.
- Automation rules: no scratch `*.tmp.ts` files; retries and workers come only from the `RETRIES` and `WORKERS` build parameters, and a test that passes only on retry is a defect.

## 1.1 (2026-10-29)

- Layered framework rules added to the Playwright instructions: specs, fixtures, services or page objects, models and factories. Specs describe behavior only, and every Arrange, Act, and Assert phase uses `test.step`.
- Code-quality, artifact-redaction (traces, reports, secrets), and verification rules added; both automation prompts and the agent working method updated to match. Added after specs were found making direct HTTP calls.

## 1.0 (2026-10-29)

- First version: one custom agent (`InvenTree Quality Engineer`), shared scope and rules (`copilot-instructions.md`), manual-case and Playwright instruction files, and five phase prompts run in order: `/ui-manual-tests`, `/api-manual-tests`, `/api-automation`, `/ui-automation`, `/review-and-correct`.
