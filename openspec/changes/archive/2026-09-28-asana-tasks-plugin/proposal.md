## Why

Checking Asana means leaving Paseo for a browser tab, which breaks flow while working with agents. A Paseo plugin that shows my open Asana tasks inside the app keeps that list one click away on desktop and mobile.

## What Changes

- New local Paseo plugin (`paseo-asana`) in this repo, targeting Paseo `>=0.9.2`.
- Sidebar item "Asana" opening a surface that lists my incomplete Asana tasks assigned to me (name, due date, project), with refresh, loading, empty, and error states.
- Tapping a task opens it in Asana via its permalink.
- Settings screen under **Settings → Plugins → paseo-asana** to enter an Asana Personal Access Token and choose the Asana workspace.
- Daemon-side RPCs that call the Asana REST API so the token never reaches client code.

Non-goals: creating, editing, or completing tasks; OAuth; task detail view; attaching tasks to prompts; filtering/sorting beyond due date.

## Capabilities

### New Capabilities
- `asana-connection`: Storing the Asana Personal Access Token and selected workspace, and validating them against Asana.
- `asana-task-list`: Fetching and displaying my incomplete assigned tasks in a Paseo sidebar surface, and opening a task in Asana.

### Modified Capabilities
<!-- None: no existing specs. -->

## Impact

- New plugin project files: `paseo-plugin.json`, `package.json`, `tsconfig.json`, `index.client.tsx`, `index.server.ts`, `client/`, `server/`, `shared/`.
- Dependencies: `@getpaseo/plugin`, `zod`, `react`, `react-native` types (host supplies runtime), TanStack Query (host-provided).
- External: Asana REST API (`https://app.asana.com/api/1.0`) called from the daemon machine.
- Requires the daemon's global `pluginsEnabled` switch to be on and the plugin installed with `paseo plugin install`.
- Security: the PAT is written by the daemon subprocess to a `0600` file under `~/.config/paseo-asana/` on the daemon machine and never sent back to clients. The selected workspace (non-secret) uses host-scoped plugin settings.
