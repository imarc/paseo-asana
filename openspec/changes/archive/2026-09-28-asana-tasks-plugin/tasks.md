## 1. Scaffold

- [x] 1.1 Run `paseo plugin init` for the repo root (if it refuses a non-empty dir, init into a temp dir and move files in); set manifest `id: "paseo-asana"`, `requirements.paseo: ">=0.9.2"`, and a `description`
- [x] 1.2 `npm install`; remove the scaffold greeting example files and their registrations
- [x] 1.3 `npm run typecheck` passes on the empty entries

## 2. Shared contracts

- [x] 2.1 `shared/contracts.ts`: `Task` Zod schema (`gid`, `name`, `dueOn?`, `projectName?`, `url`)
- [x] 2.2 Define `connection.status`, `connection.set-token`, and `tasks.list` RPCs per design (no token in any output)
- [x] 2.3 Define `workspace` settings document (`scope: "host"`, version 1, `workspaceGid` default `""`)

## 3. Server

- [x] 3.1 `server/token.ts`: read/write/delete `~/.config/paseo-asana/token` (dir `0700`, file `0600`); empty token deletes file
- [x] 3.2 `server/asana.ts`: `asanaGet(path, token)` via global `fetch`, bearer auth, map 401 to "Asana rejected the token" and other failures to readable errors; never log the token
- [x] 3.3 `getMe(token)` → user name + workspaces (`/users/me?opt_fields=name,workspaces.name`)
- [x] 3.4 `listTasks(token, workspaceGid)`: `/tasks?assignee=me&completed_since=now&limit=100&opt_fields=name,due_on,permalink_url,projects.name`, follow `next_page.offset`, map to `Task`, sort by due date asc, undated last, then name
- [x] 3.5 `index.server.ts`: `registerSettings(workspace)`; handle the three RPCs; `tasks.list` returns `no-token` when no file, resolves empty `workspaceGid` to first workspace from `getMe`

## 4. Client — settings screen

- [x] 4.1 `client/settings-screen.tsx`: secure `SettingsInput` (starts empty) + Save action calling `connection.set-token`; Clear action; row showing whether a token is saved
- [x] 4.2 Verify action calling `connection.status`; show "Connected as <name>" or the error
- [x] 4.3 `SettingsSelect` of workspaces from `connection.status`, saving via `useSettings(workspace).save(values, revision)`; handle loading/invalid/error states
- [x] 4.4 Invalidate `["connection"]` and `["tasks"]` queries after token or workspace change
- [x] 4.5 Register with `client.addSettingsScreen({ id: "connection", title: "Asana", icon: "KeyRound", Component })`

## 5. Client — task list surface

- [x] 5.1 `client/tasks-surface.tsx`: `useQuery(["tasks"])` over `useRpc(tasks.list)`; header with title and Refresh (`refetch`)
- [x] 5.2 Render rows (name, due date, project) in a `ScrollView`; `Pressable` row calls `openExternalUrl(task.url)`
- [x] 5.3 Loading (`ActivityIndicator`), empty ("No open tasks"), not-configured (button → `openSettings("connection")`), error (message + Retry) states
- [x] 5.4 All text colored from `theme.colors`; root `surface0`; padding from `layout.compact`
- [x] 5.5 Register `addSurface("tasks", …)` and `addSidebarItem({ id: "tasks", title: "Asana", icon: "ListTodo", surface: "tasks" })` in `index.client.tsx`

## 6. Verify

- [x] 6.1 `npm run typecheck` passes; mobile audit `rg -n "document\.|window\.|localStorage|navigator\.|<[a-z]+[ >]|className=|onClick=" client/` has no hits
- [x] 6.2 Check daemon `pluginsEnabled`; if false, ask user permission before enabling (with trust warning)
- [x] 6.3 `paseo plugin install /absolute/path/to/paseo-asana`; `paseo plugin ls` shows `paseo-asana` `running`
- [x] 6.4 Save a real PAT, Verify shows user name, workspace list populates; `~/.config/paseo-asana/token` is `0600`
- [x] 6.5 Sidebar "Asana" lists open tasks sorted by due date; pressing a row opens Asana; Refresh works
- [x] 6.6 Error paths: bad token shows rejection error with Retry; cleared token shows not-configured state; `paseo plugin logs paseo-asana` contains no token
- [x] 6.7 Check dark and light themes and a compact/narrow window
