import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSavedWorkAccessContext } from "../../../lib/auth/saved-work";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import {
    archiveSavedSearch,
    archiveWatchlist,
    archiveWatchlistItem,
    createWatchlist,
    saveDashboardDefaults,
    saveNotificationPreference,
    saveReadingListItem,
    saveSearch,
    saveWatchlistItem,
    updateReadingListItem,
} from "./actions";
import {
    dashboardModuleOptions,
    loadSavedWorkDashboard,
    objectKindLabel,
    savedSearchFrequencies,
    savedWorkObjectKinds,
    type MemberDashboardPreference,
    type MemberNotificationPreference,
    type MemberReadingListItem,
    type MemberSavedSearch,
    type MemberWatchlist,
    type SavedWorkDashboard,
} from "../../_data/savedWork";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Saved Work",
    description:
        "Scout and Command watchlists, saved searches, reading list, notifications, and terminal defaults.",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
});

function formatDate(value: string | null | undefined) {
    if (!value) return "Not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not set";

    return dateFormatter.format(date);
}

function statusLabel(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
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

const inputClassName =
    "min-h-11 rounded border border-white/15 bg-potomac-primary/80 px-3 py-2 text-sm text-white outline-none transition placeholder:text-potomac-cream/40 focus:border-potomac-gold";

const checkboxClassName =
    "h-4 w-4 rounded border-white/20 bg-potomac-primary text-potomac-gold";

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Saved work
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Watchlists, saved searches, reading-list items, and
                        preference writes use paid-member Supabase tables. Set
                        the Cabeus Explorer public environment variables and sign in
                        with Scout or Command access.
                    </p>
                    <Link
                        href="/pricing"
                        className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Compare tiers
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
                        Saved work
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Scout or Command access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Explorer members can read public and eligible member
                        intelligence, while watchlists, saved searches,
                        reading-list controls, and notification preferences are
                        paid workspace features.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/member"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Upgrade path
                        </Link>
                    </div>
                </div>
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

function CreateWatchlistForm() {
    return (
        <form action={createWatchlist} className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">New Watchlist</h2>
            <div className="mt-4 grid gap-4">
                <Field label="Name">
                    <input
                        name="name"
                        required
                        maxLength={80}
                        placeholder="CLPS suppliers"
                        className={inputClassName}
                    />
                </Field>
                <Field label="Description">
                    <textarea
                        name="description"
                        maxLength={500}
                        rows={3}
                        placeholder="Companies, missions, and opportunities to monitor."
                        className={inputClassName}
                    />
                </Field>
                <Field label="Color label">
                    <input
                        name="color_label"
                        maxLength={40}
                        placeholder="Gold"
                        className={inputClassName}
                    />
                </Field>
            </div>
            <button
                type="submit"
                className="mt-5 rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
            >
                Create watchlist
            </button>
        </form>
    );
}

function SaveWatchlistItemForm({ watchlists }: { watchlists: MemberWatchlist[] }) {
    const disabled = watchlists.length === 0;

    return (
        <form action={saveWatchlistItem} className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">Save To Watchlist</h2>
            {disabled ? (
                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                    Create a watchlist before adding monitored records.
                </p>
            ) : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Watchlist">
                    <select
                        name="watchlist_id"
                        required
                        disabled={disabled}
                        className={inputClassName}
                    >
                        {watchlists.map((watchlist) => (
                            <option
                                key={watchlist.id}
                                value={watchlist.id}
                                className="bg-potomac-primary text-white"
                            >
                                {watchlist.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Object type">
                    <select name="object_kind" required className={inputClassName}>
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
                <Field label="Title">
                    <input
                        name="object_title"
                        required
                        maxLength={180}
                        placeholder="Firefly Blue Ghost"
                        className={inputClassName}
                    />
                </Field>
                <Field label="Slug">
                    <input
                        name="object_slug"
                        required
                        maxLength={120}
                        placeholder="firefly-blue-ghost"
                        className={inputClassName}
                    />
                </Field>
                <Field label="Route">
                    <input
                        name="object_route_path"
                        required
                        placeholder="/companies/firefly-aerospace"
                        className={inputClassName}
                    />
                </Field>
                <Field label="Watch reason">
                    <input
                        name="watch_reason"
                        maxLength={500}
                        placeholder="Supplier signal for CLPS follow-up"
                        className={inputClassName}
                    />
                </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-5 text-sm text-potomac-cream/65">
                <label className="inline-flex items-center gap-2">
                    <input
                        name="notify_in_app"
                        type="checkbox"
                        defaultChecked
                        className={checkboxClassName}
                    />
                    In-app alerts
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        name="notify_email"
                        type="checkbox"
                        className={checkboxClassName}
                    />
                    Email alerts
                </label>
            </div>
            <button
                type="submit"
                disabled={disabled}
                className="mt-5 rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-45"
            >
                Save record
            </button>
        </form>
    );
}

function WatchlistsPanel({ watchlists }: { watchlists: MemberWatchlist[] }) {
    return (
        <section>
            <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Monitoring
                </p>
                <h2 className="mt-2 font-serif text-3xl text-white">
                    Watchlists
                </h2>
            </div>
            <div className="mt-6 grid gap-5">
                {watchlists.length ? (
                    watchlists.map((watchlist) => (
                        <article key={watchlist.id} className="glass-card rounded p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="flex flex-wrap gap-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {watchlist.isDefault ? (
                                            <span className="text-potomac-gold">
                                                Default
                                            </span>
                                        ) : null}
                                        <span>{statusLabel(watchlist.status)}</span>
                                        <span>{watchlist.colorLabel ?? "No color"}</span>
                                    </div>
                                    <h3 className="mt-2 font-serif text-2xl text-white">
                                        {watchlist.name}
                                    </h3>
                                    {watchlist.description ? (
                                        <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                                            {watchlist.description}
                                        </p>
                                    ) : null}
                                </div>
                                <form action={archiveWatchlist}>
                                    <input
                                        type="hidden"
                                        name="watchlist_id"
                                        value={watchlist.id}
                                    />
                                    <button
                                        type="submit"
                                        className="rounded border border-white/15 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-cream/60 transition hover:border-potomac-gold hover:text-potomac-gold"
                                    >
                                        Archive
                                    </button>
                                </form>
                            </div>
                            <div className="mt-5 grid gap-3">
                                {watchlist.items.length ? (
                                    watchlist.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded border border-white/10 p-4"
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                        {objectKindLabel(item.objectKind)}
                                                    </p>
                                                    <Link
                                                        href={item.objectRoutePath}
                                                        className="mt-1 block text-sm font-bold text-white transition hover:text-potomac-gold"
                                                    >
                                                        {item.objectTitle}
                                                    </Link>
                                                    {item.watchReason ? (
                                                        <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                                                            {item.watchReason}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <form action={archiveWatchlistItem}>
                                                    <input
                                                        type="hidden"
                                                        name="item_id"
                                                        value={item.id}
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="rounded border border-white/15 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-cream/60 transition hover:border-potomac-gold hover:text-potomac-gold"
                                                    >
                                                        Remove
                                                    </button>
                                                </form>
                                            </div>
                                            <p className="mt-3 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                                {item.notifyInApp ? "In-app on" : "In-app off"} |{" "}
                                                {item.notifyEmail ? "Email on" : "Email off"} |{" "}
                                                Updated {formatDate(item.updatedAt)}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="rounded border border-white/10 p-4 text-sm leading-6 text-potomac-cream/60">
                                        No records are saved to this watchlist yet.
                                    </p>
                                )}
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="glass-card rounded p-6 text-sm leading-6 text-potomac-cream/65">
                        No watchlists yet. Create one to start monitoring lunar
                        companies, missions, procurement, regulatory, event,
                        dataset, and marketplace records.
                    </div>
                )}
            </div>
        </section>
    );
}

function SavedSearchesPanel({ searches }: { searches: MemberSavedSearch[] }) {
    return (
        <section className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">Saved Searches</h2>
            <form action={saveSearch} className="mt-4 grid gap-4">
                <Field label="Name">
                    <input
                        name="name"
                        required
                        maxLength={80}
                        placeholder="CLPS awards"
                        className={inputClassName}
                    />
                </Field>
                <Field label="Query">
                    <input
                        name="query"
                        maxLength={180}
                        placeholder="CLPS award"
                        className={inputClassName}
                    />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Scope">
                        <select name="scope" className={inputClassName}>
                            <option value="" className="bg-potomac-primary text-white">
                                All
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
                    <Field label="Alert frequency">
                        <select
                            name="alert_frequency"
                            defaultValue="daily"
                            className={inputClassName}
                        >
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
                </div>
                <button
                    type="submit"
                    className="w-fit rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Save search
                </button>
            </form>
            <div className="mt-5 grid gap-3">
                {searches.length ? (
                    searches.map((search) => (
                        <div key={search.id} className="rounded border border-white/10 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <Link
                                        href={search.routePath}
                                        className="text-sm font-bold text-white transition hover:text-potomac-gold"
                                    >
                                        {search.name}
                                    </Link>
                                    <p className="mt-1 text-xs leading-5 text-potomac-cream/55">
                                        {search.query || "No query"} |{" "}
                                        {objectKindLabel(search.scope)} |{" "}
                                        {statusLabel(search.alertFrequency)}
                                    </p>
                                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                        {search.lastResultCount ?? 0} last results |{" "}
                                        {search.lastNewResultCount ?? 0} new
                                    </p>
                                </div>
                                <form action={archiveSavedSearch}>
                                    <input
                                        type="hidden"
                                        name="search_id"
                                        value={search.id}
                                    />
                                    <button
                                        type="submit"
                                        className="rounded border border-white/15 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-cream/60 transition hover:border-potomac-gold hover:text-potomac-gold"
                                    >
                                        Remove
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm leading-6 text-potomac-cream/60">
                        No saved searches yet.
                    </p>
                )}
            </div>
        </section>
    );
}

function ReadingListPanel({ items }: { items: MemberReadingListItem[] }) {
    return (
        <section className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">Reading List</h2>
            <form action={saveReadingListItem} className="mt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Type">
                        <select name="object_kind" className={inputClassName}>
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
                    <Field label="Title">
                        <input
                            name="title"
                            required
                            maxLength={180}
                            placeholder="VIPC grant brief"
                            className={inputClassName}
                        />
                    </Field>
                    <Field label="Slug">
                        <input
                            name="object_slug"
                            required
                            maxLength={120}
                            placeholder="vipc-grant-winner"
                            className={inputClassName}
                        />
                    </Field>
                    <Field label="Route">
                        <input
                            name="route_path"
                            required
                            placeholder="/news/vipc-grant-winner"
                            className={inputClassName}
                        />
                    </Field>
                </div>
                <Field label="Summary">
                    <textarea
                        name="summary"
                        rows={3}
                        maxLength={500}
                        placeholder="Why this item should be revisited."
                        className={inputClassName}
                    />
                </Field>
                <button
                    type="submit"
                    className="w-fit rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Add item
                </button>
            </form>
            <div className="mt-5 grid gap-3">
                {items.length ? (
                    items.map((item) => (
                        <article key={item.id} className="rounded border border-white/10 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                        {objectKindLabel(item.objectKind)}
                                    </p>
                                    <Link
                                        href={item.routePath}
                                        className="mt-1 block text-sm font-bold text-white transition hover:text-potomac-gold"
                                    >
                                        {item.title}
                                    </Link>
                                    {item.summary ? (
                                        <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                                            {item.summary}
                                        </p>
                                    ) : null}
                                    <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                        {item.isRead ? "Read" : "Unread"} | Saved{" "}
                                        {formatDate(item.savedAt)}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {!item.isRead ? (
                                        <form action={updateReadingListItem}>
                                            <input
                                                type="hidden"
                                                name="item_id"
                                                value={item.id}
                                            />
                                            <input
                                                type="hidden"
                                                name="reading_action"
                                                value="read"
                                            />
                                            <button
                                                type="submit"
                                                className="rounded border border-white/15 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-cream/60 transition hover:border-potomac-gold hover:text-potomac-gold"
                                            >
                                                Mark read
                                            </button>
                                        </form>
                                    ) : null}
                                    <form action={updateReadingListItem}>
                                        <input
                                            type="hidden"
                                            name="item_id"
                                            value={item.id}
                                        />
                                        <input
                                            type="hidden"
                                            name="reading_action"
                                            value="archive"
                                        />
                                        <button
                                            type="submit"
                                            className="rounded border border-white/15 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-cream/60 transition hover:border-potomac-gold hover:text-potomac-gold"
                                        >
                                            Archive
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </article>
                    ))
                ) : (
                    <p className="text-sm leading-6 text-potomac-cream/60">
                        No reading-list items yet.
                    </p>
                )}
            </div>
        </section>
    );
}

function PreferencesPanel({
    preferences,
    dashboardPreference,
}: {
    preferences: MemberNotificationPreference[];
    dashboardPreference: MemberDashboardPreference | null;
}) {
    const pinnedModules = new Set(dashboardPreference?.pinnedModuleKeys ?? []);
    const hiddenModules = new Set(dashboardPreference?.hiddenModuleKeys ?? []);

    return (
        <section className="grid gap-5 lg:grid-cols-2">
            <form action={saveNotificationPreference} className="glass-card rounded p-5">
                <h2 className="font-serif text-2xl text-white">
                    Notification Settings
                </h2>
                <div className="mt-4 grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Channel">
                            <select name="channel" className={inputClassName}>
                                <option value="in_app" className="bg-potomac-primary text-white">
                                    In-app
                                </option>
                                <option value="email" className="bg-potomac-primary text-white">
                                    Email
                                </option>
                            </select>
                        </Field>
                        <Field label="Object type">
                            <select name="object_kind" className={inputClassName}>
                                <option value="" className="bg-potomac-primary text-white">
                                    All watched work
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
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Frequency">
                            <select
                                name="frequency"
                                defaultValue="daily"
                                className={inputClassName}
                            >
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
                        <Field label="Timezone">
                            <input
                                name="timezone"
                                defaultValue="America/New_York"
                                className={inputClassName}
                            />
                        </Field>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-potomac-cream/65">
                        <input
                            name="enabled"
                            type="checkbox"
                            defaultChecked
                            className={checkboxClassName}
                        />
                        Enabled
                    </label>
                </div>
                <button
                    type="submit"
                    className="mt-5 rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Save preference
                </button>
                <div className="mt-5 grid gap-2">
                    {preferences.length ? (
                        preferences.map((preference) => (
                            <p
                                key={preference.id}
                                className="rounded border border-white/10 px-3 py-2 text-xs leading-5 text-potomac-cream/60"
                            >
                                {statusLabel(preference.channel)} |{" "}
                                {objectKindLabel(preference.objectKind)} |{" "}
                                {preference.enabled ? "Enabled" : "Disabled"} |{" "}
                                {statusLabel(preference.frequency)}
                            </p>
                        ))
                    ) : (
                        <p className="text-sm leading-6 text-potomac-cream/60">
                            No notification preferences are saved yet.
                        </p>
                    )}
                </div>
            </form>

            <form action={saveDashboardDefaults} className="glass-card rounded p-5">
                <h2 className="font-serif text-2xl text-white">
                    Dashboard Defaults
                </h2>
                <div className="mt-4 grid gap-4">
                    <Field label="Default scope">
                        <select name="default_scope" className={inputClassName}>
                            <option value="" className="bg-potomac-primary text-white">
                                All
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
                    <Field label="Density">
                        <select name="density" className={inputClassName}>
                            <option value="compact" className="bg-potomac-primary text-white">
                                Compact
                            </option>
                            <option value="comfortable" className="bg-potomac-primary text-white">
                                Comfortable
                            </option>
                        </select>
                    </Field>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                            Pinned modules
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {dashboardModuleOptions.map((module) => (
                                <label
                                    key={`pin-${module.value}`}
                                    className="inline-flex items-center gap-2 text-sm text-potomac-cream/65"
                                >
                                    <input
                                        name="pinned_module_keys"
                                        type="checkbox"
                                        value={module.value}
                                        defaultChecked={pinnedModules.has(module.value)}
                                        className={checkboxClassName}
                                    />
                                    {module.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                            Hidden modules
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {dashboardModuleOptions.map((module) => (
                                <label
                                    key={`hide-${module.value}`}
                                    className="inline-flex items-center gap-2 text-sm text-potomac-cream/65"
                                >
                                    <input
                                        name="hidden_module_keys"
                                        type="checkbox"
                                        value={module.value}
                                        defaultChecked={hiddenModules.has(module.value)}
                                        className={checkboxClassName}
                                    />
                                    {module.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <button
                    type="submit"
                    className="mt-5 rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Save defaults
                </button>
            </form>
        </section>
    );
}

function LoadWarning({ dashboard }: { dashboard: SavedWorkDashboard }) {
    if (!dashboard.loadError) {
        return null;
    }

    return (
        <div className="mt-8 rounded border border-potomac-gold/35 bg-potomac-gold/10 p-4 text-sm leading-6 text-potomac-cream/75">
            Saved-work tables could not be read in this environment:{" "}
            {dashboard.loadError}. The route still renders the controls, but
            live data needs the Task 065 schema applied to the Cabeus Explorer Supabase
            project.
        </div>
    );
}

export default async function SavedWorkPage() {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getSavedWorkAccessContext({
        supabase,
        nextPath: "/member/saved-work",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canUseSavedWork || !access.userId) {
        return <LockedGate />;
    }

    const dashboard = await loadSavedWorkDashboard({
        supabase,
        userId: access.userId,
    });
    const watchlistItemCount = dashboard.watchlists.reduce(
        (total, watchlist) => total + watchlist.items.length,
        0
    );
    const unreadCount = dashboard.readingList.filter((item) => !item.isRead).length;

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Scout and Command workspace
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Saved Work
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Manage watchlists, saved searches, reading-list
                            items, notification preferences, and terminal
                            defaults for lunar intelligence monitoring.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Access state
                        </p>
                        <h2 className="mt-3 font-serif text-2xl leading-tight text-white">
                            {statusLabel(access.roleId ?? "scout")} saved-work access
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            Reads and writes are filtered by Supabase RLS using
                            the Task 065 owner and organization-scoped model.
                        </p>
                        <Link
                            href="/member"
                            className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                    </aside>
                </div>

                <LoadWarning dashboard={dashboard} />

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Watchlists"
                        value={String(dashboard.watchlists.length)}
                        detail={`${watchlistItemCount} monitored records`}
                    />
                    <StatCard
                        label="Saved searches"
                        value={String(dashboard.savedSearches.length)}
                        detail="Query and alert rules"
                    />
                    <StatCard
                        label="Reading list"
                        value={String(dashboard.readingList.length)}
                        detail={`${unreadCount} unread items`}
                    />
                    <StatCard
                        label="Preferences"
                        value={String(dashboard.notificationPreferences.length)}
                        detail={`${dashboard.sourceMode} source mode`}
                    />
                </dl>

                <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="grid h-fit gap-6">
                        <CreateWatchlistForm />
                        <SaveWatchlistItemForm watchlists={dashboard.watchlists} />
                    </div>
                    <WatchlistsPanel watchlists={dashboard.watchlists} />
                </div>

                <div className="mt-12 grid gap-6 lg:grid-cols-2">
                    <SavedSearchesPanel searches={dashboard.savedSearches} />
                    <ReadingListPanel items={dashboard.readingList} />
                </div>

                <div className="mt-12">
                    <PreferencesPanel
                        preferences={dashboard.notificationPreferences}
                        dashboardPreference={dashboard.dashboardPreference}
                    />
                </div>

                <section className="mt-12 rounded border border-white/10 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Unsupported objects
                    </p>
                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                        Objects outside the Task 065 enum are intentionally not
                        accepted by these forms. Add a schema enum value and RLS
                        policy coverage before adding UI controls for a new
                        saved-work type.
                    </p>
                </section>
            </div>
        </section>
    );
}
