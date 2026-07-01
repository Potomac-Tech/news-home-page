import Link from "next/link";
import {
    dueDateForRecord,
    formatCurrency,
    formatMarketIntelDate,
    formatMarketIntelDateTime,
    formatMarketIntelFreshness,
    formatMarketIntelLabel,
    marketIntelMatchesFilter,
    marketIntelMatchesQuery,
    sortMarketIntelByDueDate,
    type LunarMarketMode,
    type LunarMarketRecord,
} from "../_data/lunarMarketIntel";

type LunarMarketIntelHubProps = {
    mode: LunarMarketMode;
    records: LunarMarketRecord[];
    activeFilter?: string;
    query?: string;
    canReadPaid: boolean;
};

const filterSets = {
    procurement: [
        { label: "All", value: "all", href: "/procurement" },
        { label: "Open", value: "open", href: "/procurement?filter=open" },
        { label: "Due dates", value: "due", href: "/procurement?filter=due" },
        { label: "SBIR/STTR", value: "sbir", href: "/procurement?filter=sbir" },
        { label: "Awards", value: "awards", href: "/procurement?filter=awards" },
    ],
    regulatory: [
        { label: "All", value: "all", href: "/regulatory" },
        { label: "Open", value: "open", href: "/regulatory?filter=open" },
        { label: "Comment periods", value: "comments", href: "/regulatory?filter=comments" },
        { label: "Policy risk", value: "risk", href: "/regulatory?filter=risk" },
        { label: "Due dates", value: "due", href: "/regulatory?filter=due" },
    ],
};

function tierLabel(value: string) {
    if (value === "member") {
        return "Explorer+";
    }

    if (value === "scout") {
        return "Scout+";
    }

    if (value === "command") {
        return "Command";
    }

    return "Public";
}

function canReadRecord(record: LunarMarketRecord, canReadPaid: boolean) {
    return record.visibilityTier === "public" || canReadPaid;
}

function modeCopy(mode: LunarMarketMode) {
    if (mode === "procurement") {
        return {
            eyebrow: "Lunar opportunity intelligence",
            title: "Procurement Hub",
            description:
                "Search lunar solicitations, awards, SBIR/STTR items, due dates, source citations, and analyst freshness labels.",
            memberHref: "/member/procurement",
        };
    }

    return {
        eyebrow: "Lunar policy risk",
        title: "Regulatory Hub",
        description:
            "Search filings, comment periods, policy milestones, compliance notes, risk labels, agencies, and citations.",
        memberHref: "/member/procurement",
    };
}

function SearchBox({
    mode,
    query,
}: {
    mode: LunarMarketMode;
    query: string;
}) {
    return (
        <form action={`/${mode}`} className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor={`${mode}-search`}>
                Search {mode}
            </label>
            <input
                id={`${mode}-search`}
                name="q"
                defaultValue={query}
                placeholder={
                    mode === "procurement"
                        ? "Search agency, program, status, solicitation..."
                        : "Search agency, docket, risk, jurisdiction..."
                }
                className="min-h-12 flex-1 rounded border border-white/15 bg-potomac-primary/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-potomac-cream/40 focus:border-potomac-gold"
            />
            <button
                type="submit"
                className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
            >
                Search
            </button>
        </form>
    );
}

function FilterBar({
    mode,
    activeFilter,
}: {
    mode: LunarMarketMode;
    activeFilter: string;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {filterSets[mode].map((filter) => {
                const active = filter.value === activeFilter;

                return (
                    <Link
                        key={filter.value}
                        href={filter.href}
                        className={
                            active
                                ? "rounded bg-potomac-gold px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-potomac-primary"
                                : "rounded border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/65 transition hover:border-potomac-gold hover:text-potomac-gold"
                        }
                    >
                        {filter.label}
                    </Link>
                );
            })}
        </div>
    );
}

function WatchlistHook({ locked }: { locked: boolean }) {
    return (
        <div className="rounded border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                Watchlist hook
            </p>
            <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                {locked
                    ? "Saving this record is reserved for Scout and Command watchlists."
                    : "Save/remove actions will attach here when the watchlist schema lands."}
            </p>
        </div>
    );
}

function UpgradePrompt({ mode }: { mode: LunarMarketMode }) {
    return (
        <section className="glass-card rounded p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                Scout intelligence
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
                Unlock the working {mode} queue.
            </h2>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                Public previews show structure and source posture. Scout and
                Command members unlock live opportunity rows, policy-risk
                notes, detail pages, citations, and watchlist-ready monitoring.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
                <Link
                    href="/pricing"
                    className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Compare tiers
                </Link>
                <Link
                    href="/command"
                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Command access
                </Link>
            </div>
        </section>
    );
}

