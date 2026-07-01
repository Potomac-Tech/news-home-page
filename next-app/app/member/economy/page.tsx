import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { getEconomySubscriberAccessContext } from "../../../lib/auth/economy";
import {
    type DetailedEconomyDashboard,
    type EconomyAssumption,
    type EconomySourceDocument,
    loadDetailedEconomyDashboard,
} from "../../_data/economy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Scout Economy Dashboard",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
});

function statusLabel(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return dateFormatter.format(date);
}

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return dateTimeFormatter.format(date);
}

function formatMoney(value: number | null | undefined, currencyCode = "USD") {
    if (value == null) {
        return "Not set";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        notation: value >= 1_000_000 ? "compact" : "standard",
        maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    }).format(value);
}

function formatAssumptionValue(assumption: EconomyAssumption) {
    if (assumption.value_numeric != null) {
        const unit = assumption.unit_symbol ?? assumption.unit_name ?? "";

        return `${assumption.value_numeric.toLocaleString()}${unit ? ` ${unit}` : ""}`;
    }

    return assumption.value_text ?? "Not set";
}

function renderParagraphs(value: string | null | undefined) {
    return (value ?? "")
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Scout economy dashboard
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Detailed lunar economy records are paid-member data and
                        are not rendered from local fallback data. Configure the
                        Potomac Supabase public environment variables and sign
                        in with Scout or Command access to view the dashboard.
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
                        Scout economy dashboard
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Scout or Command access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Detailed scenario tables, assumptions, and source
                        downloads are reserved for paid Scout members, Command
                        organization users, and authorized staff.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/member"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                        <Link
                            href="/command"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Command access
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function EmptyDashboard() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Economy methodology
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        No active model is published yet.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        The paid economy dashboard will populate after analysts
                        publish an active lunar economy methodology version and
                        scenario output.
                    </p>
                    <Link
                        href="/member"
                        className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Member workspace
                    </Link>
                </div>
            </div>
        </section>
    );
}

