## 0. Prerequisite

- [x] 0.1 Archive `asana-tasks-plugin` with spec sync so `openspec/specs/asana-task-list/spec.md` exists

## 1. Shared

- [x] 1.1 `shared/contracts.ts`: replace `projectName` with `memberships: { project, section? }[]`, add `notes?` to `Task`
- [x] 1.2 `shared/snapshot.ts`: `formatMembership`, `taskSnapshot(task)` (notes truncated at 4 000 chars), `branchSlug(name)` (`asana/` + slug, cap 50)
- [x] 1.3 `tasks.search` RPC contract and `asanaTasks` attachment source (`id: "asana-task"`, title "Asana task", icon `ListTodo`)
- [x] 1.4 `chat` settings document (`projectId`, `provider`, `worktree`, defaults empty/false)

## 2. Server

- [x] 2.1 `server/asana.ts`: add `memberships.project.name,memberships.section.name,notes` to `opt_fields`; map to new `Task` shape
- [x] 2.2 60 s per-workspace memo of task fetch; `tasks.list` always refreshes it
- [x] 2.3 `tasks.search` handler: no token → `[]`; case-insensitive filter over name + memberships; empty query → first 50; items use `taskSnapshot` for `text`
- [x] 2.4 Register `chat` settings and `tasks.search` handler in `index.server.ts`

## 3. Client — list columns

- [x] 3.1 Wide layout: header row (Task / Project › Section / Due) and aligned row columns; one line per membership
- [x] 3.2 Compact layout: stacked name, memberships, due; no header
- [x] 3.3 Per-row "Start chat" `Pressable` separate from the open-in-Asana press target

## 4. Client — start chat modal

- [x] 4.1 `client/start-chat-modal.tsx` using host `Modal`; show task name; load `projects.list()` and `providers.snapshot()` via TanStack Query
- [x] 4.2 Project `SettingsSelect`; empty-projects message with Start disabled
- [x] 4.3 Provider `SettingsSelect` from enabled entries → `provider/defaultModel`
- [x] 4.4 "New git worktree" `SettingsSwitch` (git projects only) + branch `SettingsInput` pre-filled via `branchSlug`; Start disabled when empty
- [x] 4.5 Start: `workspaces.create` (directory or worktree branch-off) → `agents.create` with `taskSnapshot` prompt → save `chat` defaults → close → `navigation.openAgent`; error keeps modal open
- [x] 4.6 Defaults from `chat` settings with fallback when stale
- [x] 4.7 Wire modal into `TasksSurface` (`selectedTask` state, pass `navigation`)

## 5. Client — attachment source

- [x] 5.1 `client.addAttachmentSource(asanaTasks)` in `index.client.tsx`

## 6. Verify

- [x] 6.1 `npm run typecheck`; mobile audit `rg` over `client/` has no hits
- [x] 6.2 `paseo plugin reload paseo-asana`; `paseo plugin ls` shows `running`
- [x] 6.3 Unit-check `branchSlug("Fix .env.example, ops config and sever DB")` → `asana/fix-env-example-ops-config-and-sever-db` and `taskSnapshot` output via `node --experimental-strip-types`
- [ ] 6.4 List shows every `Project › Section` line and Due column (wide) and stacked (compact); multi-project task shows multiple lines
- [ ] 6.5 Composer attachment menu lists "Asana task"; search filters; attached snapshot reaches agent with URL
- [ ] 6.6 Start chat: current checkout creates workspace + agent with snapshot prompt and navigates; new worktree creates branch `asana/...`; non-git project disables worktree; error path shows message
- [ ] 6.7 Reopen modal on another task pre-selects last project/provider/mode
