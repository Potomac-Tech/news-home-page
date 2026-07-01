# Member Chat Schema

Task 046 adds the database model and access rules for direct member-to-member
chat.

## Scope

The migration `20260630080656_member_chat_schema.sql` adds:

- `member_chat_conversations`
- `member_chat_participants`
- `member_chat_messages`
- `member_chat_read_receipts`
- `member_chat_blocks`
- `member_chat_reports`
- `member_chat_moderation_actions`
- `member_chat_audit_events`

It also adds enum types for conversation status, participant status, message
moderation status, report status, and moderation action type.

## Access Model

Private helper functions in `app_private` enforce approved-member access without
using user-editable metadata:

- `app_private.can_use_member_chat(...)` checks active normalized Explorer,
  Scout, or Command role assignments.
- `app_private.is_chat_participant(...)` checks active conversation
  participation.
- `app_private.has_chat_block_between(...)` prevents new participant inserts
  when either member has blocked the other.
- `app_private.is_chat_moderator()` grants analyst/admin moderation visibility.

RLS limits reads to active participants and authorized staff. Message inserts
require the sender to be an active participant in an active conversation.
Participants can update their own participation state and hide their own
messages, while moderation-sensitive conversation locks, report resolution, and
moderation action records are reserved for analysts/admins.

## Safety Coverage

The model supports:

- Direct conversations and active participants
- Read receipts and unread-state timestamps
- Muted participants through `muted_until`
- Member blocking through `member_chat_blocks`
- Message report records
- Moderator actions and retained audit events
- Analyst/admin review without relying on user-editable metadata

## Verification Limit

Live RLS tests require the migration applied to the Potomac Supabase project and
seeded Explorer, Scout, Command, analyst, and admin users. Without those, local
verification is limited to build, static search, migration inspection, and local
Supabase CLI connectivity checks.
