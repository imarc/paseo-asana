## ADDED Requirements

### Requirement: Asana task attachment source
The plugin SHALL register a composer attachment source titled "Asana task" that searches the user's incomplete assigned tasks in the selected workspace.

#### Scenario: Source offered
- **WHEN** user opens the composer attachment menu on a host running the plugin
- **THEN** "Asana task" is listed as an attachment source

#### Scenario: Search by name or project
- **WHEN** user types a query in the picker
- **THEN** results include tasks whose name or project › section text contains the query, case-insensitively

#### Scenario: Empty query
- **WHEN** the picker opens with an empty query
- **THEN** results show open tasks in list order, capped at 50

#### Scenario: No token
- **WHEN** no token is saved
- **THEN** the search returns no results rather than failing

### Requirement: Task snapshot text
An attached task SHALL send the agent a plain-text snapshot containing the task name, Asana URL, each project › section membership, due date when set, and task notes when present.

#### Scenario: Attach task
- **WHEN** user attaches a task and sends the prompt
- **THEN** the agent receives the snapshot text including the task URL

#### Scenario: Picker row content
- **WHEN** results render in the picker
- **THEN** each row shows the task name as title and its first membership plus due date as subtitle
