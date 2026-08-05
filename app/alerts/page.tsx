import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberAlertsAccessContext } from "../../lib/auth/member-alerts";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import {
    fallbackAlertTierLimits,
    loadMemberAlertsDashboard,
    type AlertTier,
    type MemberAlertDeliveryEvent,
    type MemberAlertFeedItem,
    type MemberAlertRule,
    type MemberAlertsDashboard,
} from "../_data/memberAlerts";
import {
    objectKindLabel,
    savedSearchFrequencies,
    savedWorkObjectKinds,
} from "../_data/savedWork";
import { archiveAlertRule, createAlertRule, markAlertRead } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Lunar Alerts",
    description:
        "Lunar intelligence alerts route for watched companies, missions, procurements, regulatory records, datasets, events, and marketplace records.",
    alternates: {
        canonical: "/alerts",
    },
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
});

const inputClassName =
    "min-h-11 rounded border border-white/15 bg-potomac-primary/80 px-3 py-2 text-sm text-white outline-none transition placeholder:text-potomac-cream/40 focus:border-potomac-gold";

const checkboxClassName =
    "h-4 w-4 rounded border-white/20 bg-potomac-primary text-potomac-gold";

function formatDateTime(value: string | null | undefined) {
    if (!value) return "Not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not set";

    return dateTimeFormatter.format(date);
}

function statusLabel(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function tierLabel(tier: AlertTier) {
    if (tier === "command") return "Cabeus Council";
    if (tier === "scout") return "Scout";
    if (tier === "staff") return "Staff";
    return "Explorer";
}

function freshnessLabel(item: MemberAlertFeedItem) {
    if (!item.staleAt) return "Freshness tracked";

    const staleAt = new Date(item.staleAt);

    if (Number.isNaN(staleAt.getTime())) return "Freshness tracked";

    return staleAt.getTime() <= Date.now() ? "Stale" : "Fresh";
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                {label}
            </span>
            {children}
        </label>
    );
}

function PublicPreview() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Alerts center
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                        Lunar Alerts
                    </h1>
                    <p className="mt-5 text-sm leading-6 text-potomac-cream/70">
                        Sign in to see unread alert badges, watched-object
                        changes, stale source warnings, email delivery status,
                        and tier-aware notification limits. Explorer accounts
                        can read feed notices; Scout and Cabeus Council can manage
                        active alert rules.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/auth/login?next=/alerts"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Compare tiers
                        </Link>
                    </div>
                </div>
                <TierLimitsPanel currentTier="explorer" limits={fallbackAlertTierLimits} />
            </div>
        </section>
    );
}

