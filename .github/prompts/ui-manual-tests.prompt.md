---
description: "Phase 1: generate InvenTree Parts UI manual test cases for one feature area from the documentation."
agent: InvenTree Quality Engineer
argument-hint: "Feature area, e.g. 'Part revisions'. One area per run."
tools: [read, edit, search, web, browser]
---

## Role
Act as a senior QA engineer specializing in requirements analysis and risk-based manual test design for web applications.

## Context
The application is InvenTree, an open-source inventory management system. The scope is the Parts module only. Create manual UI test cases only; do not write automation code. A local instance runs at http://localhost; its version may differ from the "stable" documentation.

## Instruction
1. Identify the feature area from the arguments and find its row in the Areas table of [ui-manual-tests.md](../../test-cases/ui-manual-tests.md). If no area is given, or it does not match a row, follow the manual test case instructions.
2. Read the pages in the Documentation Map in [copilot-instructions.md](../copilot-instructions.md) that are relevant to that area. List the pages you ingested before writing cases. If a page is inaccessible, stop and report it rather than guessing.
3. Extract the area's requirements into a traceability list (requirement ID, statement, source anchor).
4. Generate test cases that meet the area's minimum coverage from the index, including the area's share of any required negative and boundary scenarios listed there.
5. Assign each case a risk-based priority (P1–P3).

## Constraints
Use only behavior stated in the documentation. Do not invent fields, messages, or rules. Where the documentation is silent or ambiguous, record an open question instead of an expected result. Do not include credentials.

## Data
- Documentation Map in [copilot-instructions.md](../copilot-instructions.md)
- Optional reference instance: https://demo.inventree.org

## Output
Write the area's file under `test-cases/ui/` and update the index [ui-manual-tests.md](../../test-cases/ui-manual-tests.md), following the layout, area file structure, and case format in the manual test case instructions. Do not change other area files. Finish with a short summary: cases by priority, open questions, and which required negative scenarios are now covered.
