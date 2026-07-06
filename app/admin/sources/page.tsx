import type { Metadata } from "next";
import { requireDataSourceStaff } from "../../../lib/auth/data-sources";
import {
    createCitationRequirement,
    createDataSource,
    createHealthCheck,
    createParserRun,
    createQualityReview,
    createRegistryLink,
    updateDataSource,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Data Source Registry Admin",
};

type DataSource = {
    id: string;
    source_key: string;
    source_name: string;
    source_owner: string;
    owner_kind: string;
    primary_url: string | null;
    terms_url: string | null;
    license_name: string | null;
    license_status: string;
    license_reviewed_at: string | null;
    license_notes: string | null;
    refresh_frequency: string;
    parser_key: string | null;
    parser_repository_url: string | null;
    job_name: string | null;
    health_status: string;
    last_checked_at: string | null;
    last_success_at: string | null;
    last_failure_at: string | null;
    stale_after_hours: number | null;
    next_refresh_at: string | null;
    citation_required: boolean;
    citation_format: string | null;
    attribution_text: string | null;
    quality_score: number;
    confidence_label: string;
    analyst_review_state: string;
    analyst_notes: string | null;
    publication_status: string;
    updated_at: string;
};

type CitationRequirement = {
    id: string;
    data_source_id: string;
    requirement_key: string;
    display_label: string;
    is_required: boolean;
    guidance: string | null;
};

type HealthCheck = {
    id: string;
    data_source_id: string;
    health_status: string;
    checked_at: string;
    freshness_at: string | null;
    freshness_lag_hours: number | null;
    issue_summary: string | null;
};

type QualityReview = {
    id: string;
    data_source_id: string;
    review_state: string;
    quality_score: number;
    confidence_label: string;
    reviewed_at: string;
    review_notes: string | null;
};

type ParserRun = {
    id: string;
    data_source_id: string;
    parser_key: string;
    job_name: string | null;
    job_status: string;
    records_seen: number;
    records_created: number;
    records_updated: number;
    records_failed: number;
    created_at: string;
};

type RegistryLink = {
    id: string;
    data_source_id: string;
    source_kind: string;
    source_table: string | null;
    source_slug: string | null;
    route_path: string | null;
    freshness_at: string | null;
    confidence_label: string;
    quality_score: number;
};

const inputClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

const textareaClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

const ownerKinds = [
    "government",
    "commercial",
    "academic",
    "nonprofit",
    "media",
    "community",
    "internal",
    "unknown",
];
const licenseStatuses = [
    "queued",
    "approved",
    "restricted",
    "rejected",
    "expired",
    "unknown",
];
const healthStatuses = [
    "healthy",
    "degraded",
    "failing",
    "paused",
    "retired",
    "unknown",
];
const refreshFrequencies = [
    "realtime",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "manual",
    "static",
];
const confidenceLabels = ["low", "medium", "high", "experimental"];
const reviewStates = [
    "not_started",
    "in_review",
    "approved",
    "needs_changes",
    "blocked",
    "retired",
];
const publicationStatuses = ["draft", "review", "published", "archived", "hidden"];
const jobStatuses = ["queued", "running", "succeeded", "failed", "cancelled", "skipped"];
const sourceKinds = [
    "article",
    "event",
    "company",
    "lunar_mission",
    "dataset",
    "data_request",
    "data_offer",
    "job",
    "procurement",
    "regulatory_record",
    "methodology_source",
    "dashboard_module",
    "calculator",
    "rfq",
    "forum_thread",
    "member_profile",
];

function FieldLabel({ children }: { children: string }) {
    return (
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
            {children}
        </label>
    );
}

function statusLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function SelectField({
    name,
    options,
    defaultValue,
}: {
    name: string;
    options: string[];
    defaultValue: string;
}) {
    return (
        <select name={name} defaultValue={defaultValue} className={inputClass}>
            {options.map((option) => (
                <option key={option} value={option}>
                    {statusLabel(option)}
                </option>
            ))}
        </select>
    );
}

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleString();
}

function toDateTimeLocal(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 16);
}

