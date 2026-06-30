# Member Chat UI

Task 047 adds the first direct member-to-member chat surface for approved
Explorer, Scout, and Command members.

## Member Surface

The protected route `/member/chat` includes:

- A chat inbox with conversation counts and unread indicators
- Conversation detail with visible message history
- Reply and mark-read actions
- Privacy-constrained member discovery for starting conversations
- Report controls that create moderation review records
- Block controls that prevent future conversation starts between the members
- Empty, locked, and missing-configuration states

The member dashboard links to the chat route from `/member`.

## Supabase Behavior

The UI uses Supabase Auth claims plus normalized `member_role_assignments`; it
does not use user-editable metadata for authorization. Reads and writes are
still enforced by the `member_chat_*` RLS policies from Task 046.

This task adds a narrow `member_profiles` RLS policy for chat discovery:
approved chat-eligible members can see approved chat-eligible profiles. It also
adds a message trigger to keep `member_chat_conversations.last_message_at`
current when replies are inserted.

## Verification Limit

Live compose, reply, report, block, and unread-state behavior requires the chat
migration applied to the Potomac Supabase project plus seeded approved members.
Without public Supabase keys and test users, verification is limited to local
builds, static migration inspection, route rendering gates, and Supabase CLI
connectivity checks.
