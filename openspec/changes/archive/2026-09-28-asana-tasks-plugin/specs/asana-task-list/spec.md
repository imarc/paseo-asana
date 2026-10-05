## ADDED Requirements

### Requirement: Sidebar entry
The plugin SHALL register a sidebar item titled "Asana" that opens the task list surface.

#### Scenario: Open surface
- **WHEN** user selects "Asana" in the Paseo sidebar
- **THEN** the task list surface opens

### Requirement: List my incomplete tasks
The surface SHALL display incomplete tasks assigned to the token's user in the selected workspace, showing each task's name, due date when set, and first project name when set. Tasks SHALL be ordered by due date ascending, with undated tasks last.

#### Scenario: Tasks shown
- **WHEN** the surface opens with a valid token and the user has incomplete assigned tasks
- **THEN** each task appears with its name, due date if any, and project if any

#### Scenario: Completed tasks excluded
- **WHEN** a task assigned to the user is completed
- **THEN** it does not appear in the list

#### Scenario: Ordering
- **WHEN** tasks have mixed due dates and some have none
- **THEN** dated tasks appear earliest first, followed by undated tasks

#### Scenario: More than one page of results
- **WHEN** the user has more tasks than one Asana API page returns
- **THEN** the plugin follows pagination and shows all incomplete tasks

### Requirement: List states
The surface SHALL show distinct loading, empty, not-configured, and error states.

#### Scenario: Loading
- **WHEN** tasks are being fetched
- **THEN** a loading indicator is shown instead of stale defaults

#### Scenario: Empty
- **WHEN** the user has no incomplete assigned tasks
- **THEN** the surface shows a "No open tasks" message

#### Scenario: Not configured
- **WHEN** no token is saved
- **THEN** the surface explains that a token is needed and offers a button that opens the plugin settings screen

#### Scenario: Error
- **WHEN** the Asana request fails
- **THEN** the surface shows the error message and a Retry action

### Requirement: Refresh
The surface SHALL provide a Refresh action that refetches tasks from Asana.

#### Scenario: Manual refresh
- **WHEN** user presses Refresh
- **THEN** tasks are refetched and the list updates

### Requirement: Open task in Asana
Pressing a task SHALL open its Asana permalink with the platform's external URL handler.

#### Scenario: Press task
- **WHEN** user presses a task row
- **THEN** the task's Asana permalink opens outside Paseo

### Requirement: Cross-platform rendering
The surface SHALL use only React Native primitives and host UI components, take all text colors from the theme, and adapt padding to compact layouts.

#### Scenario: Dark theme
- **WHEN** the active Paseo theme is dark
- **THEN** all text in the surface is legible using theme foreground colors

#### Scenario: Compact layout
- **WHEN** the surface renders on mobile or a narrow window
- **THEN** it uses compact padding and task rows remain readable
