import Link from "next/link";
import {
    dueDateForRecord,
    formatCurrency,
    formatMarketIntelDate,
    formatMarketIntelDateTime,
    formatMarketIntelFreshness,
    formatMarketIntelLabel,
    type LunarMarketRecord,
} from "../_data/lunarMarketIntel";

type LunarMarketIntelDetailProps = {
    record: LunarMarketRecord;
    canReadPaid: boolean;
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

function Metric({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="border-l border-potomac-gold/35 pl-4">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                {label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
            {detail ? (
                <dd className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                    {detail}
                </dd>
            ) : null}
        </div>
    );
}

function LockedPanel({ record }: { record: LunarMarketRecord }) {
    return (
        <section className="glass-card rounded p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                {tierLabel(record.visibilityTier)} detail
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
                Analyst notes are gated.
            </h2>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                Scout and Command members can read the full lunar relevance,
                risk, eligibility, source, and watchlist-ready details for this
                record after sign-in.
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

function ProcurementDetails({ record }: { record: LunarMarketRecord }) {
    if (record.mode !== "procurement") {
        return null;
    }

    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">
                Opportunity Details
            </h2>
            <dl className="mt-5 grid gap-4 text-sm text-potomac-cream/65 md:grid-cols-2">
                <div className="border-t border-white/10 pt-3">
                    <dt>Solicitation</dt>
                    <dd className="mt-1 text-white">
                        {record.solicitationNumber ?? record.externalReference ?? "TBD"}
                    </dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Program</dt>
                    <dd className="mt-1 text-white">
                        {record.programName ?? "Not set"}
                    </dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Estimated value</dt>
                    <dd className="mt-1 text-white">
                        {formatCurrency(record.estimatedValue, record.currencyCode)}
                    </dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Place of performance</dt>
                    <dd className="mt-1 text-white">
                        {record.placeOfPerformance ?? "Not set"}
                    </dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Questions due</dt>
                    <dd className="mt-1 text-white">
                        {formatMarketIntelDateTime(record.questionsDueAt)}
                    </dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Responses due</dt>
                    <dd className="mt-1 text-white">
                        {formatMarketIntelDateTime(record.responseDueAt)}
                    </dd>
                </div>
            </dl>
            {record.eligibilitySummary ? (
                <p className="mt-5 text-sm leading-6 text-potomac-cream/70">
                    {record.eligibilitySummary}
                </p>
            ) : null}
        </section>
    );
}

function RegulatoryDetails({ record }: { record: LunarMarketRecord }) {
    if (record.mode !== "regulatory") {
        return null;
    }

    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">Policy Details</h2>
            <dl className="mt-5 grid gap-4 text-sm text-potomac-cream/65 md:grid-cols-2">
                <div className="border-t border-white/10 pt-3">
                    <dt>Docket</dt>
                    <dd className="mt-1 text-white">
                        {record.docketNumber ?? record.filingNumber ?? "TBD"}
                    </dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Jurisdiction</dt>
                    <dd className="mt-1 text-white">
                        {record.jurisdiction ?? "Not set"}
                    </dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Comment due</dt>
                    <dd className="mt-1 text-white">
                        {formatMarketIntelDateTime(record.commentDueAt)}
                    </dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Effective date</dt>
                    <dd className="mt-1 text-white">
                        {formatMarketIntelDateTime(record.effectiveAt)}
                    </dd>
                </div>
            </dl>
            {record.complianceGuidance ? (
                <p className="mt-5 text-sm leading-6 text-potomac-cream/70">
                    {record.complianceGuidance}
                </p>
            ) : null}
            {record.riskNote ? (
                <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                    {record.riskNote}
                </p>
            ) : null}
            {record.milestones.length ? (
                <div className="mt-6 space-y-3">
                    {record.milestones.map((milestone) => (
                        <article
                            key={milestone.id}
                            className="rounded border border-white/10 bg-white/[0.02] p-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {milestone.title}
                                    </h3>
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {formatMarketIntelLabel(milestone.status)}
                                    </p>
                                </div>
                                <span className="text-xs text-potomac-cream/60">
                                    {formatMarketIntelDate(milestone.milestoneAt)}
                                </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                {milestone.summary}
                            </p>
                        </article>
                    ))}
                </div>
            ) : null}
        </section>
    );
}

function Sources({ record }: { record: LunarMarketRecord }) {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">Sources</h2>
            <div className="mt-5 space-y-4">
                {record.citations.length ? (
                    record.citations.map((citation) => (
                        <article
                            key={citation.id}
                            className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                        >
                            {citation.url ? (
                                <a
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-white transition hover:text-potomac-gold"
                                >
                                    {citation.title}
                                </a>
                            ) : (
                                <h3 className="font-semibold text-white">
                                    {citation.title}
                                </h3>
                            )}
                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                {citation.sourceName} |{" "}
                                {formatMarketIntelLabel(citation.reviewStatus)}
                            </p>
                            {citation.summary ? (
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                    {citation.summary}
                                </p>
                            ) : null}
                        </article>
                    ))
                ) : (
                    <p className="text-sm text-potomac-cream/60">
                        No citations are attached yet.
                    </p>
                )}
            </div>
        </section>
    );
}

export function LunarMarketIntelDetail({
    record,
    canReadPaid,
}: LunarMarketIntelDetailProps) {
    const unlocked = canReadRecord(record, canReadPaid);
    const dueDate = dueDateForRecord(record);
    const backHref =
        record.mode === "procurement" ? "/procurement" : "/regulatory";

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            {record.mode === "procurement"
                                ? "Procurement detail"
                                : "Regulatory detail"}
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            {record.title}
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            {record.summary}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href={backHref}
                                className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Back to hub
                            </Link>
                            {record.sourceUrl ? (
                                <a
                                    href={record.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                >
                                    Source
                                </a>
                            ) : null}
                        </div>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Access and freshness
                        </p>
                        <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Status</dt>
                                <dd className="text-white">
                                    {formatMarketIntelLabel(record.status)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Tier</dt>
                                <dd className="text-white">
                                    {tierLabel(record.visibilityTier)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Freshness</dt>
                                <dd className="text-white">
                                    {formatMarketIntelFreshness(record.freshnessAt)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Watchlist</dt>
                                <dd className="text-white">
                                    {unlocked ? "Hook ready" : "Scout+"}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                        label="Agency"
                        value={record.agencyName ?? "TBD"}
                        detail={formatMarketIntelLabel(record.kind)}
                    />
                    <Metric
                        label="Due date"
                        value={formatMarketIntelDate(dueDate)}
                        detail={
                            record.mode === "procurement"
                                ? "Opportunity clock"
                                : "Policy clock"
                        }
                    />
                    <Metric
                        label="Confidence"
                        value={formatMarketIntelLabel(record.confidenceLabel)}
                        detail={record.analystReviewState}
                    />
                    <Metric
                        label="Sources"
                        value={String(record.citations.length)}
                        detail={formatMarketIntelDate(record.lastSourceAt)}
                    />
                </dl>

                <div className="mt-8 space-y-8">
                    {unlocked ? (
                        <>
                            <section className="glass-card rounded p-6">
                                <h2 className="font-serif text-3xl text-white">
                                    Lunar Relevance
                                </h2>
                                <p className="mt-4 text-sm leading-6 text-potomac-cream/75">
                                    {record.lunarRelevance}
                                </p>
                            </section>
                            <ProcurementDetails record={record} />
                            <RegulatoryDetails record={record} />
                        </>
                    ) : (
                        <LockedPanel record={record} />
                    )}
                    <Sources record={record} />
                </div>
            </div>
        </section>
    );
}
