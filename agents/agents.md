# Agents

The custom agent definitions are in [.github/agents/](../.github/agents/), where GitHub Copilot loads them automatically. These files are the source of truth; this page only indexes them.

| Agent | File | Used by | Purpose |
|---|---|---|---|
| InvenTree Quality Engineer | [inventree-quality-engineer.agent.md](../.github/agents/inventree-quality-engineer.agent.md) | Every phase prompt in [prompts.md](prompts.md) | Senior quality engineer for the InvenTree Parts module: requirements analysis, UI and API manual test design, Playwright TypeScript API and UI automation, and test validation |

The agent file defines the role, context (scope, project layout, local instance), working method, constraints (no secrets, no invented behavior, no weakened assertions, test-owned data only), and output expectations. Its tools are `execute`, `read`, `edit`, `search`, `web`, `browser`, and the Playwright MCP server (`playwright/*`).

To use it, select **InvenTree Quality Engineer** in the Copilot Chat agent picker, then run a prompt such as `/api-automation Part Categories CRUD`. Shared and file-specific rules it follows are listed in [system-instructions.md](system-instructions.md).
