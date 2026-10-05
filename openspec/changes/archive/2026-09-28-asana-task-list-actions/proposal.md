## Why

The first version of the plugin lists task names only. To triage from Paseo I need to see where each task lives (project and section) and when it is due, and I want to hand a task straight to an agent — either by referencing it in an existing chat or by starting a new chat, optionally in a fresh git worktree — without copying links by hand.

## What Changes

- Task list shows three columns on wide layouts: **Task**, **Project › Section**, **Due**. Every project membership is shown, one `Project › Section` line each (e.g. `Example Project › Internal Review`). Compact layouts stack the same data under the task name.
- New composer attachment source "Asana task": search my open tasks from the agent composer's attachment menu and attach one; the agent receives a text snapshot with name, URL, project › section memberships, due date, and notes.
- New per-row "Start chat" action opening a modal to pick a Paseo project, choose "Current checkout" or "New git worktree" (with branch name), pick an agent provider, and create a workspace + agent whose first prompt contains the task snapshot. Paseo then navigates to the new agent.
- Remembers the last chosen project, provider, and worktree choice.

Non-goals: editing Asana tasks, linking agents back to Asana (comments/status), per-column sorting or filtering, a literal `@` trigger (Paseo owns the composer menu and its trigger).

## Capabilities

### New Capabilities
- `asana-task-attachments`: Searching open Asana tasks from the Paseo composer and attaching a task snapshot to a prompt.
- `asana-task-chat`: Starting a new Paseo agent chat about a task, choosing project, checkout vs. new worktree, and provider.

### Modified Capabilities
- `asana-task-list`: Rows show all project › section memberships and due date in columns; rows gain a "Start chat" action.

## Impact

- Depends on change `asana-tasks-plugin` being archived and synced first, so `openspec/specs/asana-task-list/` exists.
- Code: `shared/contracts.ts` (Task schema gains `memberships[]`; new search and snapshot RPCs; new settings fields), `server/asana.ts` (extra `opt_fields`, short-lived task cache, task notes fetch), `index.server.ts`, `client/tasks-surface.tsx`, new `client/start-chat-modal.tsx`, `index.client.tsx`.
- Uses Paseo client SDK from the app: `projects.list`, `providers.snapshot`, `workspaces.create`, `workspace.agents.create`, and surface `navigation.openAgent`.
- Asana API: adds `memberships.project.name`, `memberships.section.name`, and `notes` fields.
- Worktree creation runs git on the daemon host through Paseo; only offered for projects whose kind is `git`.
