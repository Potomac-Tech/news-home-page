import type { Metadata } from "next";
import { requireEconomyStaff } from "../../../lib/auth/economy";
import {
    createAssumption,
    createAssumptionSource,
    createModelVersion,
    createSourceDocument,
    updateAssumption,
    updateAssumptionSource,
    updateModelVersion,
    updateSourceDocument,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Economy Methodology Admin",
};

type ModelVersion = {
    id: string;
    version_key: string;
    version_name: string;
    status: string;
    summary: string;
    methodology_markdown: string;
    model_scope: string;
    currency_code: string;
    valid_from: string;
    valid_to: string | null;
    is_public: boolean;
    published_at: string | null;
    updated_at: string;
};

type Assumption = {
    id: string;
    model_version_id: string;
    assumption_key: string;
    assumption_name: string;
    category: string;
    value_numeric: number | null;
    value_text: string | null;
    unit_name: string | null;
    unit_symbol: string | null;
    confidence_label: string;
    is_public: boolean;
    source_note: string | null;
    rationale: string | null;
    display_order: number;
    updated_at: string;
};

type SourceDocument = {
    id: string;
    model_version_id: string;
    source_key: string;
    title: string;
    publisher: string | null;
    document_type: string;
    url: string | null;
    published_at: string | null;
    retrieved_at: string | null;
    citation_text: string | null;
    summary: string | null;
    license_notes: string | null;
    review_status: string;
    confidence_label: string;
    is_public: boolean;
    display_order: number;
    updated_at: string;
};

type AssumptionSource = {
    id: string;
    assumption_id: string;
    source_document_id: string;
    relationship_type: string;
    notes: string | null;
    display_order: number;
    created_at: string;
};

type ScenarioEstimate = {
    id: string;
    model_version_id: string;
    scenario_key: string;
    scenario_name: string;
    scenario_type: string;
    estimate_date: string;
    estimate_value: number;
    range_low_value: number | null;
    range_high_value: number | null;
    currency_code: string;
    confidence_score: number;
    confidence_label: string;
    publication_status: string;
    is_public: boolean;
    updated_at: string;
};

type DailyOutput = {
    id: string;
    model_version_id: string;
    output_date: string;
    scenario_key: string;
    headline_value: number;
    range_low_value: number | null;
    range_high_value: number | null;
    currency_code: string;
    confidence_score: number;
    confidence_label: string;
    methodology_note: string | null;
    source_count: number;
    freshness_at: string;
    publication_status: string;
    is_public: boolean;
    updated_at: string;
};

const inputClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

const textareaClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

const modelStatuses = ["draft", "active", "archived"];
const confidenceLabels = ["experimental", "low", "medium", "high"];
const sourceReviewStatuses = [
    "queued",
    "needs_review",
    "approved",
    "rejected",
    "expired",
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

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleString();
}