function RecordStats({ record }: { record: LunarMarketRecord }) {
    const dueDate = dueDateForRecord(record);

    return (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-l border-potomac-gold/35 pl-4">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                    Status
                </dt>
                <dd className="mt-2 text-xl font-semibold text-white">
                    {formatMarketIntelLabel(record.status)}
                </dd>
            </div>
            <div className="border-l border-potomac-gold/35 pl-4">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                    Due date
                </dt>
                <dd className="mt-2 text-xl font-semibold text-white">
                    {formatMarketIntelDate(dueDate)}
                </dd>
            </div>
            <div className="border-l border-potomac-gold/35 pl-4">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                    Agency
                </dt>
                <dd className="mt-2 text-xl font-semibold text-white">
                    {record.agencyName ?? "TBD"}
                </dd>
            </div>
            <div className="border-l border-potomac-gold/35 pl-4">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                    Freshness
                </dt>
                <dd className="mt-2 text-xl font-semibold text-white">
                    {formatMarketIntelFreshness(record.freshnessAt)}
                </dd>
            </div>
        </dl>
    );
}

function RecordCard({
    record,
    canReadPaid,
}: {
    record: LunarMarketRecord;
    canReadPaid: boolean;
}) {
    const locked = !canReadRecord(record, canReadPaid);
    const href =
        record.mode === "procurement"
            ? `/procurement/${record.slug}`
            : `/regulatory/${record.slug}`;

    return (
        <article className="glass-card rounded p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        {formatMarketIntelLabel(record.kind)}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl leading-tight text-white">
                        <Link
                            href={href}
                            className="transition hover:text-potomac-gold"
                        >
                            {record.title}
                        </Link>
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                        {record.summary}
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded border border-potomac-gold/40 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                        {formatMarketIntelLabel(record.status)}
                    </span>
                    <span className="rounded border border-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/60">
                        {tierLabel(record.visibilityTier)}
                    </span>
                </div>
            </div>

            <RecordStats record={record} />

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <section className="rounded border border-white/10 bg-white/[0.02] p-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Lunar relevance
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                        {locked
                            ? "Scout or Command access unlocks the analyst relevance note for this record."
                            : record.lunarRelevance}
                    </p>
                    {record.mode === "procurement" ? (
                        <p className="mt-3 text-sm text-potomac-cream/60">
                            Value:{" "}
                            <span className="text-white">
                                {formatCurrency(
                                    record.estimatedValue,
                                    record.currencyCode
                                )}
                            </span>
                        </p>
                    ) : (
                        <p className="mt-3 text-sm text-potomac-cream/60">
                            Risk:{" "}
                            <span className="text-white">
                                {formatMarketIntelLabel(record.riskLevel)}
                            </span>
                        </p>
                    )}
                </section>
                <div className="space-y-4">
                    <WatchlistHook locked={locked} />
                    <div className="rounded border border-white/10 bg-white/[0.02] p-3 text-sm leading-6 text-potomac-cream/65">
                        <p>
                            Confidence:{" "}
                            <span className="text-white">
                                {formatMarketIntelLabel(record.confidenceLabel)}
                            </span>
                        </p>
                        <p>
                            Last source:{" "}
                            <span className="text-white">
                                {formatMarketIntelDateTime(record.lastSourceAt)}
                            </span>
                        </p>
                        <p>
                            Citations:{" "}
                            <span className="text-white">
                                {record.citations.length}
                            </span>
                        </p>
                    </div>
                    <Link
                        href={href}
                        className="inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Detail page
                    </Link>
                </div>
            </div>
        </article>
    );
}

export function LunarMarketIntelHub({
    mode,
    records,
    activeFilter = "all",
    query = "",
    canReadPaid,
}: LunarMarketIntelHubProps) {
    const copy = modeCopy(mode);
    const visibleRecords = records
        .filter((record) => marketIntelMatchesFilter(record, activeFilter))
        .filter((record) => marketIntelMatchesQuery(record, query))
        .sort(sortMarketIntelByDueDate);
    const fallback = visibleRecords.some((record) => record.isFallback);
    const lockedCount = visibleRecords.filter(
        (record) => !canReadRecord(record, canReadPaid)
    ).length;

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            {copy.eyebrow}
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            {copy.title}
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            {copy.description}
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Hub status
                        </p>
                        <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Records</dt>
                                <dd className="text-white">
                                    {visibleRecords.length}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Locked rows</dt>
                                <dd className="text-white">{lockedCount}</dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Source mode</dt>
                                <dd className="text-white">
                                    {fallback ? "Fallback" : "Supabase"}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Access</dt>
                                <dd className="text-white">
                                    {canReadPaid ? "Scout+" : "Preview"}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <div className="mt-10 space-y-5 border-y border-white/10 py-5">
                    <SearchBox mode={mode} query={query} />
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <FilterBar mode={mode} activeFilter={activeFilter} />
                        <Link
                            href={copy.memberHref}
                            className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:text-potomac-cream"
                        >
                            Member hub
                        </Link>
                    </div>
                </div>

                {!canReadPaid ? (
                    <div className="mt-8">
                        <UpgradePrompt mode={mode} />
                    </div>
                ) : null}

                <div className="mt-8 space-y-6">
                    {visibleRecords.length ? (
                        visibleRecords.map((record) => (
                            <RecordCard
                                key={record.id}
                                record={record}
                                canReadPaid={canReadPaid}
                            />
                        ))
                    ) : (
                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-3xl text-white">
                                No matching intelligence records.
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                Change filters or search terms to return to the
                                full hub.
                            </p>
                        </section>
                    )}
                </div>
            </div>
        </section>
    );
}
