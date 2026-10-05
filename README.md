# Paseo Asana

View your open Asana tasks in Paseo and bring task context into coding-agent chats.

## Features

- List tasks assigned to you in a selected Asana workspace, with due dates and project/section names.
- Sort by task, project/section, or due date on wide layouts; use a compact task list on smaller screens.
- Open tasks in Asana and refresh the list on demand.
- Search for Asana tasks in the composer attachment picker.
- Start a chat from a task: choose a Paseo project and agent, optionally create a Git worktree, and edit the prompt before sending.

## Requirements

- Paseo **0.9.2 or newer**, on both the daemon and connected app, with plugins enabled.
- An Asana account and Personal Access Token (PAT), plus access to an Asana workspace.
- Network access from the daemon to `https://app.asana.com`.
- To start chats: an existing Paseo project and an enabled agent provider with an available model. Worktrees require a Git project.

Version 0.1.0 typechecks against `@getpaseo/plugin` 0.9.2 and 0.10.3. These are SDK compatibility checks, not end-to-end runtime certification or a guarantee for future Paseo versions. The development SDK remains pinned to 0.9.2.

## Install

### Tagged release (recommended)

Install the **v0.1.0** release from the [GitHub repository](https://github.com/imarc/paseo-asana), rather than the latest development code:

```sh
paseo plugin install github:imarc/paseo-asana --ref v0.1.0
```

`--ref` selects the tag for this installation; it does not permanently pin future updates. Paseo's Git update command can offer the latest default-branch revision instead.

### Latest from GitHub

To install the latest code from the default branch (`main`), which may include unreleased changes, omit `--ref`:

```sh
paseo plugin install github:imarc/paseo-asana
```

Alternatively, enter `github:imarc/paseo-asana` in **Settings → Plugins → Plugin source** on the target host. Enable plugins if necessary, and verify that `paseo-asana` is running.

### Published npm release

The same release version is also available on [npm](https://www.npmjs.com/package/paseo-asana):

```sh
paseo plugin install npm:paseo-asana@0.1.0
```

Alternatively, enter `npm:paseo-asana@0.1.0` in **Settings → Plugins → Plugin source**.

### From a local checkout

On the daemon machine:

```sh
paseo plugin install /absolute/path/to/paseo-asana
paseo plugin ls
```

Paseo compiles the TypeScript and supplies the runtime libraries. No separate build or dependency-install preparation command is needed for this plugin.

## Connect Asana

1. Create a PAT in the [Asana developer console](https://app.asana.com/0/my-apps). Treat it like a password; never commit or share it.
2. Open the plugin's **Asana** settings from Settings → Plugins, or use **Open settings** in the empty task view.
3. Paste the PAT and select **Save**, then **Verify** to check the connection.
4. Select an Asana workspace, or leave **First workspace (default)** selected.
5. Open **Asana** in the sidebar to view your assigned open tasks.

Use **Clear** in the plugin settings to remove the saved token. Revoke it in Asana if it has been exposed.

## Use task context in chats

- In an existing chat, choose **Asana task** from the attachment picker and search by task or project name. Task attachments include a snapshot of the task's details, not a live synchronization.
- Select **Start chat** beside a task to choose a project and agent. For Git projects, you can enable **New git worktree** and edit the branch name.
- Review and edit the **Prompt** before selecting **Start**. Starting creates a workspace and agent and sends that prompt immediately.

The plugin reads Asana data; it does not edit or complete tasks in Asana. Attachment search caches tasks for up to 60 seconds and returns at most 50 matches. **Refresh** reloads the task list.

## Security and privacy

- Plugins are trusted, unsandboxed code. Install only on a daemon you trust.
- The PAT is stored outside the repository at `~/.config/paseo-asana/token` on the daemon machine. The plugin creates the directory with mode `0700` and the token file with mode `0600` on systems that honor POSIX permissions. It is a plaintext file, not an encrypted credential vault.
- The saved token is not returned to clients by the connection-status RPC. Token entry is sent to the daemon through Paseo.
- The connection is daemon-wide, not per connected user. Clients authorized to use this plugin can access tasks through that connection. Do not use this as a multi-user isolation boundary.
- Task titles, descriptions, project names, and links can be included in attachments and prompts and sent to the selected agent provider. Review them before sending.
- Removing the plugin does not itself remove the saved token. Clear it before uninstalling, or remove the token file on the daemon host.

## Development

With Node.js and npm installed:

```sh
npm ci
npm run typecheck
paseo plugin install /absolute/path/to/paseo-asana
```

After editing:

```sh
npm run typecheck
paseo plugin reload paseo-asana
```

Inspect daemon-side errors with `paseo plugin logs paseo-asana`. A rejected token requires replacing or revoking the PAT; an empty task list may mean the wrong workspace is selected.

The entry points are `index.client.tsx` and `index.server.ts`. UI code lives in `client/`, daemon-side Asana/token code in `server/`, and contracts and task formatting in `shared/`.

## Distribution

The release version is **0.1.0**. The public npm package name is `paseo-asana`. GitHub installation is available independently of npm publication.

To publish from a checkout with the npm publishing configuration, after authenticating with `npm login`:

```sh
npm run typecheck
npm pack --dry-run
npm publish --access public
```

Before publishing, run `npm run typecheck` and `npm pack --dry-run`, review the repository and its Git history for credentials, and test a clean installation. The npm `files` allowlist limits package contents, not what Git publishes; `.gitignore` does not remove previously committed secrets.

See Paseo's [publishing guide](https://paseo.sh/docs/plugins/publishing) and [plugin requirements](https://paseo.sh/docs/plugins/reference#requirements).

## License

Licensed under the [Apache License, Version 2.0](LICENSE).
