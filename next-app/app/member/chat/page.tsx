import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberChatAccessContext } from "../../../lib/auth/member-chat";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import {
    blockMember,
    createConversation,
    markConversationRead,
    reportConversation,
    sendMessage,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Member Chat",
};

type Profile = {
    user_id: string;
    email: string;
    full_name: string | null;
    company: string | null;
    title: string | null;
    base_tier: string;
};

type Conversation = {
    id: string;
    status: string;
    subject: string | null;
    last_message_at: string | null;
    created_at: string;
};

type Participant = {
    conversation_id: string;
    user_id: string;
    status: string;
    last_read_at: string | null;
    muted_until: string | null;
};

type Message = {
    id: string;
    conversation_id: string;
    sender_user_id: string;
    body: string;
    status: string;
    created_at: string;
};

type InboxItem = {
    conversation: Conversation;
    participants: Participant[];
    otherProfiles: Profile[];
    latestMessage: Message | null;
    unread: boolean;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
});

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

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "No messages";
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
                        Member chat
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Direct messages are member-gated and require the Potomac
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
                        Member chat
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Approved Explorer access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Direct conversations are available to approved Explorer,
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

function EmptyInbox() {
    return (
        <div className="glass-card rounded p-6">
            <h2 className="font-serif text-2xl text-white">
                No conversations yet
            </h2>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                Start with an approved member from discovery. New replies will
                appear in the inbox with unread indicators.
            </p>
        </div>
    );
}

