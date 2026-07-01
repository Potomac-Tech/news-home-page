import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberForumAccessContext } from "../../../lib/auth/member-forum";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import {
    bookmarkForumTopic,
    createForumTopic,
    reactToForumPost,
    replyToForumTopic,
    reportForumContent,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Member Forums",
};

type Profile = {
    user_id: string;
    email: string;
    full_name: string | null;
    company: string | null;
    title: string | null;
    base_tier: string;
};

type Forum = {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    access_tier_required: string;
    status: string;
    sort_order: number;
};

type Topic = {
    id: string;
    forum_id: string;
    author_user_id: string;
    title: string;
    summary: string | null;
    status: string;
    pinned: boolean;
    last_post_at: string | null;
    created_at: string;
};

type Post = {
    id: string;
    topic_id: string;
    parent_post_id: string | null;
    author_user_id: string;
    body: string;
    status: string;
    created_at: string;
};

type ForumData = {
    forums: Forum[];
    topics: Topic[];
    selectedForum: Forum | null;
    selectedTopic: Topic | null;
    posts: Post[];
    profilesByUserId: Map<string, Profile>;
    postCountsByTopicId: Map<string, number>;
    reactionCountsByPostId: Map<string, number>;
    bookmarkedTopicIds: Set<string>;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
});

function statusLabel(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function profileLabel(profile: Profile | undefined) {
    if (!profile) {
        return "Member";
    }

    return profile.full_name || profile.email;
}

function profileDetail(profile: Profile | undefined) {
    if (!profile) {
        return "Profile visibility limited";
    }

    return [profile.title, profile.company, tierLabel(profile.base_tier)]
        .filter(Boolean)
        .join(" | ");
}

function tierLabel(value: string) {
    if (value === "command") {
        return "Command";
    }

    return value === "scout" ? "Scout" : "Explorer";
}

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "No posts";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date pending";
    }

    return dateTimeFormatter.format(date);
}

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Member forums
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Forums are member-gated and require the Potomac
                        Supabase public environment variables plus an approved
                        signed-in member.
                    </p>
                    <Link
                        href="/apply"
                        className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Apply for access
                    </Link>
                </div>
            </div>
        </section>
    );
}

function LockedGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Member forums
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Approved Explorer access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Forum participation is available to approved Explorer,
                        Scout, and Command members after account review.
                    </p>
                    <Link
                        href="/apply"
                        className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Apply for access
                    </Link>
                </div>
            </div>
        </section>
    );
}

function EmptyForums() {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-2xl text-white">
                No forums are available yet.
            </h2>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                Moderators can publish forum categories after the database
                migration is applied and seeded.
            </p>
            <Link
                href="/member"
                className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
            >
                Workspace
            </Link>
        </section>
    );
}

