# Member Forum Schema

Task 048 adds the database model and access rules for moderated member forums.

## Scope

The migration `20260630131146_member_forum_schema.sql` adds:

- `member_forums`
- `member_forum_topics`
- `member_forum_posts`
- `member_forum_reactions`
- `member_forum_bookmarks`
- `member_forum_reports`
- `member_forum_moderation_actions`
- `member_forum_audit_events`

It also adds forum status, topic status, post status, reaction, report status,
and moderation action enum types.

## Access Model

The migration adds the normalized `moderator` app role and private helper
functions that avoid user-editable metadata:

- `app_private.can_access_member_forum_tier(...)` maps Explorer, Scout, and
  Command forum gates to active normalized role assignments.
- `app_private.can_moderate_member_forums(...)` grants moderation capability to
  `moderator`, `editor`, `analyst`, and `admin`.
- `app_private.can_access_member_forum(...)` checks active forum visibility.
- `app_private.can_access_member_forum_topic(...)` checks readable topics.

Explorer members can read and participate in Explorer forums. Scout and Command
members inherit access to lower tiers. Command-only forums remain limited to
Command users and staff/moderators.

## Safety Coverage

The model supports:

- Forum categories and tier-gated forum visibility
- Topics with pinned, locked, hidden, and archived states
- Posts and replies through `parent_post_id`
- Reactions and topic bookmarks
- Member reports against forums, topics, or posts
- Moderator action records
- Retained audit events
- Explicit grants and RLS on every exposed table

## Verification Limit

Live RLS tests require the migration applied to the Potomac Supabase project and
seeded Explorer, Scout, Command, moderator, analyst, editor, and admin users.
Without those, local verification is limited to build, static search, migration
inspection, and local Supabase CLI connectivity checks.
