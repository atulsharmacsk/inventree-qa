# Prompts

The prompts used to drive the agent are GitHub Copilot prompt files in [.github/prompts/](../.github/prompts/). Each runs as a slash command in Copilot Chat with the [InvenTree Quality Engineer](../.github/agents/inventree-quality-engineer.agent.md) agent, one feature area or run per invocation.

| Phase | Command | Prompt file | Run order and status |
|---|---|---|---|
| 1. UI manual test cases | `/ui-manual-tests <area>` | [ui-manual-tests.prompt.md](../.github/prompts/ui-manual-tests.prompt.md) | [ui-manual-tests.md](../test-cases/ui-manual-tests.md) |
| 2. API manual test cases | `/api-manual-tests <area>` | [api-manual-tests.prompt.md](../.github/prompts/api-manual-tests.prompt.md) | [api-manual-tests.md](../test-cases/api-manual-tests.md) |
| 2. API automation | `/api-automation <area>` | [api-automation.prompt.md](../.github/prompts/api-automation.prompt.md) | [api-automation-tests.md](../test-cases/api-automation-tests.md) |
| 3. UI automation | `/ui-automation <run>` | [ui-automation.prompt.md](../.github/prompts/ui-automation.prompt.md) | [ui-automation-tests.md](../test-cases/ui-automation-tests.md) |
| Review | `/review-and-correct` | [review-and-correct.prompt.md](../.github/prompts/review-and-correct.prompt.md) | Corrections logged in [README.md](../README.md) |

Example invocations: `/ui-manual-tests Part categories`, `/api-manual-tests Part Categories CRUD`, `/api-automation Parts CRUD`, `/ui-automation Part creation P1`.

Each prompt is structured as Role, Context, Instruction, Constraints, Data, and Output.