function StatCard({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className="border-l border-potomac-gold/35 pl-4">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                {label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
            <dd className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                {detail}
            </dd>
        </div>
    );
}

function TierLimitsPanel({
    currentTier,
    limits,
}: {
    currentTier: AlertTier;
    limits: MemberAlertsDashboard["tierLimits"];
}) {
    return (
        <section className="mt-10 grid gap-4 md:grid-cols-3">
            {limits
                .filter((limit) => limit.tier !== "staff")
                .map((limit) => (
                    <article
                        key={limit.tier}
                        className={`rounded border p-5 ${
                            limit.tier === currentTier
                                ? "border-potomac-gold/60 bg-potomac-gold/10"
                                : "border-white/10 bg-white/5"
                        }`}
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            {tierLabel(limit.tier)}
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-white">
                            {limit.maxActiveRules} rules
                        </p>
                        <p className="mt-2 text-xs leading-5 text-potomac-cream/60">
                            {limit.supportsEmail
                                ? `${limit.maxEmailDeliveriesPerDay} email deliveries per day`
                                : "In-app feed only"}
                        </p>
                        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/45">
                            {limit.supportsWebhooks ? "Webhook hooks" : "No webhooks"} |{" "}
                            {limit.supportsCommandIntelligence
                                ? "Cabeus Council intelligence"
                                : "Standard intelligence"}
                        </p>
                    </article>
                ))}
        </section>
    );
}

function AlertRuleForm({ canManage }: { canManage: boolean }) {
    if (!canManage) {
        return (
            <section className="glass-card rounded p-5">
                <h2 className="font-serif text-2xl text-white">
                    Alert Rule Builder
                </h2>
                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                    Explorer accounts can read alert feed notices. Scout and
                    Cabeus Council accounts can create watched-object, saved-search,
                    stale-data, and Cabeus Council intelligence alert rules.
                </p>
                <Link
                    href="/pricing"
                    className="mt-5 inline-flex rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Upgrade options
                </Link>
            </section>
        );
    }

    return (
        <form action={createAlertRule} className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">Alert Rule Builder</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Rule name">
                    <input
                        name="rule_name"
                        required
                        maxLength={120}
                        placeholder="CLPS procurement changes"
                        className={inputClassName}
                    />
                </Field>
                <Field label="Trigger">
                    <select name="trigger_kind" className={inputClassName}>
                        <option value="watched_object_changed" className="bg-potomac-primary text-white">
                            Watched object changed
                        </option>
                        <option value="saved_search_match" className="bg-potomac-primary text-white">
                            Saved search match
                        </option>
                        <option value="freshness_stale" className="bg-potomac-primary text-white">
                            Freshness stale
                        </option>
                        <option value="platform_event" className="bg-potomac-primary text-white">
                            Platform event
                        </option>
                        <option value="command_intelligence" className="bg-potomac-primary text-white">
                            Cabeus Council intelligence
                        </option>
                    </select>
                </Field>
                <Field label="Object type">
                    <select name="object_kind" className={inputClassName}>
                        <option value="" className="bg-potomac-primary text-white">
                            Platform or saved search
                        </option>
                        {savedWorkObjectKinds.map((kind) => (
                            <option
                                key={kind.value}
                                value={kind.value}
                                className="bg-potomac-primary text-white"
                            >
                                {kind.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Object slug">
                    <input
                        name="object_slug"
                        maxLength={140}
                        placeholder="clps-instrument-rfi"
                        className={inputClassName}
                    />
                </Field>
                <Field label="Severity">
                    <select name="severity" defaultValue="watch" className={inputClassName}>
                        <option value="info" className="bg-potomac-primary text-white">
                            Info
                        </option>
                        <option value="watch" className="bg-potomac-primary text-white">
                            Watch
                        </option>
                        <option value="urgent" className="bg-potomac-primary text-white">
                            Urgent
                        </option>
                    </select>
                </Field>
                <Field label="Frequency">
                    <select name="frequency" defaultValue="daily" className={inputClassName}>
                        {savedSearchFrequencies.map((frequency) => (
                            <option
                                key={frequency.value}
                                value={frequency.value}
                                className="bg-potomac-primary text-white"
                            >
                                {frequency.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Stale after hours">
                    <input
                        name="stale_after_hours"
                        type="number"
                        min={1}
                        defaultValue={24}
                        className={inputClassName}
                    />
                </Field>
                <Field label="Daily limit">
                    <input
                        name="per_day_limit"
                        type="number"
                        min={0}
                        defaultValue={5}
                        className={inputClassName}
                    />
                </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-5 text-sm text-potomac-cream/65">
                <label className="inline-flex items-center gap-2">
                    <input
                        name="in_app_enabled"
                        type="checkbox"
                        defaultChecked
                        className={checkboxClassName}
                    />
                    In-app feed
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        name="email_enabled"
                        type="checkbox"
                        className={checkboxClassName}
                    />
                    Email hook
                </label>
            </div>
            <button
                type="submit"
                className="mt-5 rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
            >
                Create alert rule
            </button>
        </form>
    );
}

function RulesPanel({ rules }: { rules: MemberAlertRule[] }) {
    return (
        <section className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">Active Rules</h2>
            <div className="mt-5 grid gap-3">
                {rules.length ? (
                    rules.map((rule) => (
                        <article key={rule.id} className="rounded border border-white/10 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                        {statusLabel(rule.triggerKind)}
                                    </p>
                                    <h3 className="mt-1 text-sm font-bold text-white">
                                        {rule.ruleName}
                                    </h3>
                                    <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                                        {objectKindLabel(rule.objectKind)} |{" "}
                                        {rule.objectSlug ?? "All"} |{" "}
                                        {statusLabel(rule.frequency)} |{" "}
                                        {rule.emailEnabled ? "Email on" : "Email off"}
                                    </p>
                                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                        {rule.perDayLimit}/day | Last triggered{" "}
                                        {formatDateTime(rule.lastTriggeredAt)}
                                    </p>
                                </div>
                                <form action={archiveAlertRule}>
                                    <input
                                        type="hidden"
                                        name="rule_id"
                                        value={rule.id}
                                    />
                                    <button
                                        type="submit"
                                        className="rounded border border-white/15 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-cream/60 transition hover:border-potomac-gold hover:text-potomac-gold"
                                    >
                                        Archive
                                    </button>
                                </form>
                            </div>
                        </article>
                    ))
                ) : (
                    <p className="text-sm leading-6 text-potomac-cream/60">
                        No alert rules are active yet.
                    </p>
                )}
            </div>
        </section>
    );
}

function FeedPanel({ feedItems }: { feedItems: MemberAlertFeedItem[] }) {
    return (
        <section>
            <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Alert feed
                </p>
                <h2 className="mt-2 font-serif text-3xl text-white">
                    Latest Notices
                </h2>
            </div>
            <div className="mt-6 grid gap-4">
                {feedItems.length ? (
                    feedItems.map((item) => (
                        <article key={item.id} className="glass-card rounded p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="flex flex-wrap gap-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/45">
                                        <span className="text-potomac-gold">
                                            {statusLabel(item.severity)}
                                        </span>
                                        <span>{statusLabel(item.alertKind)}</span>
                                        <span>{freshnessLabel(item)}</span>
                                        <span>{item.isRead ? "Read" : "Unread"}</span>
                                    </div>
                                    <h3 className="mt-2 font-serif text-2xl text-white">
                                        {item.headline}
                                    </h3>
                                    <Link
                                        href={item.routePath}
                                        className="mt-2 inline-flex text-sm font-bold text-potomac-gold transition hover:text-potomac-cream"
                                    >
                                        {item.objectTitle}
                                    </Link>
                                    {item.summary ? (
                                        <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                            {item.summary}
                                        </p>
                                    ) : null}
                                    <p className="mt-3 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                        {item.sourceLabel ?? "Source pending"} | Fresh{" "}
                                        {formatDateTime(item.freshnessAt)} | Stale{" "}
                                        {formatDateTime(item.staleAt)}
                                    </p>
                                </div>
                                {!item.isRead ? (
                                    <form action={markAlertRead}>
                                        <input
                                            type="hidden"
                                            name="alert_id"
                                            value={item.id}
                                        />
                                        <button
                                            type="submit"
                                            className="rounded border border-potomac-gold/50 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                        >
                                            Mark read
                                        </button>
                                    </form>
                                ) : null}
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="glass-card rounded p-6 text-sm leading-6 text-potomac-cream/65">
                        No alert feed items are visible yet.
                    </div>
                )}
            </div>
        </section>
    );
}

function DeliveryPanel({ events }: { events: MemberAlertDeliveryEvent[] }) {
    return (
        <section className="glass-card rounded p-5">
            <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif text-2xl text-white">Delivery Audit</h2>
                <Link
                    href="/member/saved-work#notification-preferences"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-potomac-gold hover:text-potomac-cream"
                >
                    Preferences
                </Link>
            </div>
            <div className="mt-5 grid gap-3">
                {events.length ? (
                    events.map((event) => (
                        <div key={event.id} className="rounded border border-white/10 p-4">
                            <p className="text-sm font-bold text-white">
                                {statusLabel(event.channel)} {statusLabel(event.deliveryStatus)}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                                Attempts {event.attemptCount} | Scheduled{" "}
                                {formatDateTime(event.scheduledAt)} | Sent{" "}
                                {formatDateTime(event.sentAt)}
                            </p>
                            {event.lastError ? (
                                <p className="mt-2 text-xs leading-5 text-red-100">
                                    {event.lastError}
                                </p>
                            ) : null}
                        </div>
                    ))
                ) : (
                    <p className="text-sm leading-6 text-potomac-cream/60">
                        Email and in-app delivery events will appear here after
                        alert jobs run.
                    </p>
                )}
            </div>
        </section>
    );
}

function LoadWarning({ dashboard }: { dashboard: MemberAlertsDashboard }) {
    if (!dashboard.loadError) return null;

    return (
        <div className="mt-8 rounded border border-potomac-gold/35 bg-potomac-gold/10 p-4 text-sm leading-6 text-potomac-cream/75">
            Alerts data could not be read from Supabase: {dashboard.loadError}.
            Fallback records are shown until the Task 067 migration is applied.
        </div>
    );
}

export default async function AlertsPage() {
    if (!hasPotomacSupabasePublicConfig()) {
        return <PublicPreview />;
    }

    const supabase = await createClient();
    const access = await getMemberAlertsAccessContext({
        supabase,
        nextPath: "/alerts",
    });

    if (access.state === "signed_out" || access.state === "email_unverified" || !access.userId) {
        redirect(access.loginHref);
    }
    if (access.state === "profile_incomplete" && access.profileHref) {
        redirect(access.profileHref);
    }

    const dashboard = await loadMemberAlertsDashboard({
        supabase,
        userId: access.userId,
    });
    const unreadCount = dashboard.feedItems.filter((item) => !item.isRead).length;
    const urgentCount = dashboard.feedItems.filter(
        (item) => item.severity === "urgent"
    ).length;
    const staleCount = dashboard.feedItems.filter(
        (item) =>
            item.staleAt &&
            !Number.isNaN(new Date(item.staleAt).getTime()) &&
            new Date(item.staleAt).getTime() <= Date.now()
    ).length;

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Member notifications
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Alerts Center
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Track unread notices, watched lunar intelligence
                            changes, stale source warnings, email delivery
                            hooks, and tier-aware alert limits.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Current tier
                        </p>
                        <h2 className="mt-3 font-serif text-2xl leading-tight text-white">
                            {tierLabel(access.tier)}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            Explorer can read feed notices. Scout and Cabeus Council
                            can manage rules, email hooks, stale-data alerts,
                            and higher delivery limits.
                        </p>
                        <Link
                            href="/member/saved-work"
                            className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Saved work
                        </Link>
                    </aside>
                </div>

                <LoadWarning dashboard={dashboard} />

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Unread"
                        value={String(unreadCount)}
                        detail="Feed badges"
                    />
                    <StatCard
                        label="Urgent"
                        value={String(urgentCount)}
                        detail="High-priority notices"
                    />
                    <StatCard
                        label="Stale"
                        value={String(staleCount)}
                        detail="Freshness warnings"
                    />
                    <StatCard
                        label="Rules"
                        value={String(dashboard.rules.length)}
                        detail={`${dashboard.sourceMode} source mode`}
                    />
                </dl>

                <TierLimitsPanel
                    currentTier={access.tier}
                    limits={dashboard.tierLimits}
                />

                <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="grid h-fit gap-6">
                        <AlertRuleForm canManage={access.canManageAlertRules} />
                        <RulesPanel rules={dashboard.rules} />
                        <DeliveryPanel events={dashboard.deliveryEvents} />
                    </div>
                    <FeedPanel feedItems={dashboard.feedItems} />
                </div>
            </div>
        </section>
    );
}
