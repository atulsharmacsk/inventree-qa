---
description: "Phase 2: generate InvenTree Parts and Part Categories API manual test cases for one feature area from the API schema."
agent: InvenTree Quality Engineer
argument-hint: "Feature area, e.g. 'Parts CRUD'. One area per run."
tools: [read, search, edit, web]
---

## Role
Act as a senior QA engineer specializing in REST API testing and risk-based test design.

## Context
The application is InvenTree. The scope is the Parts and Part Categories APIs. Create manual test cases only; do not write automation code.

## Instruction
Identify the feature area from the arguments and find its row in the Areas table of [api-manual-tests.md](../../test-cases/api-manual-tests.md). If no area is given, or it does not match a row, follow the manual test case instructions.

Before writing cases, confirm you can access the schema category pages for the area (see API Sources in [copilot-instructions.md](../copilot-instructions.md)) and list the endpoints and methods relevant to the area. If a source is inaccessible, stop and report that rather than guessing.

Generate test cases that meet the area's minimum coverage from the index.

## Constraints
Use only behavior supported by the schema or supplied documentation. Do not invent endpoints, validation rules, or status codes. Take field constraints (max length, nullable, read-only) from the schema. Mark ambiguities as open questions. Do not include credentials or tokens. Do not modify automation code.

## Data
- API contract: the schema overview and category pages listed under API Sources in [copilot-instructions.md](../copilot-instructions.md)
- Functional behavior: the matching page in the Documentation Map in [copilot-instructions.md](../copilot-instructions.md)

## Output
Write the area's file under `test-cases/api/` and update the index [api-manual-tests.md](../../test-cases/api-manual-tests.md), following the layout, area file structure, and case format in the manual test case instructions. List the area's endpoints at the top of the file and mark automation candidates. Do not change other area files.

<!-- Customization set v1.3 (2026-10-30). History: ../CHANGELOG.md -->
