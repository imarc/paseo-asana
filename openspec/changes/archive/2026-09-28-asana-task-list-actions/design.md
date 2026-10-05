## Context

`asana-tasks-plugin` shipped a sidebar surface listing open tasks (`name`, `dueOn`, first `projectName`), a token stored in a daemon-owned file, and a `workspace` settings document. RPCs: `connection.status`, `connection.set-token`, `tasks.list`. Paseo 0.9.2 plugin APIs relevant here:

- `defineAttachmentSource` + a search RPC → Paseo renders the composer attachment menu, picker, pill, and sends the returned `text` to the agent.
- Client SDK via `usePaseo()`: `projects.list()` (`projectId`, `projectDisplayName`, `projectRootPath`, `projectKind`), `providers.snapshot()` (entries with `provider`, `enabled`, `models[]` with `isDefault`), `workspaces.create({ source })` where `source` is `{ kind: "directory", path, projectId }` or `{ kind: "worktree", cwd, projectId, action: "branch-off", branchName }`, then `workspace.agents.create({ config: { provider: "provider/model" }, prompt })`.
- Surface `navigation.openAgent({ agentId })` (optional on older clients).
- `Modal` from `@getpaseo/plugin/client/react-native`; settings row components from `@getpaseo/plugin/client/ui`.

## Goals / Non-Goals

**Goals:**
- Show all project › section memberships and due date as columns.
- Attach a task to any agent prompt from the composer.
- One-click "Start chat" with project, checkout/worktree, and provider choice.

**Non-Goals:**
- Writing back to Asana, per-column sort/filter, custom composer trigger characters, choosing a worktree base branch.

## Decisions

**1. Task schema: `memberships` + `notes` replace `projectName`.**
`Task = { gid, name, dueOn?, url, notes?, memberships: { project: string, section?: string }[] }`. Asana `opt_fields` add `memberships.project.name,memberships.section.name,notes`. Membership order follows Asana's. Shared helper `formatMembership(m)` → `"Project › Section"` or `"Project"`. Dropping `projectName` is internal (client and server ship together).
Alternative: keep `projects.name` and fetch sections separately — more requests for no benefit.

**2. Snapshot text built by one shared function.**
`shared/snapshot.ts` `taskSnapshot(task)` returns:
```
Asana task: <name>
URL: <url>
Projects:
- <Project › Section>
Due: <dueOn>            (omitted when unset)

Notes:
<notes>                 (omitted when empty)
```
Used by the server for attachment `text` and by the client for the Start chat prompt, so both paths send identical context. Shared module is plain TS — allowed in both runtimes.

**3. Attachment source search on the server with a 60 s cache.**
New RPC `tasks.search({ query })` → `{ items: [{ id, identifier, title, subtitle, url, text, resourceType: "asana_task" }] }`. The picker searches per keystroke; re-fetching every page from Asana each time is slow and burns rate limit, so `server/asana.ts` memoizes `fetchMyTasks` per workspace for 60 s. `tasks.list` (surface, Refresh) bypasses and refreshes the cache. Filter: case-insensitive substring over name + formatted memberships; empty query returns the first 50. `identifier` = first membership project or `"Asana"`; `subtitle` = first membership + due. No token → `{ items: [] }`.
Alternative: client-side filtering over the surface's query cache — the attachment picker calls a server RPC by contract, so the server must answer.

**4. Start chat runs in the client via the Paseo SDK.**
Workspace/agent creation are normal Paseo operations, so per plugin guidance they use `usePaseo()` in the app, not a plugin RPC. Flow in `client/start-chat-modal.tsx`:
1. Load `projects.list()` and `providers.snapshot()` with TanStack Query.
2. Provider options: enabled entries with a model list; value `"<provider>/<default model id>"` (model with `isDefault`, else first); label from entry `label` or `provider`.
3. Mode: `SettingsSwitch` "New git worktree", disabled unless `projectKind === "git"`. Branch `SettingsInput` pre-filled with `asana/` + slug (lowercase, non-alphanumeric runs → `-`, trim `-`, cap 50 chars).
4. Start → `workspaces.create({ title: task.name, source })` → `workspace.agents.create({ config: { provider }, prompt: taskSnapshot(task) })` → save defaults → close → `navigation?.openAgent({ agentId })`.
Errors keep the modal open and render in a `SettingsRow` error.

**5. Remembered defaults: new `chat` settings document.**
`defineSettings({ id: "chat", scope: "host", version: 1, schema: { projectId: "", provider: "", worktree: false } })`, registered on the server. Separate from `workspace` so neither needs a migration. Stale IDs (project removed, provider disabled) fall back to the first available option.

**6. Columns.**
Wide: header row + row `flexDirection: "row"` with Task `flex: 3`, Project › Section `flex: 3`, Due fixed ~96 px, then a "Start chat" icon/text button. Pressing the task cell opens Asana; the Start chat button is its own `Pressable` so presses don't bubble. Compact: no header; name, then membership lines, then due, with Start chat as a trailing button. Multiple memberships render as separate `Text` lines.

**7. Surface → modal wiring.**
`TasksSurface` holds `selectedTask` state and renders `<StartChatModal task={selectedTask} navigation={navigation} onClose=…/>`. Modal children keep plugin runtime context, so `usePaseo`/`useRpc`/`useSettings` work inside.

## Risks / Trade-offs

- [Composer trigger may not be `@`] → Paseo owns the attachment menu and its trigger; spec says "attachment menu". Document in summary.
- [60 s cache shows slightly stale results in picker] → surface Refresh repopulates it; acceptable for search.
- [Branch name collision] → `workspaces.create` error is shown in the modal; user edits the branch and retries.
- [Provider default model may not be what the user wants] → modal offers one option per provider only; model/mode picking stays out of scope. User can switch model in the agent afterward.
- [`navigation` undefined on older clients] → agent is still created; modal closes and a message says where to find it.
- [Notes can be long] → snapshot truncates notes at 4 000 chars to keep attachments and prompts reasonable.

## Migration Plan

Archive + sync `asana-tasks-plugin` first. Implement, `npm run typecheck`, `paseo plugin reload paseo-asana`. No data migration: new settings document defaults; old `workspace` doc untouched. Rollback: revert source and reload.

## Open Questions

- None blocking.
