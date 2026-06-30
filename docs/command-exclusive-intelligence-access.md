# Command Exclusive Intelligence Access

Task 044 adds the data model for Command-only real-time and near-real-time
intelligence allocation.

## Allocation Model

`command_intelligence_allocations` binds a Command-exclusive dataset to one
allocated Command user during an active exclusivity window.

The record captures:

- dataset
- allocated user
- optional organization
- real-time or near-real-time access mode
- allocation status
- collection start and completion timestamps
- exclusive access start and end timestamps
- optional delivery latency
- staff notes and audit authorship fields

The active allocation index allows only one planned or active allocation per
dataset, which represents the requirement that one Command user can receive the
new intelligence exclusively.

## Exclusivity Rules

The database requires each allocation's exclusive window to last at least one
year. It also requires the exclusive window to start no earlier than collection
start.

Staff can only create or update allocations when:

- the dataset is `command` tier
- the dataset release state is `command_exclusive`
- the dataset itself has a one-year-or-longer exclusive access window
- the allocated user has an active normalized `command_user` role

## Access Control

Allocation rows are readable by:

- the allocated Command user
- organization admins for the linked organization
- analysts and admins

Only analysts and admins can manage allocations. Only admins can delete
allocation rows.

The model uses `member_role_assignments` and organization membership helpers. It
does not use user-editable metadata.

## Verification Notes

Live verification requires the Potomac Supabase project
`xlpkdoeldtlhearqajat`, applied dataset catalog/release migrations, an applied
`20260630031059_command_exclusive_intelligence_access.sql` migration, a
Command-exclusive dataset, and a seeded Command user.
