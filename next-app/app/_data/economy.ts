import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type PublicEconomySummary = {
    scenarioKey: string;
    scenarioLabel: string;
    headlineValue: number;
    rangeLowValue: number | null;
    rangeHighValue: number | null;
    currencyCode: string;
    outputDate: string;
    confidenceScore: number;
    confidenceLabel: string;
    methodologyNote: string;
    sourceCount: number;
    freshnessAt: string;
    isFallback: boolean;
};

export type EconomyModelVersion = {
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

export type EconomyAssumption = {
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

export type EconomySourceDocument = {
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

export type EconomyAssumptionSource = {
    id: string;
    assumption_id: string;
    source_document_id: string;
    relationship_type: string;
    notes: string | null;
    display_order: number;
    created_at: string;
};

export type EconomyScenarioEstimate = {
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
    methodology_notes: string | null;
    primary_source_document_id: string | null;
    publication_status: string;
    is_public: boolean;
    updated_at: string;
};

export type EconomyDailyOutput = {
    id: string;
    model_version_id: string;
    scenario_estimate_id: string | null;
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

export type DetailedEconomyDashboard = {
    modelVersion: EconomyModelVersion | null;
    assumptions: EconomyAssumption[];
    sources: EconomySourceDocument[];
    relationships: EconomyAssumptionSource[];
    scenarios: EconomyScenarioEstimate[];
    dailyOutputs: EconomyDailyOutput[];
};

export type EconomyCsvKind =
    | "scenarios"
    | "assumptions"
    | "sources"
    | "daily-outputs";

type EconomyDailyOutputRow = {
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
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const economyCsvKinds: EconomyCsvKind[] = [
    "scenarios",
    "assumptions",
    "sources",
    "daily-outputs",
];

export const fallbackEconomySummary: PublicEconomySummary = {
    scenarioKey: "baseline_full_nasa_paid_cost",
    scenarioLabel: "Baseline full NASA-paid cost",
    headlineValue: 155_000_000,
    rangeLowValue: 147_300_000,
    rangeHighValue: 155_000_000,
    currencyCode: "USD",
    outputDate: "2026-06-26",
    confidenceScore: 72,
    confidenceLabel: "medium",
    methodologyNote:
        "Public benchmark includes Firefly mission delivery, NASA science payload and PRISM cost basis, and the Blue Ghost data addendum.",
    sourceCount: 4,
    freshnessAt: "2026-06-26T12:00:00.000Z",
    isFallback: true,
};

function titleCaseFromKey(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function mapDailyOutput(row: EconomyDailyOutputRow): PublicEconomySummary {
    return {
        scenarioKey: row.scenario_key,
        scenarioLabel: titleCaseFromKey(row.scenario_key),
        headlineValue: row.headline_value,
        rangeLowValue: row.range_low_value,
        rangeHighValue: row.range_high_value,
        currencyCode: row.currency_code,
        outputDate: row.output_date,
        confidenceScore: row.confidence_score,
        confidenceLabel: row.confidence_label,
        methodologyNote:
            row.methodology_note ??
            "Public headline estimate. Approved members can review methodology details and source tables.",
        sourceCount: row.source_count,
        freshnessAt: row.freshness_at,
        isFallback: false,
    };
}

export async function loadPublicEconomySummary(): Promise<PublicEconomySummary> {
    if (!hasPotomacSupabasePublicConfig()) {
        return fallbackEconomySummary;
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("lunar_economy_daily_outputs")
            .select(
                "output_date,scenario_key,headline_value,range_low_value,range_high_value,currency_code,confidence_score,confidence_label,methodology_note,source_count,freshness_at"
            )
            .eq("publication_status", "published")
            .eq("is_public", true)
            .lte("output_date", new Date().toISOString().slice(0, 10))
            .order("output_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            return fallbackEconomySummary;
        }

        return mapDailyOutput(data as EconomyDailyOutputRow);
    } catch {
        return fallbackEconomySummary;
    }
}

export async function loadDetailedEconomyDashboard(
    supabase: SupabaseServerClient
): Promise<DetailedEconomyDashboard> {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const { data: modelVersionData, error: modelVersionError } = await supabase
        .from("lunar_economy_model_versions")
        .select(
            "id,version_key,version_name,status,summary,methodology_markdown,model_scope,currency_code,valid_from,valid_to,is_public,published_at,updated_at"
        )
        .eq("status", "active")
        .lte("valid_from", today)
        .or(`valid_to.is.null,valid_to.gte.${today}`)
        .or(`published_at.is.null,published_at.lte.${now}`)
        .order("valid_from", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (modelVersionError) {
        throw new Error(modelVersionError.message);
    }

    if (!modelVersionData) {
        return {
            modelVersion: null,
            assumptions: [],
            sources: [],
            relationships: [],
            scenarios: [],
            dailyOutputs: [],
        };
    }

    const modelVersion = modelVersionData as EconomyModelVersion;
    const [
        assumptionsResult,
        sourcesResult,
        scenariosResult,
        dailyOutputsResult,
    ] = await Promise.all([
        supabase
            .from("lunar_economy_model_assumptions")
            .select(
                "id,model_version_id,assumption_key,assumption_name,category,value_numeric,value_text,unit_name,unit_symbol,confidence_label,is_public,source_note,rationale,display_order,updated_at"
            )
            .eq("model_version_id", modelVersion.id)
            .order("display_order", { ascending: true }),
        supabase
            .from("lunar_economy_source_documents")
            .select(
                "id,model_version_id,source_key,title,publisher,document_type,url,published_at,retrieved_at,citation_text,summary,license_notes,review_status,confidence_label,is_public,display_order,updated_at"
            )
            .eq("model_version_id", modelVersion.id)
            .order("display_order", { ascending: true }),
        supabase
            .from("lunar_economy_scenario_estimates")
            .select(
                "id,model_version_id,scenario_key,scenario_name,scenario_type,estimate_date,estimate_value,range_low_value,range_high_value,currency_code,confidence_score,confidence_label,methodology_notes,primary_source_document_id,publication_status,is_public,updated_at"
            )
            .eq("model_version_id", modelVersion.id)
            .eq("publication_status", "published")
            .lte("estimate_date", today)
            .order("estimate_date", { ascending: false }),
        supabase
            .from("lunar_economy_daily_outputs")
            .select(
                "id,model_version_id,scenario_estimate_id,output_date,scenario_key,headline_value,range_low_value,range_high_value,currency_code,confidence_score,confidence_label,methodology_note,source_count,freshness_at,publication_status,is_public,updated_at"
            )
            .eq("model_version_id", modelVersion.id)
            .eq("publication_status", "published")
            .lte("output_date", today)
            .order("output_date", { ascending: false })
            .limit(30),
    ]);

    const firstError =
        assumptionsResult.error ??
        sourcesResult.error ??
        scenariosResult.error ??
        dailyOutputsResult.error;

    if (firstError) {
        throw new Error(firstError.message);
    }

    const assumptions = (assumptionsResult.data ?? []) as EconomyAssumption[];
    const sources = (sourcesResult.data ?? []) as EconomySourceDocument[];
    const scenarios = (scenariosResult.data ?? []) as EconomyScenarioEstimate[];
    const dailyOutputs = (dailyOutputsResult.data ?? []) as EconomyDailyOutput[];
    const assumptionIds = assumptions.map((assumption) => assumption.id);
    let relationships: EconomyAssumptionSource[] = [];

    if (assumptionIds.length > 0) {
        const relationshipsResult = await supabase
            .from("lunar_economy_assumption_sources")
            .select(
                "id,assumption_id,source_document_id,relationship_type,notes,display_order,created_at"
            )
            .in("assumption_id", assumptionIds)
            .order("display_order", { ascending: true });

        if (relationshipsResult.error) {
            throw new Error(relationshipsResult.error.message);
        }

        relationships = (relationshipsResult.data ??
            []) as EconomyAssumptionSource[];
    }

    return {
        modelVersion,
        assumptions,
        sources,
        relationships,
        scenarios,
        dailyOutputs,
    };
}

export function isEconomyCsvKind(value: string): value is EconomyCsvKind {
    return economyCsvKinds.includes(value as EconomyCsvKind);
}

function csvCell(value: string | number | null | undefined) {
    const text = value == null ? "" : String(value);

    if (/[",\r\n]/.test(text)) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}

function rowsToCsv(headers: string[], rows: Array<Array<string | number | null>>) {
    return [
        headers.map(csvCell).join(","),
        ...rows.map((row) => row.map(csvCell).join(",")),
    ].join("\r\n");
}

export function buildEconomyCsv(
    kind: EconomyCsvKind,
    dashboard: DetailedEconomyDashboard
) {
    if (kind === "scenarios") {
        return rowsToCsv(
            [
                "scenario_key",
                "scenario_name",
                "scenario_type",
                "estimate_date",
                "estimate_value",
                "range_low_value",
                "range_high_value",
                "currency_code",
                "confidence_score",
                "confidence_label",
                "methodology_notes",
            ],
            dashboard.scenarios.map((scenario) => [
                scenario.scenario_key,
                scenario.scenario_name,
                scenario.scenario_type,
                scenario.estimate_date,
                scenario.estimate_value,
                scenario.range_low_value,
                scenario.range_high_value,
                scenario.currency_code,
                scenario.confidence_score,
                scenario.confidence_label,
                scenario.methodology_notes,
            ])
        );
    }

    if (kind === "assumptions") {
        return rowsToCsv(
            [
                "assumption_key",
                "assumption_name",
                "category",
                "value_numeric",
                "value_text",
                "unit_name",
                "unit_symbol",
                "confidence_label",
                "source_note",
                "rationale",
                "updated_at",
            ],
            dashboard.assumptions.map((assumption) => [
                assumption.assumption_key,
                assumption.assumption_name,
                assumption.category,
                assumption.value_numeric,
                assumption.value_text,
                assumption.unit_name,
                assumption.unit_symbol,
                assumption.confidence_label,
                assumption.source_note,
                assumption.rationale,
                assumption.updated_at,
            ])
        );
    }

    if (kind === "sources") {
        return rowsToCsv(
            [
                "source_key",
                "title",
                "publisher",
                "document_type",
                "url",
                "published_at",
                "retrieved_at",
                "citation_text",
                "summary",
                "license_notes",
                "confidence_label",
            ],
            dashboard.sources.map((source) => [
                source.source_key,
                source.title,
                source.publisher,
                source.document_type,
                source.url,
                source.published_at,
                source.retrieved_at,
                source.citation_text,
                source.summary,
                source.license_notes,
                source.confidence_label,
            ])
        );
    }

    return rowsToCsv(
        [
            "output_date",
            "scenario_key",
            "headline_value",
            "range_low_value",
            "range_high_value",
            "currency_code",
            "confidence_score",
            "confidence_label",
            "methodology_note",
            "source_count",
            "freshness_at",
        ],
        dashboard.dailyOutputs.map((output) => [
            output.output_date,
            output.scenario_key,
            output.headline_value,
            output.range_low_value,
            output.range_high_value,
            output.currency_code,
            output.confidence_score,
            output.confidence_label,
            output.methodology_note,
            output.source_count,
            output.freshness_at,
        ])
    );
}
