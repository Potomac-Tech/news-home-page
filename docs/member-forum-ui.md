# Member Forum UI

Task 049 adds the first member-facing moderated forum workspace.

## Member Surface

The protected route `/member/forums` includes:

- Forum index with category, tier, and moderation-state labels
- Topic list for the selected forum
- Topic detail with post and reply history
- Topic creation form with an opening post
- Reply form for open topics
- Topic save control
- Useful reaction control on posts
- Report controls for topics and posts
- Empty, locked, and missing-configuration states

The member dashboard links to the forum route from `/member`.

## Supabase Behavior

The page uses Supabase Auth claims plus normalized role assignments. It relies
on the Task 048 `member_forum_*` RLS policies for read/write enforcement, so
forum rows, topics, posts, reports, bookmarks, and reactions are filtered by the
database before rendering.

Server actions create topics and first posts with generated UUIDs, add replies,
save topics, add reactions, and insert report/audit records. Authorization uses
`member_role_assignments`; it does not use user-editable metadata.

## Verification Limit

Live compose, reply, save, react, report, and moderator-state behavior requires
the forum migration applied to the Potomac Supabase project plus seeded
Explorer, Scout, Command, moderator, analyst, editor, and admin users. Without
public Supabase keys and test users, verification is limited to local builds,
static route/action inspection, missing-configuration route rendering, and
Supabase CLI connectivity checks.
