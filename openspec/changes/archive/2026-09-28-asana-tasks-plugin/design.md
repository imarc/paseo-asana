## Context

Repo is empty apart from OpenSpec scaffolding. Local Paseo CLI is 0.9.2. Paseo plugins have two runtimes: an app-side client entry (React Native primitives, host-provided modules only: `@getpaseo/plugin/*`, `react`, `react-native`, `@tanstack/react-query`, `zod`) and a daemon subprocess server entry (Node access). Shared Zod contracts in `shared/` connect them through `defineRpc` / `server.handle` / `useRpc`.

Asana REST API (`https://app.asana.com/api/1.0`) accepts a Personal Access Token as `Authorization: Bearer <PAT>`. Listing assigned tasks requires `assignee=me` plus a `workspace` gid; `completed_since=now` restricts to incomplete tasks. Responses paginate via `limit` (max 100) and `next_page.offset`.

## Goals / Non-Goals

**Goals:**
- Read-only list of my incomplete Asana tasks in a Paseo sidebar surface, desktop and mobile.
- Token entry and workspace selection inside Paseo settings.
- Token never leaves the daemon process.

**Non-Goals:**
- Task mutation (complete, edit, create), comments, subtasks, task detail view.
- OAuth app flow, multiple Asana accounts.
- Workspace panel, Command Center items, attachment source (possible follow-ups).

## Decisions

**1. Project layout — scaffold with `paseo plugin init` in the repo root.**
Plugin ID `paseo-asana`, `requirements.paseo: ">=0.9.2"`. Files:
```
paseo-plugin.json  package.json  tsconfig.json
index.client.tsx   index.server.ts
shared/contracts.ts     # RPC contracts + settings definition + Task schema
server/token.ts         # read/write token file
server/asana.ts         # fetch wrapper, pagination, error mapping
client/tasks-surface.tsx
client/settings-screen.tsx
```
Scaffold's greeting example files are removed.

**2. Token storage — daemon-owned file, not `defineSettings`.**
Plugin settings documents are returned to every client by `useSettings`, so a token stored there would reach the app. Instead `connection.set-token` RPC writes `~/.config/paseo-asana/token` (dir `0700`, file `0600`); the server reads it per request. Clients only ever learn `hasToken: boolean`.
Alternatives: `defineSettings` (simpler, but leaks token to clients; docs state it is not a credential vault); env var on daemon (hard to set for a GUI-launched daemon, no in-app UX).

**3. Workspace selection — `defineSettings` document.**
`{ workspaceGid: string | "" }`, `scope: "host"`, version 1, default `""`. Non-secret, benefits from live sync across clients. Server reads it via `server.registerSettings(...).read()`. Empty means "first workspace from `GET /users/me`".

**4. RPC contracts (all in `shared/contracts.ts`).**
- `connection.status` → `{ hasToken, user?: { name }, workspaces?: {gid,name}[], error? }` — calls `GET /users/me?opt_fields=name,workspaces.name` when a token exists. Used by Verify and to populate workspace select.
- `connection.setToken({ token })` → `{ hasToken }` — empty string deletes the file.
- `tasks.list` → `{ status: "ok", tasks: Task[] } | { status: "no-token" }` — `Task = { gid, name, dueOn?: string, projectName?: string, url }`.
Asana failures throw an `Error` with a readable message (401 → "Asana rejected the token"); `useRpc`/TanStack Query surface it as the query error. Explicit `no-token` status lets the surface show the not-configured state without string-matching errors.

**5. Task fetch.**
`GET /tasks?assignee=me&workspace=<gid>&completed_since=now&limit=100&opt_fields=name,due_on,permalink_url,projects.name`, loop on `next_page.offset`. Sort server-side: `due_on` ascending, nulls last, then name. Uses global `fetch` (Node ≥18); no Asana SDK dependency.

**6. UI.**
- Surface via `addSurface("tasks", …)` + `addSidebarItem({ id: "tasks", title: "Asana", icon: "ListTodo", surface: "tasks" })`.
- `useQuery({ queryKey: ["tasks"], queryFn: () => listTasks({}) })`; header row with Refresh (`refetch`). `ScrollView` of `Pressable` rows → `openExternalUrl(task.url)`.
- States: loading (`ActivityIndicator`), not configured (message + button → `client.openSettings("connection")`), error (message + Retry), empty ("No open tasks").
- Settings screen `addSettingsScreen({ id: "connection", title: "Asana", icon: "KeyRound", … })` using `SettingsSection/Card/Input(secureTextEntry)/Action/Select` from `@getpaseo/plugin/client/ui`. Saving token invalidates `["tasks"]` and `["connection"]` queries.
- All text colored from `theme.colors.foreground` / `foregroundMuted`; padding from `layout.compact`. Surface component needs `openSettings`; pass it from the entry via closure over `client`.

## Risks / Trade-offs

- [Token in plain file on disk] → `0600` perms, never logged, never returned. Same exposure as most CLI tools' credential files.
- [Remote daemon] → token file lives on the daemon machine, which is intended; the settings screen targets whichever host is selected.
- [Large task counts slow first load] → pagination at 100/page; acceptable for a personal list. No caching beyond TanStack Query's in-memory cache.
- [Asana rate limits (429)] → surface error with Retry; no automatic backoff.
- [Plugin API changes between Paseo versions] → pin `requirements.paseo` to `>=0.9.2`; verify with `npm run typecheck`.

## Migration Plan

New plugin; no migration. Deploy: `npm install`, `npm run typecheck`, confirm daemon `pluginsEnabled` (ask user before enabling), `paseo plugin install /absolute/path/to/paseo-asana`, `paseo plugin ls` shows `running`. Rollback: `paseo plugin remove paseo-asana` and delete `~/.config/paseo-asana/`.

## Open Questions

- None blocking. Follow-ups if wanted: filter by due-this-week, Asana attachment source for prompts, mark complete.
