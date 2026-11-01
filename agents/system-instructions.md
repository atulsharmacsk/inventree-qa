# System Instructions

The agent configuration is in [.github/](../.github/), where GitHub Copilot loads it automatically. These files are the source of truth; this page only indexes them.

| File | Applies to | Purpose |
|---|---|---|
| [copilot-instructions.md](../.github/copilot-instructions.md) | Every request | Scope (Parts module), documentation and API schema map, how to inspect the local instance, confirming observed behavior with the user, and shared rules |
| [inventree-quality-engineer.agent.md](../.github/agents/inventree-quality-engineer.agent.md) | Custom agent used by all prompts | Role, working method, constraints (no secrets, no invented behavior, no weakened assertions), and output expectations |
| [inventree-local-setup.agent.md](../.github/agents/inventree-local-setup.agent.md) | Custom agent for first-time local setup | Prerequisites, install, `.env` and `ENV` setup, local Docker instance, first smoke run, and secret-handling constraints |
| [manual-test-cases.instructions.md](../.github/instructions/manual-test-cases.instructions.md) | `test-cases/**` | Index and area-file layout, case format, traceability, open questions |
| [playwright-tests.instructions.md](../.github/instructions/playwright-tests.instructions.md) | `automation/**/*.ts` | Layered framework, test design, code quality, trace redaction, verification |

Tool: GitHub Copilot in VS Code (agent mode), with the Playwright MCP server for inspecting the running application.