function StartConversationForm({ profiles }: { profiles: Profile[] }) {
    return (
        <section className="glass-card rounded p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                Member discovery
            </p>
            <h2 className="mt-2 font-serif text-2xl text-white">
                Start a Conversation
            </h2>
            {profiles.length ? (
                <form action={createConversation} className="mt-5 space-y-4">
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                            Member
                        </span>
                        <select
                            name="recipient_user_id"
                            required
                            className="mt-2 w-full rounded border border-white/10 bg-potomac-primary px-3 py-3 text-sm text-white"
                        >
                            {profiles.map((profile) => (
                                <option key={profile.user_id} value={profile.user_id}>
                                    {profileLabel(profile)} - {profileDetail(profile)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                            Subject
                        </span>
                        <input
                            name="subject"
                            maxLength={140}
                            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                            placeholder="Optional conversation topic"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                            Message
                        </span>
                        <textarea
                            name="body"
                            required
                            rows={5}
                            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                            placeholder="Write the first message."
                        />
                    </label>
                    <button className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream">
                        Send
                    </button>
                </form>
            ) : (
                <p className="mt-4 text-sm leading-6 text-potomac-cream/65">
                    No discoverable approved members are visible yet. Discovery
                    uses the member profile privacy rules in Supabase.
                </p>
            )}
        </section>
    );
}

function InboxList({
    items,
    selectedConversationId,
}: {
    items: InboxItem[];
    selectedConversationId: string | null;
}) {
    if (!items.length) {
        return <EmptyInbox />;
    }

    return (
        <section className="glass-card rounded p-4">
            <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                Inbox
            </p>
            <div className="mt-3 space-y-2">
                {items.map((item) => {
                    const primaryProfile = item.otherProfiles[0];
                    const selected = item.conversation.id === selectedConversationId;

                    return (
                        <Link
                            key={item.conversation.id}
                            href={`/member/chat?conversation=${item.conversation.id}`}
                            className={
                                selected
                                    ? "block rounded border border-potomac-gold/55 bg-white/10 p-4"
                                    : "block rounded border border-white/10 bg-black/15 p-4 transition hover:border-potomac-gold/45 hover:bg-white/5"
                            }
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-white">
                                        {item.conversation.subject ||
                                            profileLabel(primaryProfile)}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-potomac-cream/55">
                                        {profileDetail(primaryProfile)}
                                    </p>
                                </div>
                                {item.unread ? (
                                    <span className="shrink-0 rounded bg-potomac-gold px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-primary">
                                        New
                                    </span>
                                ) : null}
                            </div>
                            <p className="mt-3 line-clamp-2 text-xs leading-5 text-potomac-cream/60">
                                {item.latestMessage?.body ?? "No messages yet."}
                            </p>
                            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                {formatDateTime(
                                    item.conversation.last_message_at ??
                                        item.latestMessage?.created_at
                                )}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function ConversationDetail({
    item,
    messages,
    profilesByUserId,
    currentUserId,
}: {
    item: InboxItem | null;
    messages: Message[];
    profilesByUserId: Map<string, Profile>;
    currentUserId: string;
}) {
    if (!item) {
        return (
            <section className="glass-card rounded p-6">
                <h2 className="font-serif text-2xl text-white">
                    Select a conversation
                </h2>
                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                    Choose an inbox item or start a new conversation from member
                    discovery.
                </p>
            </section>
        );
    }

    const otherParticipant = item.participants.find(
        (participant) => participant.user_id !== currentUserId
    );
    const otherProfile = otherParticipant
        ? profilesByUserId.get(otherParticipant.user_id)
        : undefined;
    const latestMessage = messages[messages.length - 1] ?? item.latestMessage;

    return (
        <section className="glass-card rounded p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Conversation
                    </p>
                    <h2 className="mt-2 font-serif text-3xl leading-tight text-white">
                        {item.conversation.subject || profileLabel(otherProfile)}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-potomac-cream/60">
                        {profileDetail(otherProfile)} |{" "}
                        {statusLabel(item.conversation.status)}
                    </p>
                </div>
                <form action={markConversationRead}>
                    <input
                        type="hidden"
                        name="conversation_id"
                        value={item.conversation.id}
                    />
                    <input
                        type="hidden"
                        name="last_read_message_id"
                        value={latestMessage?.id ?? ""}
                    />
                    <button className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                        Mark read
                    </button>
                </form>
            </div>

            <div className="mt-6 space-y-4">
                {messages.length ? (
                    messages.map((message) => {
                        const own = message.sender_user_id === currentUserId;
                        const sender = profilesByUserId.get(message.sender_user_id);

                        return (
                            <article
                                key={message.id}
                                className={
                                    own
                                        ? "ml-auto max-w-2xl rounded border border-potomac-gold/25 bg-potomac-gold/10 p-4"
                                        : "max-w-2xl rounded border border-white/10 bg-black/20 p-4"
                                }
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                    <span className="font-bold text-potomac-gold">
                                        {own ? "You" : profileLabel(sender)}
                                    </span>
                                    <span>{formatDateTime(message.created_at)}</span>
                                </div>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/80">
                                    {message.body}
                                </p>
                            </article>
                        );
                    })
                ) : (
                    <p className="text-sm leading-6 text-potomac-cream/65">
                        No visible messages are available in this conversation.
                    </p>
                )}
            </div>

            <form action={sendMessage} className="mt-6 border-t border-white/10 pt-5">
                <input
                    type="hidden"
                    name="conversation_id"
                    value={item.conversation.id}
                />
                <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                        Reply
                    </span>
                    <textarea
                        name="body"
                        required
                        rows={4}
                        className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                        placeholder="Write a reply."
                    />
                </label>
                <button className="mt-3 rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream">
                    Send reply
                </button>
            </form>

            <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-2">
                <form action={reportConversation} className="space-y-3">
                    <input
                        type="hidden"
                        name="conversation_id"
                        value={item.conversation.id}
                    />
                    <input
                        type="hidden"
                        name="message_id"
                        value={latestMessage?.id ?? ""}
                    />
                    <input
                        type="hidden"
                        name="reported_user_id"
                        value={otherParticipant?.user_id ?? ""}
                    />
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                            Report reason
                        </span>
                        <select
                            name="reason"
                            required
                            className="mt-2 w-full rounded border border-white/10 bg-potomac-primary px-3 py-3 text-sm text-white"
                        >
                            <option value="spam">Spam or solicitation</option>
                            <option value="abuse">Abuse or harassment</option>
                            <option value="sensitive_content">
                                Sensitive or controlled content
                            </option>
                            <option value="other">Other moderation issue</option>
                        </select>
                    </label>
                    <textarea
                        name="reporter_note"
                        rows={3}
                        className="w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                        placeholder="Optional note for moderators."
                    />
                    <button className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                        Report
                    </button>
                </form>
                {otherParticipant ? (
                    <form action={blockMember} className="space-y-3">
                        <input
                            type="hidden"
                            name="conversation_id"
                            value={item.conversation.id}
                        />
                        <input
                            type="hidden"
                            name="blocked_user_id"
                            value={otherParticipant.user_id}
                        />
                        <label className="block">
                            <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                                Block note
                            </span>
                            <textarea
                                name="reason"
                                rows={4}
                                className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                                placeholder="Optional private reason."
                            />
                        </label>
                        <button className="rounded border border-red-200/40 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-red-100 transition hover:border-red-100 hover:bg-red-950/30">
                            Block member
                        </button>
                    </form>
                ) : null}
            </div>
        </section>
    );
}

async function loadChatData(
    selectedConversationId: string | null,
    currentUserId: string
) {
    const supabase = await createClient();
    const { data: participantRows, error: participantError } = await supabase
        .from("member_chat_participants")
        .select("conversation_id,user_id,status,last_read_at,muted_until")
        .eq("user_id", currentUserId)
        .eq("status", "active")
        .order("updated_at", { ascending: false });

    if (participantError) {
        throw new Error(participantError.message);
    }

    const ownParticipants = (participantRows ?? []) as Participant[];
    const conversationIds = ownParticipants.map(
        (participant) => participant.conversation_id
    );

    if (!conversationIds.length) {
        const { data: discoverableProfiles, error: profileError } = await supabase
            .from("member_profiles")
            .select("user_id,email,full_name,company,title,base_tier")
            .eq("status", "approved")
            .neq("user_id", currentUserId)
            .order("full_name", { ascending: true })
            .limit(25);

        if (profileError) {
            throw new Error(profileError.message);
        }

        return {
            inboxItems: [] as InboxItem[],
            selectedItem: null,
            selectedMessages: [] as Message[],
            profilesByUserId: new Map<string, Profile>(),
            discoverableProfiles: (discoverableProfiles ?? []) as Profile[],
        };
    }

    const [
        conversationsResult,
        allParticipantsResult,
        recentMessagesResult,
        selectedMessagesResult,
    ] = await Promise.all([
        supabase
            .from("member_chat_conversations")
            .select("id,status,subject,last_message_at,created_at")
            .in("id", conversationIds),
        supabase
            .from("member_chat_participants")
            .select("conversation_id,user_id,status,last_read_at,muted_until")
            .in("conversation_id", conversationIds),
        supabase
            .from("member_chat_messages")
            .select("id,conversation_id,sender_user_id,body,status,created_at")
            .in("conversation_id", conversationIds)
            .eq("status", "visible")
            .order("created_at", { ascending: false })
            .limit(100),
        selectedConversationId
            ? supabase
                  .from("member_chat_messages")
                  .select("id,conversation_id,sender_user_id,body,status,created_at")
                  .eq("conversation_id", selectedConversationId)
                  .eq("status", "visible")
                  .order("created_at", { ascending: true })
                  .limit(100)
            : Promise.resolve({ data: [], error: null }),
    ]);

    for (const result of [
        conversationsResult,
        allParticipantsResult,
        recentMessagesResult,
        selectedMessagesResult,
    ]) {
        if (result.error) {
            throw new Error(result.error.message);
        }
    }

    const conversations = (conversationsResult.data ?? []) as Conversation[];
    const allParticipants = (allParticipantsResult.data ?? []) as Participant[];
    const recentMessages = (recentMessagesResult.data ?? []) as Message[];
    const selectedMessages = (selectedMessagesResult.data ?? []) as Message[];
    const profileUserIds = Array.from(
        new Set(allParticipants.map((participant) => participant.user_id))
    );
    const { data: profileData, error: profileError } = await supabase
        .from("member_profiles")
        .select("user_id,email,full_name,company,title,base_tier")
        .in("user_id", profileUserIds);

    if (profileError) {
        throw new Error(profileError.message);
    }

    const { data: discoverableProfiles, error: discoverableError } = await supabase
        .from("member_profiles")
        .select("user_id,email,full_name,company,title,base_tier")
        .eq("status", "approved")
        .neq("user_id", currentUserId)
        .order("full_name", { ascending: true })
        .limit(25);

    if (discoverableError) {
        throw new Error(discoverableError.message);
    }

    const profilesByUserId = new Map(
        ((profileData ?? []) as Profile[]).map((profile) => [
            profile.user_id,
            profile,
        ])
    );
    const recentByConversation = new Map<string, Message>();

    for (const message of recentMessages) {
        if (!recentByConversation.has(message.conversation_id)) {
            recentByConversation.set(message.conversation_id, message);
        }
    }

    const participantsByConversation = new Map<string, Participant[]>();

    for (const participant of allParticipants) {
        const list = participantsByConversation.get(participant.conversation_id) ?? [];
        list.push(participant);
        participantsByConversation.set(participant.conversation_id, list);
    }

    const ownByConversation = new Map(
        ownParticipants.map((participant) => [participant.conversation_id, participant])
    );
    const inboxItems = conversations
        .map((conversation) => {
            const participants =
                participantsByConversation.get(conversation.id) ?? [];
            const ownParticipant = ownByConversation.get(conversation.id);
            const latestMessage = recentByConversation.get(conversation.id) ?? null;
            const readAt = ownParticipant?.last_read_at
                ? new Date(ownParticipant.last_read_at).getTime()
                : 0;
            const latestAt = latestMessage
                ? new Date(latestMessage.created_at).getTime()
                : 0;

            return {
                conversation,
                participants,
                otherProfiles: participants
                    .filter((participant) => participant.user_id !== currentUserId)
                    .map((participant) => profilesByUserId.get(participant.user_id))
                    .filter((profile): profile is Profile => Boolean(profile)),
                latestMessage,
                unread: Boolean(
                    latestMessage &&
                        latestMessage.sender_user_id !== currentUserId &&
                        latestAt > readAt
                ),
            };
        })
        .sort((a, b) => {
            const aTime = new Date(
                a.conversation.last_message_at ?? a.conversation.created_at
            ).getTime();
            const bTime = new Date(
                b.conversation.last_message_at ?? b.conversation.created_at
            ).getTime();

            return bTime - aTime;
        });
    const selectedItem =
        inboxItems.find((item) => item.conversation.id === selectedConversationId) ??
        inboxItems[0] ??
        null;

    return {
        inboxItems,
        selectedItem,
        selectedMessages:
            selectedItem && selectedItem.conversation.id === selectedConversationId
                ? selectedMessages
                : selectedItem?.latestMessage
                  ? [selectedItem.latestMessage]
                  : [],
        profilesByUserId,
        discoverableProfiles: (discoverableProfiles ?? []) as Profile[],
    };
}

export default async function MemberChatPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getMemberChatAccessContext({
        supabase,
        nextPath: "/member/chat",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canUseMemberChat || !access.userId) {
        return <LockedGate />;
    }

    const params = (await searchParams) ?? {};
    const conversationParam = params.conversation;
    const selectedConversationId = Array.isArray(conversationParam)
        ? conversationParam[0] ?? null
        : conversationParam ?? null;
    const {
        inboxItems,
        selectedItem,
        selectedMessages,
        profilesByUserId,
        discoverableProfiles,
    } = await loadChatData(selectedConversationId, access.userId);
    const unreadCount = inboxItems.filter((item) => item.unread).length;

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)_22rem]">
                    <aside className="space-y-6">
                        <div className="glass-card rounded p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                Direct messages
                            </p>
                            <h1 className="mt-3 font-serif text-3xl leading-tight text-white">
                                Member Chat
                            </h1>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="border-l border-potomac-gold/35 pl-3">
                                    <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        Inbox
                                    </dt>
                                    <dd className="mt-1 font-semibold text-white">
                                        {inboxItems.length}
                                    </dd>
                                </div>
                                <div className="border-l border-potomac-gold/35 pl-3">
                                    <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        Unread
                                    </dt>
                                    <dd className="mt-1 font-semibold text-white">
                                        {unreadCount}
                                    </dd>
                                </div>
                            </dl>
                            <Link
                                href="/member"
                                className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Workspace
                            </Link>
                        </div>
                        <InboxList
                            items={inboxItems}
                            selectedConversationId={
                                selectedItem?.conversation.id ?? null
                            }
                        />
                    </aside>

                    <ConversationDetail
                        item={selectedItem}
                        messages={selectedMessages}
                        profilesByUserId={profilesByUserId}
                        currentUserId={access.userId}
                    />

                    <StartConversationForm profiles={discoverableProfiles} />
                </div>
            </div>
        </section>
    );
}
