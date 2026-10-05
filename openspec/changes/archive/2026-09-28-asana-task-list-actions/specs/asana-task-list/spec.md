## MODIFIED Requirements

### Requirement: List my incomplete tasks
The surface SHALL display incomplete tasks assigned to the token's user in the selected workspace. Each task SHALL show its name, every project membership formatted as `<project name> › <section name>` (or just `<project name>` when the membership has no section), and its due date when set. Tasks SHALL be ordered by due date ascending, with undated tasks last.

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

#### Scenario: Ordering
- **WHEN** tasks have mixed due dates and some have none
- **THEN** dated tasks appear earliest first, followed by undated tasks

#### Scenario: More than one page of results
- **WHEN** the user has more tasks than one Asana API page returns
- **THEN** the plugin follows pagination and shows all incomplete tasks

## ADDED Requirements

### Requirement: Column layout
On non-compact layouts the list SHALL render a header row and three aligned columns: Task, Project › Section, Due. On compact layouts each row SHALL stack memberships and due date beneath the task name.

#### Scenario: Wide layout
- **WHEN** the surface renders with `layout.compact` false
- **THEN** a header row labels Task, Project › Section, and Due, and each task's values align under those headers

#### Scenario: Compact layout columns
- **WHEN** the surface renders with `layout.compact` true
- **THEN** no header row is shown and memberships and due date appear below the task name

### Requirement: Start chat action per row
Each task row SHALL offer a "Start chat" action, separate from opening the task in Asana.

#### Scenario: Press start chat
- **WHEN** user presses "Start chat" on a row
- **THEN** the start-chat dialog opens for that task and the task is not opened in Asana