function Metric({
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

function DownloadLinks() {
    const downloads = [
        { href: "/member/economy/downloads/scenarios", label: "Scenarios CSV" },
        {
            href: "/member/economy/downloads/assumptions",
            label: "Assumptions CSV",
        },
        { href: "/member/economy/downloads/sources", label: "Sources CSV" },
        {
            href: "/member/economy/downloads/daily-outputs",
            label: "Daily outputs CSV",
        },
    ];

    return (
        <div className="flex flex-wrap gap-3">
            {downloads.map((download) => (
                <a
                    key={download.href}
                    href={download.href}
                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    {download.label}
                </a>
            ))}
        </div>
    );
}

function ScenarioTable({ dashboard }: { dashboard: DetailedEconomyDashboard }) {
    return (
        <section className="glass-card rounded p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="font-serif text-3xl text-white">
                        Scenario Analysis
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                        Published lunar economy scenarios with confidence,
                        valuation ranges, and methodology notes.
                    </p>
                </div>
                <DownloadLinks />
            </div>
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                        <tr className="border-b border-white/10">
                            <th className="py-3 pr-6 font-semibold">Scenario</th>
                            <th className="py-3 pr-6 font-semibold">Estimate</th>
                            <th className="py-3 pr-6 font-semibold">Range</th>
                            <th className="py-3 pr-6 font-semibold">Confidence</th>
                            <th className="py-3 pr-6 font-semibold">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-potomac-cream/75">
                        {dashboard.scenarios.length ? (
                            dashboard.scenarios.map((scenario) => (
                                <tr key={scenario.id}>
                                    <td className="py-4 pr-6 align-top">
                                        <p className="font-semibold text-white">
                                            {scenario.scenario_name}
                                        </p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                            {statusLabel(scenario.scenario_type)} |{" "}
                                            {formatDate(scenario.estimate_date)}
                                        </p>
                                        {scenario.methodology_notes ? (
                                            <p className="mt-2 max-w-md text-xs leading-5 text-potomac-cream/55">
                                                {scenario.methodology_notes}
                                            </p>
                                        ) : null}
                                    </td>
                                    <td className="py-4 pr-6 align-top font-semibold text-white">
                                        {formatMoney(
                                            scenario.estimate_value,
                                            scenario.currency_code
                                        )}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {scenario.range_low_value == null ||
                                        scenario.range_high_value == null
                                            ? "Not set"
                                            : `${formatMoney(
                                                  scenario.range_low_value,
                                                  scenario.currency_code
                                              )} - ${formatMoney(
                                                  scenario.range_high_value,
                                                  scenario.currency_code
                                              )}`}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {statusLabel(scenario.confidence_label)} |{" "}
                                        {scenario.confidence_score}%
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {formatDateTime(scenario.updated_at)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="py-6 text-potomac-cream/60"
                                >
                                    No published scenarios are available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function AssumptionsTable({
    assumptions,
}: {
    assumptions: EconomyAssumption[];
}) {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">Assumptions</h2>
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                        <tr className="border-b border-white/10">
                            <th className="py-3 pr-6 font-semibold">Input</th>
                            <th className="py-3 pr-6 font-semibold">Value</th>
                            <th className="py-3 pr-6 font-semibold">Confidence</th>
                            <th className="py-3 pr-6 font-semibold">Rationale</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-potomac-cream/75">
                        {assumptions.length ? (
                            assumptions.map((assumption) => (
                                <tr key={assumption.id}>
                                    <td className="py-4 pr-6 align-top">
                                        <p className="font-semibold text-white">
                                            {assumption.assumption_name}
                                        </p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                            {assumption.category} |{" "}
                                            {assumption.assumption_key}
                                        </p>
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {formatAssumptionValue(assumption)}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {statusLabel(assumption.confidence_label)}
                                    </td>
                                    <td className="max-w-md py-4 pr-6 align-top text-xs leading-5">
                                        {assumption.rationale ??
                                            assumption.source_note ??
                                            "No rationale saved."}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="py-6 text-potomac-cream/60"
                                >
                                    No model assumptions are published yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function SourceTable({
    sources,
    dashboard,
}: {
    sources: EconomySourceDocument[];
    dashboard: DetailedEconomyDashboard;
}) {
    const relationshipsBySource = new Map<string, number>();

    for (const relationship of dashboard.relationships) {
        relationshipsBySource.set(
            relationship.source_document_id,
            (relationshipsBySource.get(relationship.source_document_id) ?? 0) + 1
        );
    }

    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">Source Table</h2>
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                        <tr className="border-b border-white/10">
                            <th className="py-3 pr-6 font-semibold">Source</th>
                            <th className="py-3 pr-6 font-semibold">Publisher</th>
                            <th className="py-3 pr-6 font-semibold">Review</th>
                            <th className="py-3 pr-6 font-semibold">Evidence</th>
                            <th className="py-3 pr-6 font-semibold">Retrieved</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-potomac-cream/75">
                        {sources.length ? (
                            sources.map((source) => (
                                <tr key={source.id}>
                                    <td className="py-4 pr-6 align-top">
                                        {source.url ? (
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-semibold text-white transition hover:text-potomac-gold"
                                            >
                                                {source.title}
                                            </a>
                                        ) : (
                                            <p className="font-semibold text-white">
                                                {source.title}
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                            {source.document_type} |{" "}
                                            {formatDate(source.published_at)}
                                        </p>
                                        {source.summary ? (
                                            <p className="mt-2 max-w-md text-xs leading-5 text-potomac-cream/55">
                                                {source.summary}
                                            </p>
                                        ) : null}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {source.publisher ?? "Not set"}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {statusLabel(source.review_status)} |{" "}
                                        {statusLabel(source.confidence_label)}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {relationshipsBySource.get(source.id) ?? 0}{" "}
                                        linked inputs
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {formatDateTime(source.retrieved_at)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="py-6 text-potomac-cream/60"
                                >
                                    No reviewed sources are available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function DailyOutputHistory({
    dashboard,
}: {
    dashboard: DetailedEconomyDashboard;
}) {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">Update History</h2>
            <div className="mt-5 space-y-4">
                {dashboard.dailyOutputs.length ? (
                    dashboard.dailyOutputs.map((output) => (
                        <div
                            key={output.id}
                            className="border-l border-white/10 pl-4"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="font-semibold text-white">
                                        {formatDate(output.output_date)}
                                    </p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {output.scenario_key} | Fresh{" "}
                                        {formatDateTime(output.freshness_at)}
                                    </p>
                                </div>
                                <p className="text-sm font-bold text-potomac-gold">
                                    {formatMoney(
                                        output.headline_value,
                                        output.currency_code
                                    )}
                                </p>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                {output.methodology_note ??
                                    "No methodology note saved."}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-potomac-cream/60">
                        No daily output history is available yet.
                    </p>
                )}
            </div>
        </section>
    );
}

export default async function MemberEconomyPage() {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getEconomySubscriberAccessContext({
        supabase,
        nextPath: "/member/economy",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canReadEconomyDashboard) {
        return <LockedGate />;
    }

    const dashboard = await loadDetailedEconomyDashboard(supabase);
    const modelVersion = dashboard.modelVersion;
    const latestOutput = dashboard.dailyOutputs[0];
    const latestScenario = dashboard.scenarios[0];

    if (!modelVersion) {
        return <EmptyDashboard />;
    }

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Scout and Command intelligence
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Lunar Economy Dashboard
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Scenario outputs, assumptions, source tables, and
                            downloadable methodology records for paid lunar
                            intelligence members.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Active methodology
                        </p>
                        <h2 className="mt-3 font-serif text-2xl leading-tight text-white">
                            {modelVersion.version_name}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            {modelVersion.summary || "No summary saved."}
                        </p>
                        <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Valid from</dt>
                                <dd className="text-white">
                                    {formatDate(modelVersion.valid_from)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Published</dt>
                                <dd className="text-white">
                                    {formatDateTime(modelVersion.published_at)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Updated</dt>
                                <dd className="text-white">
                                    {formatDateTime(modelVersion.updated_at)}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                        label="Headline"
                        value={formatMoney(
                            latestOutput?.headline_value ??
                                latestScenario?.estimate_value,
                            latestOutput?.currency_code ??
                                latestScenario?.currency_code ??
                                modelVersion.currency_code
                        )}
                        detail={latestOutput?.scenario_key ?? "Latest scenario"}
                    />
                    <Metric
                        label="Scenarios"
                        value={String(dashboard.scenarios.length)}
                        detail="Published records"
                    />
                    <Metric
                        label="Sources"
                        value={String(dashboard.sources.length)}
                        detail="Reviewed documents"
                    />
                    <Metric
                        label="Freshness"
                        value={formatDate(latestOutput?.freshness_at)}
                        detail="Latest output"
                    />
                </dl>

                <div className="mt-12 space-y-8">
                    <ScenarioTable dashboard={dashboard} />

                    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                        <AssumptionsTable assumptions={dashboard.assumptions} />
                        <DailyOutputHistory dashboard={dashboard} />
                    </section>

                    <SourceTable
                        sources={dashboard.sources}
                        dashboard={dashboard}
                    />

                    <section className="glass-card rounded p-6">
                        <h2 className="font-serif text-3xl text-white">
                            Methodology Notes
                        </h2>
                        <div className="mt-5 space-y-4 text-sm leading-6 text-potomac-cream/75">
                            {renderParagraphs(
                                modelVersion.methodology_markdown ||
                                    modelVersion.summary
                            ).length ? (
                                renderParagraphs(
                                    modelVersion.methodology_markdown ||
                                        modelVersion.summary
                                ).map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))
                            ) : (
                                <p>No methodology notes are published yet.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </section>
    );
}
