## ADDED Requirements

### Requirement: Start chat dialog
Pressing "Start chat" on a task SHALL open a dialog where the user chooses a Paseo project, a checkout mode, and an agent provider before creating the chat.

#### Scenario: Dialog contents
- **WHEN** the dialog opens
- **THEN** it shows the task name, a project picker listing registered Paseo projects, a checkout mode choice, a provider picker, and a Start button

#### Scenario: No projects
- **WHEN** the host has no registered Paseo projects
- **THEN** the dialog explains that a project must be added in Paseo first and Start is disabled

### Requirement: Checkout mode
The dialog SHALL offer "Current checkout" and "New git worktree". "New git worktree" SHALL be available only for git projects and SHALL require a branch name, pre-filled from the task name as a lowercase hyphenated slug prefixed with `asana/`.

#### Scenario: Non-git project
- **WHEN** the selected project is not a git project
- **THEN** only "Current checkout" is selectable

#### Scenario: Branch name default
- **WHEN** user selects "New git worktree" for task "Fix .env.example, ops config and sever DB"
- **THEN** the branch field is pre-filled with `asana/fix-env-example-ops-config-and-sever-db`

#### Scenario: Empty branch name
- **WHEN** "New git worktree" is selected and the branch name is empty
- **THEN** Start is disabled

### Requirement: Create workspace and agent
Pressing Start SHALL create a Paseo workspace for the chosen project (directory at the project root, or a new worktree branched off the default branch), create an agent in it with the chosen provider, send the task snapshot as the first prompt, and navigate to the new agent.

#### Scenario: Current checkout
- **WHEN** user starts with "Current checkout"
- **THEN** a workspace is created at the project root path and an agent starts with a prompt containing the task snapshot

#### Scenario: New worktree
- **WHEN** user starts with "New git worktree" and branch `asana/foo`
- **THEN** a worktree workspace on new branch `asana/foo` is created and the agent starts there

#### Scenario: Navigate to agent
- **WHEN** creation succeeds and the client supports navigation
- **THEN** the dialog closes and Paseo opens the new agent

#### Scenario: Creation fails
- **WHEN** workspace or agent creation fails
- **THEN** the dialog stays open and shows the error message

### Requirement: Remember choices
The dialog SHALL default to the last used project, checkout mode, and provider, stored in host-scoped plugin settings.

#### Scenario: Reopen dialog
- **WHEN** user starts a chat and later opens the dialog for another task
- **THEN** the previously chosen project, mode, and provider are pre-selected when still available
