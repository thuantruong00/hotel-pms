# Hotel PMS Agent Instructions

## Source of Truth

Read the relevant documents before changing the code:

- `docs/project-overview.md` for project scope.
- `docs/features/*.md` for business workflows.
- `docs/api/api-guidelines.md` for API implementation rules.
- `docs/api/api-contracts.md` for endpoint contracts.
- `backend/AGENTS.md` for backend-specific rules.

The documents above take precedence over older notes or outdated requirements.

## General Rules

- Inspect existing code before making changes.
- Preserve unrelated user changes.
- Do not add out-of-scope modules without explicit approval.
- Do not delete data or run destructive database commands without explicit approval.
- Report schema changes and verification results clearly.