function SourceSelect({
    sources,
    defaultValue,
}: {
    sources: DataSource[];
    defaultValue?: string;
}) {
    return (
        <select
            required
            name="data_source_id"
            defaultValue={defaultValue ?? ""}
            className={inputClass}
        >
            <option value="" disabled>
                Select source
            </option>
            {sources.map((source) => (
                <option key={source.id} value={source.id}>
                    {source.source_name} ({source.source_key})
                </option>
            ))}
        </select>
    );
}

function SourceFields({ source }: { source?: DataSource }) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Source key</FieldLabel>
                <input
                    required
                    name="source_key"
                    defaultValue={source?.source_key ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Source name</FieldLabel>
                <input
                    required
                    name="source_name"
                    defaultValue={source?.source_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Owner</FieldLabel>
                <input
                    required
                    name="source_owner"
                    defaultValue={source?.source_owner ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Owner kind</FieldLabel>
                <SelectField
                    name="owner_kind"
                    options={ownerKinds}
                    defaultValue={source?.owner_kind ?? "unknown"}
                />
            </div>
            <div>
                <FieldLabel>Primary URL</FieldLabel>
                <input
                    name="primary_url"
                    defaultValue={source?.primary_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Terms URL</FieldLabel>
                <input
                    name="terms_url"
                    defaultValue={source?.terms_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>License name</FieldLabel>
                <input
                    name="license_name"
                    defaultValue={source?.license_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>License status</FieldLabel>
                <SelectField
                    name="license_status"
                    options={licenseStatuses}
                    defaultValue={source?.license_status ?? "queued"}
                />
            </div>
            <div>
                <FieldLabel>License reviewed</FieldLabel>
                <input
                    name="license_reviewed_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(source?.license_reviewed_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Refresh frequency</FieldLabel>
                <SelectField
                    name="refresh_frequency"
                    options={refreshFrequencies}
                    defaultValue={source?.refresh_frequency ?? "manual"}
                />
            </div>
            <div>
                <FieldLabel>Parser key</FieldLabel>
                <input
                    name="parser_key"
                    defaultValue={source?.parser_key ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Parser repo URL</FieldLabel>
                <input
                    name="parser_repository_url"
                    defaultValue={source?.parser_repository_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Job name</FieldLabel>
                <input
                    name="job_name"
                    defaultValue={source?.job_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Health</FieldLabel>
                <SelectField
                    name="health_status"
                    options={healthStatuses}
                    defaultValue={source?.health_status ?? "unknown"}
                />
            </div>
            <div>
                <FieldLabel>Last checked</FieldLabel>
                <input
                    name="last_checked_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(source?.last_checked_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Last success</FieldLabel>
                <input
                    name="last_success_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(source?.last_success_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Last failure</FieldLabel>
                <input
                    name="last_failure_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(source?.last_failure_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Stale after hours</FieldLabel>
                <input
                    name="stale_after_hours"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={source?.stale_after_hours ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Next refresh</FieldLabel>
                <input
                    name="next_refresh_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(source?.next_refresh_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Quality score</FieldLabel>
                <input
                    name="quality_score"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={source?.quality_score ?? 0}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Confidence</FieldLabel>
                <SelectField
                    name="confidence_label"
                    options={confidenceLabels}
                    defaultValue={source?.confidence_label ?? "experimental"}
                />
            </div>
            <div>
                <FieldLabel>Analyst review</FieldLabel>
                <SelectField
                    name="analyst_review_state"
                    options={reviewStates}
                    defaultValue={source?.analyst_review_state ?? "not_started"}
                />
            </div>
            <div>
                <FieldLabel>Publication status</FieldLabel>
                <SelectField
                    name="publication_status"
                    options={publicationStatuses}
                    defaultValue={source?.publication_status ?? "draft"}
                />
            </div>
            <div className="lg:col-span-2">
                <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                    <input
                        type="checkbox"
                        name="citation_required"
                        defaultChecked={source?.citation_required ?? true}
                        className="h-4 w-4 accent-potomac-gold"
                    />
                    Citation required
                </label>
            </div>
            <div>
                <FieldLabel>Citation format</FieldLabel>
                <textarea
                    name="citation_format"
                    rows={3}
                    defaultValue={source?.citation_format ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Attribution text</FieldLabel>
                <textarea
                    name="attribution_text"
                    rows={3}
                    defaultValue={source?.attribution_text ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>License notes</FieldLabel>
                <textarea
                    name="license_notes"
                    rows={3}
                    defaultValue={source?.license_notes ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Analyst notes</FieldLabel>
                <textarea
                    name="analyst_notes"
                    rows={3}
                    defaultValue={source?.analyst_notes ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function SourceQuickForms({
    source,
    sources,
}: {
    source: DataSource;
    sources: DataSource[];
}) {
    return (
        <details className="mt-5 border-t border-white/10 pt-5">
            <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                Review tools
            </summary>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <form action={createHealthCheck} className="rounded border border-white/10 p-4">
                    <input type="hidden" name="data_source_id" value={source.id} />
                    <h4 className="font-semibold text-white">Health check</h4>
                    <SelectField
                        name="health_status"
                        options={healthStatuses}
                        defaultValue={source.health_status}
                    />
                    <input
                        name="freshness_at"
                        type="datetime-local"
                        className={inputClass}
                    />
                    <input
                        name="freshness_lag_hours"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Freshness lag hours"
                        className={inputClass}
                    />
                    <textarea
                        name="issue_summary"
                        rows={2}
                        placeholder="Issue summary"
                        className={textareaClass}
                    />
                    <button className="mt-4 rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Add health check
                    </button>
                </form>
                <form action={createQualityReview} className="rounded border border-white/10 p-4">
                    <input type="hidden" name="data_source_id" value={source.id} />
                    <h4 className="font-semibold text-white">Quality review</h4>
                    <SelectField
                        name="review_state"
                        options={reviewStates}
                        defaultValue={source.analyst_review_state}
                    />
                    <input
                        required
                        name="quality_score"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        defaultValue={source.quality_score}
                        className={inputClass}
                    />
                    <SelectField
                        name="confidence_label"
                        options={confidenceLabels}
                        defaultValue={source.confidence_label}
                    />
                    <textarea
                        name="review_notes"
                        rows={2}
                        placeholder="Review notes"
                        className={textareaClass}
                    />
                    <button className="mt-4 rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Add review
                    </button>
                </form>
                <form
                    action={createCitationRequirement}
                    className="rounded border border-white/10 p-4"
                >
                    <input type="hidden" name="data_source_id" value={source.id} />
                    <h4 className="font-semibold text-white">Citation rule</h4>
                    <input
                        required
                        name="requirement_key"
                        placeholder="retrieved_at"
                        className={inputClass}
                    />
                    <input
                        required
                        name="display_label"
                        placeholder="Retrieved date"
                        className={inputClass}
                    />
                    <label className="mt-4 flex items-center gap-3 text-sm text-potomac-cream/75">
                        <input
                            type="checkbox"
                            name="is_required"
                            defaultChecked
                            className="h-4 w-4 accent-potomac-gold"
                        />
                        Required
                    </label>
                    <textarea
                        name="guidance"
                        rows={2}
                        placeholder="Guidance"
                        className={textareaClass}
                    />
                    <button className="mt-4 rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Add rule
                    </button>
                </form>
                <form action={createParserRun} className="rounded border border-white/10 p-4">
                    <input type="hidden" name="data_source_id" value={source.id} />
                    <h4 className="font-semibold text-white">Parser run</h4>
                    <input
                        required
                        name="parser_key"
                        defaultValue={source.parser_key ?? ""}
                        placeholder="parser key"
                        className={inputClass}
                    />
                    <SelectField
                        name="job_status"
                        options={jobStatuses}
                        defaultValue="queued"
                    />
                    <input
                        name="records_seen"
                        type="number"
                        min="0"
                        placeholder="Records seen"
                        className={inputClass}
                    />
                    <textarea
                        name="error_message"
                        rows={2}
                        placeholder="Error message"
                        className={textareaClass}
                    />
                    <button className="mt-4 rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Add parser run
                    </button>
                </form>
                <form
                    action={createRegistryLink}
                    className="rounded border border-white/10 p-4 lg:col-span-2"
                >
                    <input type="hidden" name="data_source_id" value={source.id} />
                    <h4 className="font-semibold text-white">Linked record</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                        <SelectField
                            name="source_kind"
                            options={sourceKinds}
                            defaultValue="methodology_source"
                        />
                        <input
                            name="source_table"
                            placeholder="source table"
                            className={inputClass}
                        />
                        <input
                            name="route_path"
                            placeholder="/datasets"
                            className={inputClass}
                        />
                    </div>
                    <button className="mt-4 rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Link record
                    </button>
                </form>
            </div>
            <form action={updateDataSource} className="mt-6">
                <input type="hidden" name="data_source_id" value={source.id} />
                <SourceFields source={source} />
                <button className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Save source
                </button>
            </form>
            <div className="sr-only">
                <SourceSelect sources={sources} defaultValue={source.id} />
            </div>
        </details>
    );
}

export default async function DataSourceRegistryAdminPage() {
    const { supabase } = await requireDataSourceStaff();
    const [
        sourcesResult,
        requirementsResult,
        healthResult,
        reviewsResult,
        parserRunsResult,
        linksResult,
    ] = await Promise.all([
        supabase
            .from("intelligence_data_sources")
            .select("*")
            .order("updated_at", { ascending: false }),
        supabase
            .from("intelligence_source_citation_requirements")
            .select("id,data_source_id,requirement_key,display_label,is_required,guidance")
            .order("display_order", { ascending: true }),
        supabase
            .from("intelligence_source_health_checks")
            .select("id,data_source_id,health_status,checked_at,freshness_at,freshness_lag_hours,issue_summary")
            .order("checked_at", { ascending: false })
            .limit(25),
        supabase
            .from("intelligence_source_quality_reviews")
            .select("id,data_source_id,review_state,quality_score,confidence_label,reviewed_at,review_notes")
            .order("reviewed_at", { ascending: false })
            .limit(25),
        supabase
            .from("intelligence_source_parser_runs")
            .select("id,data_source_id,parser_key,job_name,job_status,records_seen,records_created,records_updated,records_failed,created_at")
            .order("created_at", { ascending: false })
            .limit(25),
        supabase
            .from("intelligence_source_registry_links")
            .select("id,data_source_id,source_kind,source_table,source_slug,route_path,freshness_at,confidence_label,quality_score")
            .order("updated_at", { ascending: false })
            .limit(25),
    ]);

    for (const result of [
        sourcesResult,
        requirementsResult,
        healthResult,
        reviewsResult,
        parserRunsResult,
        linksResult,
    ]) {
        if (result.error) {
            throw new Error(result.error.message);
        }
    }

    const sources = (sourcesResult.data ?? []) as DataSource[];
    const requirements = (requirementsResult.data ?? []) as CitationRequirement[];
    const healthChecks = (healthResult.data ?? []) as HealthCheck[];
    const reviews = (reviewsResult.data ?? []) as QualityReview[];
    const parserRuns = (parserRunsResult.data ?? []) as ParserRun[];
    const links = (linksResult.data ?? []) as RegistryLink[];

    const requirementCount = new Map<string, number>();
    requirements.forEach((requirement) => {
        requirementCount.set(
            requirement.data_source_id,
            (requirementCount.get(requirement.data_source_id) ?? 0) + 1
        );
    });

    return (
        <section className="min-h-screen bg-potomac-primary text-potomac-cream">
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-potomac-gold">
                            Trust operations
                        </p>
                        <h1 className="mt-3 font-serif text-4xl text-white md:text-5xl">
                            Data Source Registry
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-potomac-cream/70">
                            Track owner, license review, parser jobs, health,
                            freshness, citations, quality scoring, confidence,
                            and analyst review state for source-backed lunar
                            intelligence.
                        </p>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded border border-white/10 px-4 py-3">
                            <p className="text-potomac-cream/50">Sources</p>
                            <p className="mt-1 text-2xl font-semibold text-white">
                                {sources.length}
                            </p>
                        </div>
                        <div className="rounded border border-white/10 px-4 py-3">
                            <p className="text-potomac-cream/50">Needs review</p>
                            <p className="mt-1 text-2xl font-semibold text-white">
                                {
                                    sources.filter((source) =>
                                        [
                                            "not_started",
                                            "in_review",
                                            "needs_changes",
                                            "blocked",
                                        ].includes(
                                            source.analyst_review_state
                                        )
                                    ).length
                                }
                            </p>
                        </div>
                        <div className="rounded border border-white/10 px-4 py-3">
                            <p className="text-potomac-cream/50">Degraded</p>
                            <p className="mt-1 text-2xl font-semibold text-white">
                                {
                                    sources.filter((source) =>
                                        ["degraded", "failing"].includes(
                                            source.health_status
                                        )
                                    ).length
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_24rem]">
                    <main className="space-y-6">
                        {sources.length === 0 ? (
                            <div className="glass-card rounded p-6 text-potomac-cream/75">
                                No data sources have been registered yet.
                            </div>
                        ) : (
                            sources.map((source) => (
                                <article
                                    key={source.id}
                                    className="glass-card rounded p-6"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="font-serif text-2xl text-white">
                                                    {source.source_name}
                                                </h2>
                                                <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                    {statusLabel(
                                                        source.license_status
                                                    )}
                                                </span>
                                                <span className="rounded border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-cream/70">
                                                    {statusLabel(
                                                        source.health_status
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-potomac-cream/65">
                                                {source.source_key} |{" "}
                                                {source.source_owner} |{" "}
                                                {statusLabel(source.owner_kind)}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="font-semibold text-white">
                                                {source.quality_score}% quality
                                            </p>
                                            <p className="mt-1 text-potomac-cream/60">
                                                {statusLabel(
                                                    source.confidence_label
                                                )}{" "}
                                                confidence
                                            </p>
                                        </div>
                                    </div>
                                    <dl className="mt-5 grid gap-4 text-sm text-potomac-cream/70 md:grid-cols-3">
                                        <div>
                                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                Review
                                            </dt>
                                            <dd className="mt-1">
                                                {statusLabel(
                                                    source.analyst_review_state
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                Refresh
                                            </dt>
                                            <dd className="mt-1">
                                                {statusLabel(
                                                    source.refresh_frequency
                                                )}{" "}
                                                | next{" "}
                                                {formatDateTime(
                                                    source.next_refresh_at
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                Citation rules
                                            </dt>
                                            <dd className="mt-1">
                                                {requirementCount.get(
                                                    source.id
                                                ) ?? 0}{" "}
                                                tracked
                                            </dd>
                                        </div>
                                    </dl>
                                    <SourceQuickForms
                                        source={source}
                                        sources={sources}
                                    />
                                </article>
                            ))
                        )}
                    </main>

                    <aside className="space-y-8">
                        <form action={createDataSource} className="glass-card rounded p-6">
                            <h2 className="font-serif text-2xl text-white">
                                New Source
                            </h2>
                            <div className="mt-5">
                                <SourceFields />
                            </div>
                            <button className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream">
                                Add source
                            </button>
                        </form>

                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-2xl text-white">
                                Recent Evidence
                            </h2>
                            <div className="mt-5 space-y-4 text-sm">
                                {healthChecks.slice(0, 4).map((check) => (
                                    <p key={check.id} className="text-potomac-cream/70">
                                        {statusLabel(check.health_status)} health
                                        at {formatDateTime(check.checked_at)}
                                    </p>
                                ))}
                                {reviews.slice(0, 4).map((review) => (
                                    <p key={review.id} className="text-potomac-cream/70">
                                        {review.quality_score}% quality |{" "}
                                        {statusLabel(review.review_state)}
                                    </p>
                                ))}
                                {parserRuns.slice(0, 4).map((run) => (
                                    <p key={run.id} className="text-potomac-cream/70">
                                        {run.parser_key} {statusLabel(run.job_status)}
                                        : {run.records_seen} seen
                                    </p>
                                ))}
                                {links.slice(0, 4).map((link) => (
                                    <p key={link.id} className="text-potomac-cream/70">
                                        {statusLabel(link.source_kind)} linked to{" "}
                                        {link.route_path ?? link.source_slug ?? "record"}
                                    </p>
                                ))}
                                {healthChecks.length +
                                    reviews.length +
                                    parserRuns.length +
                                    links.length ===
                                0 ? (
                                    <p className="text-potomac-cream/70">
                                        No registry evidence has been recorded yet.
                                    </p>
                                ) : null}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </section>
    );
}
