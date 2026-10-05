## ADDED Requirements

### Requirement: Store Asana access token
The plugin SHALL provide a settings screen under Settings → Plugins where the user enters an Asana Personal Access Token, and SHALL persist it on the daemon machine in a file readable only by the daemon user. The token SHALL NOT be stored in plugin settings documents, which are readable by clients.

#### Scenario: Save token
- **WHEN** user enters a token and presses Save
- **THEN** the token is persisted and survives plugin reload and daemon restart

#### Scenario: Token input is masked
- **WHEN** the settings screen renders the token field
- **THEN** the field uses secure text entry, starts empty, and shows only whether a token is saved

#### Scenario: Clear token
- **WHEN** user clears the token and saves
- **THEN** the stored token is empty and the task list reports that no token is configured

### Requirement: Token stays on the daemon
The plugin SHALL call the Asana API only from daemon-side handlers. RPC outputs SHALL NOT include the token, and the plugin SHALL NOT log it.

#### Scenario: RPC output excludes token
- **WHEN** any plugin RPC returns
- **THEN** its output contains no access token value

### Requirement: Verify connection
The settings screen SHALL let the user verify the token, showing the Asana user name on success and the Asana error message on failure.

#### Scenario: Valid token
- **WHEN** user presses Verify with a valid saved token
- **THEN** the screen shows "Connected as <Asana user name>"

#### Scenario: Invalid token
- **WHEN** user presses Verify and Asana responds 401
- **THEN** the screen shows an error stating the token was rejected

### Requirement: Select workspace
The settings screen SHALL list the Asana workspaces available to the token and persist the selected workspace. When no workspace is selected, the plugin SHALL use the first workspace returned by Asana.

#### Scenario: Choose workspace
- **WHEN** user selects a workspace from the list
- **THEN** the selection is persisted and used for subsequent task fetches

#### Scenario: Default workspace
- **WHEN** a valid token is saved and no workspace is selected
- **THEN** task fetches use the first workspace returned by Asana for the user
