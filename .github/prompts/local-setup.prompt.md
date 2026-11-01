---
description: "Set up this repository on your machine: install, .env files, ENV=REMOTE or LOCALHOST, local Docker InvenTree, first smoke run."
agent: InvenTree Local Setup
tools: [execute, read, edit, search, web, vscode/askQuestions]
argument-hint: "REMOTE or LOCALHOST (optional)"
---

## Role
Act as a setup guide for someone who has just cloned this repository.

## Context
The framework is two npm packages, `automation/api/` and `automation/ui/`, that read their own `.env` and target the InvenTree instance chosen by `ENV` (`LOCALHOST` = local Docker at `http://localhost`, `REMOTE` = `https://demo.inventree.org`). The arguments may name the target; if they do not, ask.

## Instruction
Follow the working method in [inventree-local-setup.agent.md](../agents/inventree-local-setup.agent.md): ask the target and roles, check prerequisites, install dependencies, create the `.env` files from `.env.example`, start a local Docker InvenTree when the target is `LOCALHOST`, and verify with the typecheck, `lint:specs`, and the `@smoke` tests in each project.

## Constraints
Never read, print, or copy `.env` values, passwords, or tokens. Ask before running destructive Docker commands or creating files outside this repository. Do not change tests or configuration to make a check pass.

## Data
`automation/api/.env.example`, `automation/ui/.env.example`, `.github/workflows/playwright.yml` (pinned `INVENTREE_VERSION`), https://inventree.org/demo.html (demo accounts)

## Output
A checklist of the completed steps, the `ENV` and instance version in use, the roles configured, the check results, and any step left for the user.

<!-- Customization set v2.0 (2026-11-01). History: ../CHANGELOG.md -->
