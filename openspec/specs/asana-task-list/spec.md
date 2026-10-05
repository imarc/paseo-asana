# asana-task-list Specification

## Purpose
TBD - created by archiving change asana-tasks-plugin. Update Purpose after archive.
## Requirements
### Requirement: Sidebar entry
The plugin SHALL register a sidebar item titled "Asana" that opens the task list surface.

#### Scenario: Open surface
- **WHEN** user selects "Asana" in the Paseo sidebar
- **THEN** the task list surface opens

### Requirement: List my incomplete tasks
The surface SHALL display incomplete tasks assigned to the token's user in the selected workspace. Each task SHALL show its name, every project membership formatted as `<project name> › <section name>` (or just `<project name>` when the membership has no section), and its due date when set. By default tasks SHALL be ordered by due date ascending, with undated tasks last.

#### Scenario: Tasks shown
- **WHEN** the surface opens with a valid token and the user has incomplete assigned tasks
- **THEN** each task appears with its name, its project › section memberships, and its due date if any

#### Scenario: Multiple projects
- **WHEN** a task belongs to two projects
- **THEN** its row shows two `Project › Section` lines, one per membership

#### Scenario: Membership without section
- **WHEN** a task membership has no section
- **THEN** the row shows the project name alone for that membership

#### Scenario: Completed tasks excluded
- **WHEN** a task assigned to the user is completed
- **THEN** it does not appear in the list

#### Scenario: Default ordering
- **WHEN** the surface opens and tasks have mixed due dates and some have none
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

### Requirement: Column layout
On non-compact layouts the list SHALL render a header row and three aligned columns: Task, Project › Section, Due. On compact layouts each row SHALL stack memberships and due date beneath the task name.

#### Scenario: Wide layout
- **WHEN** the surface renders with `layout.compact` false
- **THEN** a header row labels Task, Project › Section, and Due, and each task's values align under those headers

#### Scenario: Compact layout columns
- **WHEN** the surface renders with `layout.compact` true
- **THEN** no header row is shown and memberships and due date appear below the task name

### Requirement: Column sorting
On non-compact layouts, pressing a column header SHALL sort the list by that column: Task by name, Project › Section by the first formatted membership, Due by due date. Pressing a different header SHALL sort it ascending; pressing the active header again SHALL reverse the direction. The active header SHALL be visually distinguished and show a direction indicator. Tasks with an empty value for the sorted column SHALL stay last in both directions, and ties SHALL keep the default order. Sort state is not persisted and compact layouts SHALL use the default order.

#### Scenario: Sort by a new column
- **WHEN** the list is sorted by Due and user presses the Task header
- **THEN** tasks are ordered by name A→Z and the Task header shows ▲

#### Scenario: Reverse direction
- **WHEN** the list is sorted by Task ascending and user presses the Task header
- **THEN** tasks are ordered by name Z→A and the Task header shows ▼

#### Scenario: Empty values last
- **WHEN** the list is sorted by Due descending and some tasks have no due date
- **THEN** dated tasks appear latest first, followed by undated tasks

#### Scenario: Reset on reload
- **WHEN** the plugin reloads or the surface remounts
- **THEN** the list returns to the default due-date ascending order

### Requirement: Start chat action per row
Each task row SHALL offer a "Start chat" action, separate from opening the task in Asana.

#### Scenario: Press start chat
- **WHEN** user presses "Start chat" on a row
- **THEN** the start-chat dialog opens for that task and the task is not opened in Asana