function toDateValue(value: string | null | undefined) {
    return value ? value.slice(0, 10) : "";
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

function formatValue(assumption: Assumption) {
    if (assumption.value_numeric != null) {
        const unit =
            assumption.unit_symbol ?? assumption.unit_name ?? "";

        return `${assumption.value_numeric.toLocaleString()}${unit ? ` ${unit}` : ""}`;
    }

    return assumption.value_text ?? "Not set";
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

function ModelVersionSelect({
    modelVersions,
    defaultValue,
}: {
    modelVersions: ModelVersion[];
    defaultValue?: string;
}) {
    return (
        <select
            required
            name="model_version_id"
            defaultValue={defaultValue ?? ""}
            className={inputClass}
        >
            <option value="" disabled>
                Select methodology version
            </option>
            {modelVersions.map((version) => (
                <option key={version.id} value={version.id}>
                    {version.version_name} ({version.version_key})
                </option>
            ))}
        </select>
    );
}

function AssumptionSelect({
    assumptions,
    defaultValue,
}: {
    assumptions: Assumption[];
    defaultValue?: string;
}) {
    return (
        <select
            required
            name="assumption_id"
            defaultValue={defaultValue ?? ""}
            className={inputClass}
        >
            <option value="" disabled>
                Select assumption
            </option>
            {assumptions.map((assumption) => (
                <option key={assumption.id} value={assumption.id}>
                    {assumption.assumption_name} ({assumption.assumption_key})
                </option>
            ))}
        </select>
    );
}

function SourceSelect({
    sources,
    defaultValue,
}: {
    sources: SourceDocument[];
    defaultValue?: string;
}) {
    return (
        <select
            required
            name="source_document_id"
            defaultValue={defaultValue ?? ""}
            className={inputClass}
        >
            <option value="" disabled>
                Select source
            </option>
            {sources.map((source) => (
                <option key={source.id} value={source.id}>
                    {source.title} ({source.source_key})
                </option>
            ))}
        </select>
    );
}

function ModelVersionFields({ version }: { version?: ModelVersion }) {
    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Version key</FieldLabel>
                <input
                    required
                    name="version_key"
                    defaultValue={version?.version_key ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Version name</FieldLabel>
                <input
                    required
                    name="version_name"
                    defaultValue={version?.version_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Status</FieldLabel>
                <SelectField
                    name="status"
                    options={modelStatuses}
                    defaultValue={version?.status ?? "draft"}
                />
            </div>
            <div>
                <FieldLabel>Model scope</FieldLabel>
                <input
                    required
                    name="model_scope"
                    defaultValue={
                        version?.model_scope ?? "lunar_economy_tracker"
                    }
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Currency</FieldLabel>
                <input
                    required
                    name="currency_code"
                    maxLength={3}
                    defaultValue={version?.currency_code ?? "USD"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Valid from</FieldLabel>
                <input
                    required
                    type="date"
                    name="valid_from"
                    defaultValue={toDateValue(version?.valid_from) || today}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Valid to</FieldLabel>
                <input
                    type="date"
                    name="valid_to"
                    defaultValue={toDateValue(version?.valid_to)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Published at</FieldLabel>
                <input
                    type="datetime-local"
                    name="published_at"
                    defaultValue={toDateTimeLocal(version?.published_at)}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                    <input
                        type="checkbox"
                        name="is_public"
                        defaultChecked={version?.is_public ?? false}
                        className="h-4 w-4 accent-potomac-gold"
                    />
                    Publicly visible when active and in date range
                </label>
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Summary</FieldLabel>
                <textarea
                    name="summary"
                    rows={3}
                    defaultValue={version?.summary ?? ""}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Methodology</FieldLabel>
                <textarea
                    name="methodology_markdown"
                    rows={8}
                    defaultValue={version?.methodology_markdown ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function AssumptionFields({
    assumption,
    modelVersions,
}: {
    assumption?: Assumption;
    modelVersions: ModelVersion[];
}) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
                <FieldLabel>Methodology version</FieldLabel>
                <ModelVersionSelect
                    modelVersions={modelVersions}
                    defaultValue={assumption?.model_version_id}
                />
            </div>
            <div>
                <FieldLabel>Assumption key</FieldLabel>
                <input
                    required
                    name="assumption_key"
                    defaultValue={assumption?.assumption_key ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Assumption name</FieldLabel>
                <input
                    required
                    name="assumption_name"
                    defaultValue={assumption?.assumption_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Category</FieldLabel>
                <input
                    required
                    name="category"
                    defaultValue={assumption?.category ?? "general"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Confidence</FieldLabel>
                <SelectField
                    name="confidence_label"
                    options={confidenceLabels}
                    defaultValue={assumption?.confidence_label ?? "experimental"}
                />
            </div>
            <div>
                <FieldLabel>Numeric value</FieldLabel>
                <input
                    name="value_numeric"
                    type="number"
                    step="0.000001"
                    defaultValue={assumption?.value_numeric ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Text value</FieldLabel>
                <input
                    name="value_text"
                    defaultValue={assumption?.value_text ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Unit name</FieldLabel>
                <input
                    name="unit_name"
                    defaultValue={assumption?.unit_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Unit symbol</FieldLabel>
                <input
                    name="unit_symbol"
                    defaultValue={assumption?.unit_symbol ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Display order</FieldLabel>
                <input
                    name="display_order"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={assumption?.display_order ?? 100}
                    className={inputClass}
                />
            </div>
            <div className="flex items-end">
                <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                    <input
                        type="checkbox"
                        name="is_public"
                        defaultChecked={assumption?.is_public ?? false}
                        className="h-4 w-4 accent-potomac-gold"
                    />
                    Public assumption
                </label>
            </div>
            <div>
                <FieldLabel>Source note</FieldLabel>
                <textarea
                    name="source_note"
                    rows={3}
                    defaultValue={assumption?.source_note ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Rationale</FieldLabel>
                <textarea
                    name="rationale"
                    rows={3}
                    defaultValue={assumption?.rationale ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function SourceFields({
    source,
    modelVersions,
}: {
    source?: SourceDocument;
    modelVersions: ModelVersion[];
}) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
                <FieldLabel>Methodology version</FieldLabel>
                <ModelVersionSelect
                    modelVersions={modelVersions}
                    defaultValue={source?.model_version_id}
                />
            </div>
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
                <FieldLabel>Title</FieldLabel>
                <input
                    required
                    name="title"
                    defaultValue={source?.title ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Publisher</FieldLabel>
                <input
                    name="publisher"
                    defaultValue={source?.publisher ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Document type</FieldLabel>
                <input
                    required
                    name="document_type"
                    defaultValue={source?.document_type ?? "source"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Review status</FieldLabel>
                <SelectField
                    name="review_status"
                    options={sourceReviewStatuses}
                    defaultValue={source?.review_status ?? "queued"}
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
                <FieldLabel>Published date</FieldLabel>
                <input
                    type="date"
                    name="source_published_at"
                    defaultValue={toDateValue(source?.published_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Retrieved at</FieldLabel>
                <input
                    type="datetime-local"
                    name="retrieved_at"
                    defaultValue={toDateTimeLocal(source?.retrieved_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Display order</FieldLabel>
                <input
                    name="display_order"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={source?.display_order ?? 100}
                    className={inputClass}
                />
            </div>
            <div className="flex items-end">
                <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                    <input
                        type="checkbox"
                        name="is_public"
                        defaultChecked={source?.is_public ?? false}
                        className="h-4 w-4 accent-potomac-gold"
                    />
                    Public source
                </label>
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>URL</FieldLabel>
                <input
                    name="url"
                    defaultValue={source?.url ?? ""}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Citation text</FieldLabel>
                <textarea
                    name="citation_text"
                    rows={3}
                    defaultValue={source?.citation_text ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Summary</FieldLabel>
                <textarea
                    name="summary"
                    rows={3}
                    defaultValue={source?.summary ?? ""}
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
        </div>
    );
}

function RelationshipFields({
    relationship,
    assumptions,
    sources,
}: {
    relationship?: AssumptionSource;
    assumptions: Assumption[];
    sources: SourceDocument[];
}) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Assumption</FieldLabel>
                <AssumptionSelect
                    assumptions={assumptions}
                    defaultValue={relationship?.assumption_id}
                />
            </div>
            <div>
                <FieldLabel>Source</FieldLabel>
                <SourceSelect
                    sources={sources}
                    defaultValue={relationship?.source_document_id}
                />
            </div>
            <div>
                <FieldLabel>Relationship</FieldLabel>
                <input
                    name="relationship_type"
                    defaultValue={relationship?.relationship_type ?? "supports"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Display order</FieldLabel>
                <input
                    name="display_order"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={relationship?.display_order ?? 100}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                    name="notes"
                    rows={3}
                    defaultValue={relationship?.notes ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function VersionName({
    versionId,
    versionsById,
}: {
    versionId: string;
    versionsById: Map<string, ModelVersion>;
}) {
    const version = versionsById.get(versionId);

    return <>{version?.version_name ?? "Unknown version"}</>;
}

export default async function AdminEconomyPage() {
    const { supabase } = await requireEconomyStaff();
    const [
        versionsResult,
        assumptionsResult,
        sourcesResult,
        relationshipsResult,
        scenariosResult,
        dailyOutputsResult,
    ] = await Promise.all([
        supabase
            .from("lunar_economy_model_versions")
            .select(
                "id,version_key,version_name,status,summary,methodology_markdown,model_scope,currency_code,valid_from,valid_to,is_public,published_at,updated_at"
            )
            .order("valid_from", { ascending: false }),
        supabase
            .from("lunar_economy_model_assumptions")
            .select(
                "id,model_version_id,assumption_key,assumption_name,category,value_numeric,value_text,unit_name,unit_symbol,confidence_label,is_public,source_note,rationale,display_order,updated_at"
            )
            .order("display_order", { ascending: true }),
        supabase
            .from("lunar_economy_source_documents")
            .select(
                "id,model_version_id,source_key,title,publisher,document_type,url,published_at,retrieved_at,citation_text,summary,license_notes,review_status,confidence_label,is_public,display_order,updated_at"
            )
            .order("display_order", { ascending: true }),
        supabase
            .from("lunar_economy_assumption_sources")
            .select(
                "id,assumption_id,source_document_id,relationship_type,notes,display_order,created_at"
            )
            .order("display_order", { ascending: true }),
        supabase
            .from("lunar_economy_scenario_estimates")
            .select(
                "id,model_version_id,scenario_key,scenario_name,scenario_type,estimate_date,estimate_value,range_low_value,range_high_value,currency_code,confidence_score,confidence_label,publication_status,is_public,updated_at"
            )
            .order("estimate_date", { ascending: false }),
        supabase
            .from("lunar_economy_daily_outputs")
            .select(
                "id,model_version_id,output_date,scenario_key,headline_value,range_low_value,range_high_value,currency_code,confidence_score,confidence_label,methodology_note,source_count,freshness_at,publication_status,is_public,updated_at"
            )
            .order("output_date", { ascending: false })
            .limit(12),
    ]);

    const firstError =
        versionsResult.error ??
        assumptionsResult.error ??
        sourcesResult.error ??
        relationshipsResult.error ??
        scenariosResult.error ??
        dailyOutputsResult.error;

    if (firstError) {
        throw new Error(firstError.message);
    }

    const modelVersions = (versionsResult.data ?? []) as ModelVersion[];
    const assumptions = (assumptionsResult.data ?? []) as Assumption[];
    const sources = (sourcesResult.data ?? []) as SourceDocument[];
    const relationships = (relationshipsResult.data ?? []) as AssumptionSource[];
    const scenarios = (scenariosResult.data ?? []) as ScenarioEstimate[];
    const dailyOutputs = (dailyOutputsResult.data ?? []) as DailyOutput[];
    const versionsById = new Map(
        modelVersions.map((version) => [version.id, version])
    );
    const assumptionsById = new Map(
        assumptions.map((assumption) => [assumption.id, assumption])
    );
    const sourcesById = new Map(sources.map((source) => [source.id, source]));
    const activeVersion =
        modelVersions.find(
            (version) => version.status === "active" && version.is_public
        ) ?? modelVersions[0];
    const activeAssumptions = activeVersion
        ? assumptions.filter(
              (assumption) => assumption.model_version_id === activeVersion.id
          )
        : [];
    const activeSources = activeVersion
        ? sources.filter((source) => source.model_version_id === activeVersion.id)
        : [];
    const approvedSourceCount = sources.filter(
        (source) => source.review_status === "approved"
    ).length;
    const publicAssumptionCount = assumptions.filter(
        (assumption) => assumption.is_public
    ).length;

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Analyst workflow
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Economy Methodology Admin
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Inspect lunar economy methodology versions, maintain
                        assumptions and source records, connect evidence to
                        inputs, and review published scenario output.
                    </p>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-4">
                    <div className="glass-card rounded p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Versions
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                            {modelVersions.length}
                        </p>
                    </div>
                    <div className="glass-card rounded p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Public inputs
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                            {publicAssumptionCount}
                        </p>
                    </div>
                    <div className="glass-card rounded p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Approved sources
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                            {approvedSourceCount}
                        </p>
                    </div>
                    <div className="glass-card rounded p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Latest output
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                            {dailyOutputs[0]
                                ? formatMoney(
                                      dailyOutputs[0].headline_value,
                                      dailyOutputs[0].currency_code
                                  )
                                : "None"}
                        </p>
                    </div>
                </div>

                <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <main className="space-y-8">
                        <section className="glass-card rounded p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="font-serif text-3xl text-white">
                                        Active Methodology Snapshot
                                    </h2>
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                        {activeVersion?.summary ||
                                            "No active methodology summary has been saved."}
                                    </p>
                                </div>
                                {activeVersion ? (
                                    <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                        {statusLabel(activeVersion.status)}
                                    </span>
                                ) : null}
                            </div>

                            {activeVersion ? (
                                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                            Methodology
                                        </h3>
                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/75">
                                            {activeVersion.methodology_markdown ||
                                                "No methodology notes yet."}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                            Version controls
                                        </h3>
                                        <dl className="mt-3 grid gap-3 text-sm text-potomac-cream/70 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-potomac-cream/45">
                                                    Key
                                                </dt>
                                                <dd>{activeVersion.version_key}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-potomac-cream/45">
                                                    Scope
                                                </dt>
                                                <dd>{activeVersion.model_scope}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-potomac-cream/45">
                                                    Valid
                                                </dt>
                                                <dd>
                                                    {formatDate(
                                                        activeVersion.valid_from
                                                    )}{" "}
                                                    -{" "}
                                                    {formatDate(
                                                        activeVersion.valid_to
                                                    )}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-potomac-cream/45">
                                                    Published
                                                </dt>
                                                <dd>
                                                    {formatDateTime(
                                                        activeVersion.published_at
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            ) : null}
                        </section>

                        <section>
                            <h2 className="font-serif text-3xl text-white">
                                Methodology Version History
                            </h2>
                            <div className="mt-5 space-y-5">
                                {modelVersions.length === 0 ? (
                                    <div className="glass-card rounded p-6 text-potomac-cream/75">
                                        No economy methodology versions yet.
                                    </div>
                                ) : (
                                    modelVersions.map((version) => (
                                        <article
                                            key={version.id}
                                            className="glass-card rounded p-6"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="font-serif text-2xl text-white">
                                                            {version.version_name}
                                                        </h3>
                                                        <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                            {statusLabel(
                                                                version.status
                                                            )}
                                                        </span>
                                                        <span className="rounded border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-cream/65">
                                                            {version.is_public
                                                                ? "Public"
                                                                : "Private"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-potomac-cream/65">
                                                        {version.version_key} |{" "}
                                                        {version.currency_code} |{" "}
                                                        Updated{" "}
                                                        {formatDateTime(
                                                            version.updated_at
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="mt-5 text-sm leading-6 text-potomac-cream/75">
                                                {version.summary ||
                                                    "No summary saved."}
                                            </p>

                                            <details className="mt-6 border-y border-white/10 py-5">
                                                <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                                    Edit methodology version
                                                </summary>
                                                <form
                                                    action={updateModelVersion}
                                                    className="mt-6"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="model_version_id"
                                                        value={version.id}
                                                    />
                                                    <ModelVersionFields
                                                        version={version}
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                    >
                                                        Save version
                                                    </button>
                                                </form>
                                            </details>
                                        </article>
                                    ))
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="font-serif text-3xl text-white">
                                Assumption Table
                            </h2>
                            <div className="mt-5 space-y-5">
                                {assumptions.length === 0 ? (
                                    <div className="glass-card rounded p-6 text-potomac-cream/75">
                                        No economy assumptions yet.
                                    </div>
                                ) : (
                                    assumptions.map((assumption) => (
                                        <article
                                            key={assumption.id}
                                            className="glass-card rounded p-6"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="font-serif text-2xl text-white">
                                                            {
                                                                assumption.assumption_name
                                                            }
                                                        </h3>
                                                        <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                            {statusLabel(
                                                                assumption.confidence_label
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-potomac-cream/65">
                                                        {assumption.category} |{" "}
                                                        <VersionName
                                                            versionId={
                                                                assumption.model_version_id
                                                            }
                                                            versionsById={
                                                                versionsById
                                                            }
                                                        />
                                                    </p>
                                                </div>
                                                <p className="text-right text-sm font-semibold text-white">
                                                    {formatValue(assumption)}
                                                </p>
                                            </div>
                                            <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                                                {assumption.rationale ||
                                                    assumption.source_note ||
                                                    "No rationale saved."}
                                            </p>

                                            <details className="mt-6 border-y border-white/10 py-5">
                                                <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                                    Edit assumption
                                                </summary>
                                                <form
                                                    action={updateAssumption}
                                                    className="mt-6"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="assumption_id"
                                                        value={assumption.id}
                                                    />
                                                    <AssumptionFields
                                                        assumption={assumption}
                                                        modelVersions={
                                                            modelVersions
                                                        }
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                    >
                                                        Save assumption
                                                    </button>
                                                </form>
                                            </details>
                                        </article>
                                    ))
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="font-serif text-3xl text-white">
                                Source Table
                            </h2>
                            <div className="mt-5 overflow-hidden rounded border border-white/10">
                                <div className="overflow-x-auto">
                                    <div className="min-w-[56rem]">
                                        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr] border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                            <span>Source</span>
                                            <span>Publisher</span>
                                            <span>Review</span>
                                            <span>Confidence</span>
                                            <span>Retrieved</span>
                                        </div>
                                        {sources.length === 0 ? (
                                            <div className="px-4 py-5 text-sm text-potomac-cream/75">
                                                No economy sources yet.
                                            </div>
                                        ) : (
                                            sources.map((source) => (
                                                <article
                                                    key={source.id}
                                                    className="border-b border-white/10 px-4 py-4 last:border-b-0"
                                                >
                                                    <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-4 text-sm text-potomac-cream/75">
                                                        <div>
                                                            <p className="font-semibold text-white">
                                                                {source.title}
                                                            </p>
                                                            <p className="mt-1 text-xs text-potomac-cream/50">
                                                                {
                                                                    source.source_key
                                                                }{" "}
                                                                |{" "}
                                                                <VersionName
                                                                    versionId={
                                                                        source.model_version_id
                                                                    }
                                                                    versionsById={
                                                                        versionsById
                                                                    }
                                                                />
                                                            </p>
                                                        </div>
                                                        <span>
                                                            {source.publisher ??
                                                                "Not set"}
                                                        </span>
                                                        <span>
                                                            {statusLabel(
                                                                source.review_status
                                                            )}
                                                        </span>
                                                        <span>
                                                            {statusLabel(
                                                                source.confidence_label
                                                            )}
                                                        </span>
                                                        <span>
                                                            {formatDateTime(
                                                                source.retrieved_at
                                                            )}
                                                        </span>
                                                    </div>
                                                    <details className="mt-4 border-t border-white/10 pt-4">
                                                        <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                                            Edit source
                                                        </summary>
                                                        <form
                                                            action={
                                                                updateSourceDocument
                                                            }
                                                            className="mt-6"
                                                        >
                                                            <input
                                                                type="hidden"
                                                                name="source_document_id"
                                                                value={source.id}
                                                            />
                                                            <SourceFields
                                                                source={source}
                                                                modelVersions={
                                                                    modelVersions
                                                                }
                                                            />
                                                            <button
                                                                type="submit"
                                                                className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                            >
                                                                Save source
                                                            </button>
                                                        </form>
                                                    </details>
                                                </article>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>

                    <aside className="space-y-8">
                        <form
                            action={createModelVersion}
                            className="glass-card rounded p-6"
                        >
                            <h2 className="font-serif text-2xl text-white">
                                New Version
                            </h2>
                            <div className="mt-5">
                                <ModelVersionFields />
                            </div>
                            <button
                                type="submit"
                                className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Create version
                            </button>
                        </form>

                        <form
                            action={createAssumption}
                            className="glass-card rounded p-6"
                        >
                            <h2 className="font-serif text-2xl text-white">
                                New Assumption
                            </h2>
                            <div className="mt-5">
                                <AssumptionFields
                                    modelVersions={modelVersions}
                                />
                            </div>
                            <button
                                type="submit"
                                className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Add assumption
                            </button>
                        </form>

                        <form
                            action={createSourceDocument}
                            className="glass-card rounded p-6"
                        >
                            <h2 className="font-serif text-2xl text-white">
                                New Source
                            </h2>
                            <div className="mt-5">
                                <SourceFields modelVersions={modelVersions} />
                            </div>
                            <button
                                type="submit"
                                className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Add source
                            </button>
                        </form>

                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-2xl text-white">
                                Evidence Links
                            </h2>
                            {assumptions.length > 0 && sources.length > 0 ? (
                                <form
                                    action={createAssumptionSource}
                                    className="mt-5 border-b border-white/10 pb-6"
                                >
                                    <RelationshipFields
                                        assumptions={assumptions}
                                        sources={sources}
                                    />
                                    <button
                                        type="submit"
                                        className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                    >
                                        Link evidence
                                    </button>
                                </form>
                            ) : (
                                <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                                    Add at least one assumption and one source to
                                    link evidence.
                                </p>
                            )}

                            <div className="mt-5 space-y-4">
                                {relationships.length === 0 ? (
                                    <p className="text-sm text-potomac-cream/70">
                                        No assumption-source links yet.
                                    </p>
                                ) : (
                                    relationships.map((relationship) => {
                                        const assumption = assumptionsById.get(
                                            relationship.assumption_id
                                        );
                                        const source = sourcesById.get(
                                            relationship.source_document_id
                                        );

                                        return (
                                            <details
                                                key={relationship.id}
                                                className="rounded border border-white/10 p-4"
                                            >
                                                <summary className="cursor-pointer text-sm font-semibold text-white">
                                                    {assumption?.assumption_name ??
                                                        "Unknown assumption"}{" "}
                                                    {"->"}{" "}
                                                    {source?.title ??
                                                        "Unknown source"}
                                                </summary>
                                                <form
                                                    action={
                                                        updateAssumptionSource
                                                    }
                                                    className="mt-5"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="relationship_id"
                                                        value={relationship.id}
                                                    />
                                                    <RelationshipFields
                                                        relationship={
                                                            relationship
                                                        }
                                                        assumptions={assumptions}
                                                        sources={sources}
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="mt-5 rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                    >
                                                        Save link
                                                    </button>
                                                </form>
                                            </details>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-2xl text-white">
                                Scenario Outputs
                            </h2>
                            <div className="mt-5 space-y-4">
                                {scenarios.length === 0 ? (
                                    <p className="text-sm text-potomac-cream/70">
                                        No scenario estimates yet.
                                    </p>
                                ) : (
                                    scenarios.slice(0, 5).map((scenario) => (
                                        <div
                                            key={scenario.id}
                                            className="rounded border border-white/10 p-4"
                                        >
                                            <p className="text-sm font-semibold text-white">
                                                {scenario.scenario_name}
                                            </p>
                                            <p className="mt-2 text-sm text-potomac-cream/70">
                                                {formatMoney(
                                                    scenario.estimate_value,
                                                    scenario.currency_code
                                                )}{" "}
                                                |{" "}
                                                {statusLabel(
                                                    scenario.publication_status
                                                )}{" "}
                                                | {scenario.confidence_score}%
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-2xl text-white">
                                Daily Output History
                            </h2>
                            <div className="mt-5 space-y-4">
                                {dailyOutputs.length === 0 ? (
                                    <p className="text-sm text-potomac-cream/70">
                                        No daily outputs yet.
                                    </p>
                                ) : (
                                    dailyOutputs.map((output) => (
                                        <div
                                            key={output.id}
                                            className="rounded border border-white/10 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {formatDate(
                                                            output.output_date
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-potomac-cream/45">
                                                        {output.scenario_key}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold text-potomac-gold">
                                                    {formatMoney(
                                                        output.headline_value,
                                                        output.currency_code
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                                {output.methodology_note ??
                                                    "No methodology note saved."}
                                            </p>
                                            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-potomac-cream/45">
                                                {output.source_count} sources |{" "}
                                                {statusLabel(
                                                    output.confidence_label
                                                )}{" "}
                                                confidence | Fresh{" "}
                                                {formatDateTime(
                                                    output.freshness_at
                                                )}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </aside>
                </div>

                {activeAssumptions.length || activeSources.length ? (
                    <section className="mt-10 glass-card rounded p-6">
                        <h2 className="font-serif text-3xl text-white">
                            Active Version Public Inputs
                        </h2>
                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                    Assumptions
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {activeAssumptions.map((assumption) => (
                                        <div
                                            key={assumption.id}
                                            className="rounded border border-white/10 p-4"
                                        >
                                            <p className="text-sm font-semibold text-white">
                                                {assumption.assumption_name}
                                            </p>
                                            <p className="mt-1 text-sm text-potomac-cream/65">
                                                {formatValue(assumption)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                    Sources
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {activeSources.map((source) => (
                                        <div
                                            key={source.id}
                                            className="rounded border border-white/10 p-4"
                                        >
                                            <p className="text-sm font-semibold text-white">
                                                {source.title}
                                            </p>
                                            <p className="mt-1 text-sm text-potomac-cream/65">
                                                {statusLabel(
                                                    source.review_status
                                                )}{" "}
                                                |{" "}
                                                {source.publisher ?? "Not set"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}
            </div>
        </section>
    );
}