function ForumIndex({
    forums,
    selectedForum,
    topics,
}: {
    forums: Forum[];
    selectedForum: Forum | null;
    topics: Topic[];
}) {
    return (
        <aside className="space-y-6">
            <section className="glass-card rounded p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Community
                </p>
                <h1 className="mt-3 font-serif text-3xl leading-tight text-white">
                    Member Forums
                </h1>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="border-l border-potomac-gold/35 pl-3">
                        <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                            Forums
                        </dt>
                        <dd className="mt-1 font-semibold text-white">
                            {forums.length}
                        </dd>
                    </div>
                    <div className="border-l border-potomac-gold/35 pl-3">
                        <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                            Topics
                        </dt>
                        <dd className="mt-1 font-semibold text-white">
                            {topics.length}
                        </dd>
                    </div>
                </dl>
                <Link
                    href="/member"
                    className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Workspace
                </Link>
            </section>

            <section className="glass-card rounded p-4">
                <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Forums
                </p>
                <div className="mt-3 space-y-2">
                    {forums.map((forum) => {
                        const selected = forum.id === selectedForum?.id;

                        return (
                            <Link
                                key={forum.id}
                                href={`/member/forums?forum=${forum.id}`}
                                className={
                                    selected
                                        ? "block rounded border border-potomac-gold/55 bg-white/10 p-4"
                                        : "block rounded border border-white/10 bg-black/15 p-4 transition hover:border-potomac-gold/45 hover:bg-white/5"
                                }
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            {forum.title}
                                        </p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                            {forum.category} |{" "}
                                            {tierLabel(forum.access_tier_required)}
                                        </p>
                                    </div>
                                    {forum.status !== "active" ? (
                                        <span className="shrink-0 rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                                            {statusLabel(forum.status)}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-3 line-clamp-2 text-xs leading-5 text-potomac-cream/60">
                                    {forum.description}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </section>
        </aside>
    );
}

function TopicList({
    selectedForum,
    topics,
    selectedTopic,
    postCountsByTopicId,
}: {
    selectedForum: Forum | null;
    topics: Topic[];
    selectedTopic: Topic | null;
    postCountsByTopicId: Map<string, number>;
}) {
    if (!selectedForum) {
        return <EmptyForums />;
    }

    return (
        <section className="space-y-6">
            <section className="glass-card rounded p-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            {selectedForum.category}
                        </p>
                        <h2 className="mt-2 font-serif text-3xl leading-tight text-white">
                            {selectedForum.title}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                            {selectedForum.description}
                        </p>
                    </div>
                    <span className="w-fit rounded border border-potomac-gold/35 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        {tierLabel(selectedForum.access_tier_required)}
                    </span>
                </div>
                <CreateTopicForm forum={selectedForum} />
            </section>

            <section className="glass-card rounded p-4">
                <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Topics
                </p>
                <div className="mt-3 space-y-2">
                    {topics.length ? (
                        topics.map((topic) => {
                            const selected = topic.id === selectedTopic?.id;

                            return (
                                <Link
                                    key={topic.id}
                                    href={`/member/forums?forum=${topic.forum_id}&topic=${topic.id}`}
                                    className={
                                        selected
                                            ? "block rounded border border-potomac-gold/55 bg-white/10 p-4"
                                            : "block rounded border border-white/10 bg-black/15 p-4 transition hover:border-potomac-gold/45 hover:bg-white/5"
                                    }
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap gap-2">
                                                {topic.pinned ? (
                                                    <StatusPill label="Pinned" />
                                                ) : null}
                                                {topic.status !== "open" ? (
                                                    <StatusPill
                                                        label={statusLabel(
                                                            topic.status
                                                        )}
                                                    />
                                                ) : null}
                                            </div>
                                            <h3 className="mt-2 text-sm font-bold leading-6 text-white">
                                                {topic.title}
                                            </h3>
                                            {topic.summary ? (
                                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-potomac-cream/60">
                                                    {topic.summary}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="shrink-0 text-left text-xs uppercase tracking-[0.12em] text-potomac-cream/45 md:text-right">
                                            <p>{postCountsByTopicId.get(topic.id) ?? 0} posts</p>
                                            <p className="mt-1">
                                                {formatDateTime(
                                                    topic.last_post_at ??
                                                        topic.created_at
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="rounded border border-white/10 bg-black/15 p-4 text-sm leading-6 text-potomac-cream/65">
                            No topics have been posted in this forum yet.
                        </div>
                    )}
                </div>
            </section>
        </section>
    );
}

function StatusPill({ label }: { label: string }) {
    return (
        <span className="rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
            {label}
        </span>
    );
}

function CreateTopicForm({ forum }: { forum: Forum }) {
    return (
        <form action={createForumTopic} className="mt-5 space-y-4">
            <input type="hidden" name="forum_id" value={forum.id} />
            <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                    Topic title
                </span>
                <input
                    name="title"
                    required
                    maxLength={180}
                    className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                    placeholder="Lunar procurement signal to discuss"
                />
            </label>
            <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                    Summary
                </span>
                <input
                    name="summary"
                    maxLength={280}
                    className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                    placeholder="Optional short context for the topic list"
                />
            </label>
            <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                    Opening post
                </span>
                <textarea
                    name="body"
                    required
                    rows={5}
                    className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                    placeholder="Share the signal, source context, or question."
                />
            </label>
            <button className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream">
                Post topic
            </button>
        </form>
    );
}

function TopicDetail({
    selectedForum,
    selectedTopic,
    posts,
    profilesByUserId,
    reactionCountsByPostId,
    bookmarkedTopicIds,
    currentUserId,
    canModerate,
}: {
    selectedForum: Forum | null;
    selectedTopic: Topic | null;
    posts: Post[];
    profilesByUserId: Map<string, Profile>;
    reactionCountsByPostId: Map<string, number>;
    bookmarkedTopicIds: Set<string>;
    currentUserId: string;
    canModerate: boolean;
}) {
    if (!selectedForum) {
        return null;
    }

    if (!selectedTopic) {
        return (
            <aside className="glass-card h-fit rounded p-6">
                <h2 className="font-serif text-2xl text-white">
                    Select a topic
                </h2>
                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                    Choose a topic from the selected forum or start a new one.
                </p>
            </aside>
        );
    }

    const topicAuthor = profilesByUserId.get(selectedTopic.author_user_id);
    const bookmarked = bookmarkedTopicIds.has(selectedTopic.id);
    const locked = selectedTopic.status === "locked";
    const hidden = selectedTopic.status === "hidden";

    return (
        <aside className="space-y-6">
            <section className="glass-card rounded p-6">
                <div className="border-b border-white/10 pb-5">
                    <div className="flex flex-wrap gap-2">
                        {selectedTopic.pinned ? <StatusPill label="Pinned" /> : null}
                        {selectedTopic.status !== "open" ? (
                            <StatusPill label={statusLabel(selectedTopic.status)} />
                        ) : null}
                        {canModerate ? <StatusPill label="Moderator view" /> : null}
                    </div>
                    <h2 className="mt-3 font-serif text-3xl leading-tight text-white">
                        {selectedTopic.title}
                    </h2>
                    {selectedTopic.summary ? (
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                            {selectedTopic.summary}
                        </p>
                    ) : null}
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                        {profileLabel(topicAuthor)} | {profileDetail(topicAuthor)}
                    </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                    <form action={bookmarkForumTopic}>
                        <input
                            type="hidden"
                            name="topic_id"
                            value={selectedTopic.id}
                        />
                        <button className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                            {bookmarked ? "Saved" : "Save topic"}
                        </button>
                    </form>
                    <ReportForm
                        forumId={selectedForum.id}
                        topicId={selectedTopic.id}
                        reportedUserId={selectedTopic.author_user_id}
                        compact
                    />
                </div>
            </section>

            <section className="glass-card rounded p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Posts
                </p>
                <div className="mt-5 space-y-4">
                    {posts.length ? (
                        posts.map((post) => {
                            const author = profilesByUserId.get(
                                post.author_user_id
                            );
                            const own = post.author_user_id === currentUserId;

                            return (
                                <article
                                    key={post.id}
                                    className={
                                        own
                                            ? "rounded border border-potomac-gold/25 bg-potomac-gold/10 p-4"
                                            : "rounded border border-white/10 bg-black/20 p-4"
                                    }
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                {own ? "You" : profileLabel(author)}
                                            </p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                                {profileDetail(author)}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                            {post.parent_post_id ? (
                                                <StatusPill label="Reply" />
                                            ) : null}
                                            {post.status !== "visible" ? (
                                                <StatusPill
                                                    label={statusLabel(post.status)}
                                                />
                                            ) : null}
                                            <span>{formatDateTime(post.created_at)}</span>
                                        </div>
                                    </div>
                                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/80">
                                        {post.body}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
                                        <ReactionForm
                                            postId={post.id}
                                            count={
                                                reactionCountsByPostId.get(post.id) ??
                                                0
                                            }
                                        />
                                        <ReportForm
                                            forumId={selectedForum.id}
                                            topicId={selectedTopic.id}
                                            postId={post.id}
                                            reportedUserId={post.author_user_id}
                                            compact
                                        />
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <p className="text-sm leading-6 text-potomac-cream/65">
                            No visible posts are available for this topic.
                        </p>
                    )}
                </div>
            </section>

            <section className="glass-card rounded p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Reply
                </p>
                {locked || hidden ? (
                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                        This topic is {statusLabel(selectedTopic.status).toLowerCase()}.
                    </p>
                ) : (
                    <form action={replyToForumTopic} className="mt-4 space-y-4">
                        <input
                            type="hidden"
                            name="topic_id"
                            value={selectedTopic.id}
                        />
                        <label className="block">
                            <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                                Reply body
                            </span>
                            <textarea
                                name="body"
                                required
                                rows={5}
                                className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                                placeholder="Add a source-backed note or response."
                            />
                        </label>
                        <button className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream">
                            Post reply
                        </button>
                    </form>
                )}
            </section>
        </aside>
    );
}

function ReactionForm({ postId, count }: { postId: string; count: number }) {
    return (
        <form action={reactToForumPost}>
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="reaction_type" value="useful" />
            <button className="rounded border border-potomac-gold/50 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                Useful {count ? `(${count})` : ""}
            </button>
        </form>
    );
}

function ReportForm({
    forumId,
    topicId,
    postId,
    reportedUserId,
    compact = false,
}: {
    forumId: string;
    topicId?: string;
    postId?: string;
    reportedUserId?: string;
    compact?: boolean;
}) {
    return (
        <details className={compact ? "w-full md:w-auto" : "w-full"}>
            <summary className="cursor-pointer rounded border border-potomac-gold/50 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                Report
            </summary>
            <form action={reportForumContent} className="mt-3 space-y-3">
                <input type="hidden" name="forum_id" value={forumId} />
                <input type="hidden" name="topic_id" value={topicId ?? ""} />
                <input type="hidden" name="post_id" value={postId ?? ""} />
                <input
                    type="hidden"
                    name="reported_user_id"
                    value={reportedUserId ?? ""}
                />
                <select
                    name="reason"
                    required
                    className="w-full rounded border border-white/10 bg-potomac-primary px-3 py-3 text-sm text-white"
                >
                    <option value="spam">Spam or solicitation</option>
                    <option value="abuse">Abuse or harassment</option>
                    <option value="sensitive_content">
                        Sensitive or controlled content
                    </option>
                    <option value="off_topic">Off-topic or low quality</option>
                </select>
                <textarea
                    name="reporter_note"
                    rows={3}
                    className="w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                    placeholder="Optional note for moderators."
                />
                <button className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                    Submit report
                </button>
            </form>
        </details>
    );
}

async function loadForumData({
    supabase,
    selectedForumId,
    selectedTopicId,
    currentUserId,
}: {
    supabase: Awaited<ReturnType<typeof createClient>>;
    selectedForumId: string | null;
    selectedTopicId: string | null;
    currentUserId: string;
}): Promise<ForumData> {
    const { data: forumData, error: forumError } = await supabase
        .from("member_forums")
        .select(
            "id,slug,title,description,category,access_tier_required,status,sort_order"
        )
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });

    if (forumError) {
        throw new Error(forumError.message);
    }

    const forums = (forumData ?? []) as Forum[];
    const selectedForum =
        forums.find((forum) => forum.id === selectedForumId) ?? forums[0] ?? null;

    if (!selectedForum) {
        return {
            forums,
            topics: [],
            selectedForum: null,
            selectedTopic: null,
            posts: [],
            profilesByUserId: new Map(),
            postCountsByTopicId: new Map(),
            reactionCountsByPostId: new Map(),
            bookmarkedTopicIds: new Set(),
        };
    }

    const { data: topicData, error: topicError } = await supabase
        .from("member_forum_topics")
        .select(
            "id,forum_id,author_user_id,title,summary,status,pinned,last_post_at,created_at"
        )
        .eq("forum_id", selectedForum.id)
        .order("pinned", { ascending: false })
        .order("last_post_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50);

    if (topicError) {
        throw new Error(topicError.message);
    }

    const topics = (topicData ?? []) as Topic[];
    const selectedTopic =
        topics.find((topic) => topic.id === selectedTopicId) ?? topics[0] ?? null;
    const topicIds = topics.map((topic) => topic.id);
    const selectedTopicPostQuery = selectedTopic
        ? supabase
              .from("member_forum_posts")
              .select("id,topic_id,parent_post_id,author_user_id,body,status,created_at")
              .eq("topic_id", selectedTopic.id)
              .order("created_at", { ascending: true })
              .limit(100)
        : Promise.resolve({ data: [], error: null });
    const topicPostCountQuery = topicIds.length
        ? supabase
              .from("member_forum_posts")
              .select("id,topic_id")
              .in("topic_id", topicIds)
              .limit(500)
        : Promise.resolve({ data: [], error: null });
    const bookmarkQuery = topicIds.length
        ? supabase
              .from("member_forum_bookmarks")
              .select("topic_id")
              .eq("user_id", currentUserId)
              .in("topic_id", topicIds)
        : Promise.resolve({ data: [], error: null });
    const [postResult, countResult, bookmarkResult] = await Promise.all([
        selectedTopicPostQuery,
        topicPostCountQuery,
        bookmarkQuery,
    ]);

    for (const result of [postResult, countResult, bookmarkResult]) {
        if (result.error) {
            throw new Error(result.error.message);
        }
    }

    const posts = (postResult.data ?? []) as Post[];
    const postCountsByTopicId = new Map<string, number>();

    for (const row of (countResult.data ?? []) as Array<{ topic_id: string }>) {
        postCountsByTopicId.set(
            row.topic_id,
            (postCountsByTopicId.get(row.topic_id) ?? 0) + 1
        );
    }

    const postIds = posts.map((post) => post.id);
    const reactionResult = postIds.length
        ? await supabase
              .from("member_forum_reactions")
              .select("post_id")
              .in("post_id", postIds)
              .limit(500)
        : { data: [], error: null };

    if (reactionResult.error) {
        throw new Error(reactionResult.error.message);
    }

    const reactionCountsByPostId = new Map<string, number>();

    for (const row of (reactionResult.data ?? []) as Array<{ post_id: string }>) {
        reactionCountsByPostId.set(
            row.post_id,
            (reactionCountsByPostId.get(row.post_id) ?? 0) + 1
        );
    }

    const profileUserIds = Array.from(
        new Set([
            ...topics.map((topic) => topic.author_user_id),
            ...posts.map((post) => post.author_user_id),
        ])
    );
    const profileResult = profileUserIds.length
        ? await supabase
              .from("member_profiles")
              .select("user_id,email,full_name,company,title,base_tier")
              .in("user_id", profileUserIds)
        : { data: [], error: null };

    if (profileResult.error) {
        throw new Error(profileResult.error.message);
    }

    const profilesByUserId = new Map(
        ((profileResult.data ?? []) as Profile[]).map((profile) => [
            profile.user_id,
            profile,
        ])
    );

    return {
        forums,
        topics,
        selectedForum,
        selectedTopic,
        posts,
        profilesByUserId,
        postCountsByTopicId,
        reactionCountsByPostId,
        bookmarkedTopicIds: new Set(
            ((bookmarkResult.data ?? []) as Array<{ topic_id: string }>).map(
                (bookmark) => bookmark.topic_id
            )
        ),
    };
}

export default async function MemberForumsPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getMemberForumAccessContext({
        supabase,
        nextPath: "/member/forums",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canUseMemberForums || !access.userId) {
        return <LockedGate />;
    }

    const params = (await searchParams) ?? {};
    const forumParam = params.forum;
    const topicParam = params.topic;
    const selectedForumId = Array.isArray(forumParam)
        ? forumParam[0] ?? null
        : forumParam ?? null;
    const selectedTopicId = Array.isArray(topicParam)
        ? topicParam[0] ?? null
        : topicParam ?? null;
    const data = await loadForumData({
        supabase,
        selectedForumId,
        selectedTopicId,
        currentUserId: access.userId,
    });

    if (!data.forums.length) {
        return (
            <section className="bg-grid-pattern">
                <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                    <EmptyForums />
                </div>
            </section>
        );
    }

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)_24rem]">
                    <ForumIndex
                        forums={data.forums}
                        selectedForum={data.selectedForum}
                        topics={data.topics}
                    />
                    <TopicList
                        selectedForum={data.selectedForum}
                        topics={data.topics}
                        selectedTopic={data.selectedTopic}
                        postCountsByTopicId={data.postCountsByTopicId}
                    />
                    <TopicDetail
                        selectedForum={data.selectedForum}
                        selectedTopic={data.selectedTopic}
                        posts={data.posts}
                        profilesByUserId={data.profilesByUserId}
                        reactionCountsByPostId={data.reactionCountsByPostId}
                        bookmarkedTopicIds={data.bookmarkedTopicIds}
                        currentUserId={access.userId}
                        canModerate={access.canModerateMemberForums}
                    />
                </div>
            </div>
        </section>
    );
}
