# Cabeus Council Perks Tracking

Task 045 adds admin tracking for Cabeus Council service delivery.

## Scope

Cabeus Council perks are tracked in `command_perk_commitments` for active Cabeus Council
organizations.

Supported perk types:

- Analyst support
- Proposal support
- Mission brief
- Custom alert
- Executive perk
- Free sponsorship

Each commitment stores status, priority, request summary, fulfillment summary,
next step, due date, fulfillment date, blocked reason, sponsorship inventory
notes, internal notes, and staff ownership metadata.

## Admin Workflow

```text
/admin/command
```

Admins can:

- Add a new perk commitment for an active Cabeus Council organization.
- Track promised, requested, in-progress, fulfilled, blocked, or canceled
  delivery status.
- Record due dates, next steps, fulfillment summaries, blocked reasons, and
  sponsorship inventory notes.
- Update existing commitments from the Cabeus Council pipeline screen.

Creates and updates also write `access_audit_events` entries so service changes
remain reviewable.

## Access Model

- Organization members and organization admins can read their organization's
  Cabeus Council perk records.
- Analysts and admins can read Cabeus Council perk records.
- Analysts and admins can create and update perk commitments.
- Only admins can delete perk commitments.
- Inserts and updates require an active organization-scoped Cabeus Council entitlement.

## Verification Limit

Live database writes require the migration applied to the Potomac Supabase
project, a signed-in admin, and active Cabeus Council organization records. Without
those, local verification is limited to build, static search, and migration
inspection.
