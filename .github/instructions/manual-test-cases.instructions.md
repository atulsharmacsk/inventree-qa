---
description: "Layout, format, and traceability rules for manual test case documents."
applyTo: "test-cases/**"
---

## Layout

- `test-cases/ui-manual-tests.md` and `test-cases/api-manual-tests.md` are index pages required by the submission. They hold only the **Areas** table, cross-area summaries, and shared assumptions. Never put test cases in them.
- The index's **Areas** table is the single source of truth for each area's name, file, ID prefix, minimum coverage, and status. Read it to map a request to an area; do not keep a separate list.
- Cases live in one file per area: `test-cases/<ui|api>/<area-name-in-kebab-case>.md`. Case IDs use `<UI|API>-<CODE>-NNN`, where `<CODE>` is a short uppercase code unique within the index.
- To add an area, ask the user first, then add a row to the index with its file, prefix, minimum coverage, and status `Not started`.

## Scope of an Area

- Each concern belongs to exactly one area. If a case fits another area better, reference that area instead of duplicating it.
- Keep each area to a focused, reviewable set of cases: cover each rule with positive, negative, and boundary cases, and use one data-driven case for a rule that applies to many inputs instead of one case per input.
- Meet the area's minimum coverage from the index; add more only where risk justifies it.

## Workflow

- Work on one area per run and do not modify other area files. If no area is given, propose the first `Not started` area in the index.
- When an area file already exists, revise or append cases. Never renumber existing IDs; give new cases the next free number.
- After writing an area file, update its row in the index (file link, status `Drafted`, P1/P2/P3/total counts, open-question count) and the **Total** row.
- UI: negative and boundary cases go in their feature area's file. If the index has a required-scenarios table, update it with the covering case IDs.
- API: list cases marked as automation candidates in the index's "Automation Candidates" section.

## Area File Structure

1. Title `# UI Manual Tests: <Area>` or `# API Manual Tests: <Area>`, a link back to the index, and the `docs:` abbreviation.
2. **Sources Ingested**: pages read and what each was used for.
3. **Requirements Traceability**: `REQ-<CODE>-NN`, statement, and source anchor. Requirement IDs are unique across all files.
4. **Cases**, grouped by sub-area.
5. **Coverage**: cases per sub-area and priority, and whether every requirement is covered.
6. **Open Questions**: IDs `OQ-<AREA>-NN` (for example `OQ-REV-01`), with the cases they affect and a status: `Open`, `Resolved` (with the answer and its source), or `Finding` (observed behavior the user judged incorrect). Like requirement IDs, open-question IDs are unique across all files; API areas use an `A` prefix when the UI area has the same code (for example `REQ-ACAT-01`, `OQ-ACAT-01`).

## Case Format

- Each case has: ID, title, priority (P1–P3), type (positive/negative/boundary), preconditions, steps (UI) or request (API: method, path, parameters, body), expected result (API: expected status and business result), requirement IDs, and source reference. API cases also state whether they are automation candidates, and cite two sources: the schema category page for the request and response, and the functional documentation page for the business rule.
- Expected results must come from the documentation or schema, or from local behavior the user has confirmed (see "Observed Behavior Needs User Confirmation" in `copilot-instructions.md`). Where neither applies, reference an open question instead of an expected result.
- Before writing expected results, read the root `README.md` (Agent Output Corrections and Open Review Findings) and the open questions in other area files. If a recorded local observation contradicts the documentation, reference or extend that open question instead of asserting either behavior, and do not mark the case as a ready automation candidate.
- State server settings that affect behavior (for example, duplicate IPN handling) as preconditions.
- Do not include credentials or tokens.

<!-- Customization set v1.3 (2026-10-30). History: ../CHANGELOG.md -->
