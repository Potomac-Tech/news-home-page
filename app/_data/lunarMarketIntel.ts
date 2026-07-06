import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type LunarMarketTier = "public" | "member" | "scout" | "command";
export type LunarMarketMode = "procurement" | "regulatory";

export type LunarAgencyRecord = {
    id: string;
    name: string;
    acronym: string | null;
};

export type LunarCitationRecord = {
    id: string;
    sourceName: string;
    title: string;
    url: string | null;
    publisher: string | null;
    publishedAt: string | null;
    retrievedAt: string | null;
    summary: string | null;
    reviewStatus: string;
    confidenceLabel: string;
};

export type LunarProcurementRecord = {
    mode: "procurement";
    id: string;
    slug: string;
    title: string;
    kind: string;
    status: string;
    agencyId: string | null;
    agencyName: string | null;
    programName: string | null;
    externalReference: string | null;
    solicitationNumber: string | null;
    noticeId: string | null;
    summary: string;
    lunarRelevance: string;
    eligibilitySummary: string | null;
    placeOfPerformance: string | null;
    estimatedValue: number | null;
    currencyCode: string;
    postedAt: string | null;
    questionsDueAt: string | null;
    responseDueAt: string | null;
    awardExpectedAt: string | null;
    sourceUrl: string | null;
    visibilityTier: LunarMarketTier;
    confidenceLabel: string;
    qualityScore: number;
    analystReviewState: string;
    freshnessAt: string | null;
    lastSourceAt: string | null;
    citations: LunarCitationRecord[];
    isFallback: boolean;
};

export type LunarRegulatoryRecord = {
    mode: "regulatory";
    id: string;
    slug: string;
    title: string;
    kind: string;
    status: string;
    agencyId: string | null;
    agencyName: string | null;
    docketNumber: string | null;
    filingNumber: string | null;
    jurisdiction: string | null;
    affectedParties: string[];
    summary: string;
    lunarRelevance: string;
    complianceGuidance: string | null;
    riskNote: string | null;
    riskLevel: string;
    filedAt: string | null;
    publishedAt: string | null;
    commentOpenAt: string | null;
    commentDueAt: string | null;
    effectiveAt: string | null;
    sourceUrl: string | null;
    visibilityTier: LunarMarketTier;
    confidenceLabel: string;
    analystReviewState: string;
    freshnessAt: string | null;
    lastSourceAt: string | null;
    milestones: LunarPolicyMilestoneRecord[];
    citations: LunarCitationRecord[];
    isFallback: boolean;
};

export type LunarPolicyMilestoneRecord = {
    id: string;
    title: string;
    status: string;
    milestoneAt: string | null;
    summary: string;
    complianceNote: string | null;
    riskNote: string | null;
    visibilityTier: LunarMarketTier;
    confidenceLabel: string;
    freshnessAt: string | null;
};

export type LunarMarketRecord = LunarProcurementRecord | LunarRegulatoryRecord;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const fallbackProcurements: LunarProcurementRecord[] = [
    {
        mode: "procurement",
        id: "fallback-clps-instrument-rfi",
        slug: "clps-instrument-rfi",
        title: "CLPS surface instrument RFI watch",
        kind: "rfi",
        status: "open",
        agencyId: "fallback-nasa",
        agencyName: "NASA",
        programName: "Commercial Lunar Payload Services",
        externalReference: "Fallback opportunity",
        solicitationNumber: "CLPS-RFI-FALLBACK",
        noticeId: null,
        summary:
            "Representative lunar surface payload opportunity used to verify due-date, citation, and Scout gate behavior.",
        lunarRelevance:
            "Flags payloads, lander interfaces, south-pole operations, and commercial delivery constraints for Scout review.",
        eligibilitySummary:
            "Open-market and partner eligibility should be confirmed against the live solicitation source.",
        placeOfPerformance: "United States and lunar surface",
        estimatedValue: 12_000_000,
        currencyCode: "USD",
        postedAt: "2026-06-25T12:00:00.000Z",
        questionsDueAt: "2026-07-18T21:00:00.000Z",
        responseDueAt: "2026-08-02T21:00:00.000Z",
        awardExpectedAt: "2026-10-15T12:00:00.000Z",
        sourceUrl: "https://sam.gov/",
        visibilityTier: "scout",
        confidenceLabel: "medium",
        qualityScore: 72,
        analystReviewState: "queued",
        freshnessAt: "2026-07-01T08:00:00.000Z",
        lastSourceAt: "2026-07-01T08:00:00.000Z",
        citations: [
            {
                id: "fallback-clps-rfi-source",
                sourceName: "SAM.gov",
                title: "Federal opportunity source index",
                url: "https://sam.gov/",
                publisher: "U.S. General Services Administration",
                publishedAt: null,
                retrievedAt: "2026-07-01T08:00:00.000Z",
                summary:
                    "Fallback source placeholder; replace with the exact notice URL after live ingestion.",
                reviewStatus: "queued",
                confidenceLabel: "medium",
            },
        ],
        isFallback: true,
    },
    {
        mode: "procurement",
        id: "fallback-lunar-sbir",
        slug: "lunar-sbir-autonomy-topic",
        title: "Lunar autonomy SBIR/STTR topic watch",
        kind: "sbir",
        status: "forecast",
        agencyId: "fallback-nasa",
        agencyName: "NASA",
        programName: "SBIR/STTR",
        externalReference: "Fallback topic",
        solicitationNumber: null,
        noticeId: null,
        summary:
            "Forecast row for lunar autonomy, surface navigation, and mission operations software topic monitoring.",
        lunarRelevance:
            "Tracks early-stage small-business opportunities with relevance to surface operations and robotic logistics.",
        eligibilitySummary: "Small-business eligibility and phase rules require live topic review.",
        placeOfPerformance: "United States",
        estimatedValue: null,
        currencyCode: "USD",
        postedAt: null,
        questionsDueAt: null,
        responseDueAt: "2026-09-05T21:00:00.000Z",
        awardExpectedAt: null,
        sourceUrl: "https://sbir.nasa.gov/",
        visibilityTier: "scout",
        confidenceLabel: "low",
        qualityScore: 58,
        analystReviewState: "queued",
        freshnessAt: "2026-06-30T14:00:00.000Z",
        lastSourceAt: "2026-06-30T14:00:00.000Z",
        citations: [],
        isFallback: true,
    },
];

const fallbackRegulatory: LunarRegulatoryRecord[] = [
    {
        mode: "regulatory",
        id: "fallback-fcc-lunar-relay",
        slug: "fcc-lunar-relay-spectrum-watch",
        title: "FCC lunar relay spectrum watch",
        kind: "filing",
        status: "open_for_comment",
        agencyId: "fallback-fcc",
        agencyName: "FCC",
        docketNumber: "Fallback docket",
        filingNumber: null,
        jurisdiction: "United States",
        affectedParties: ["lunar relay operators", "commercial landers"],
        summary:
            "Representative filing tracker for lunar communications, relay licensing, and comment-period monitoring.",
        lunarRelevance:
            "Highlights spectrum access and relay-network risk for lunar communications providers.",
        complianceGuidance:
            "Confirm filing deadlines, attachments, and service rules against the live FCC record before action.",
        riskNote:
            "Late comments or incompatible frequency assumptions can affect mission architecture and procurement timing.",
        riskLevel: "watch",
        filedAt: "2026-06-20T12:00:00.000Z",
        publishedAt: "2026-06-22T12:00:00.000Z",
        commentOpenAt: "2026-06-24T12:00:00.000Z",
        commentDueAt: "2026-07-29T21:00:00.000Z",
        effectiveAt: null,
        sourceUrl: "https://www.fcc.gov/ecfs/search/search-filings",
        visibilityTier: "scout",
        confidenceLabel: "medium",
        analystReviewState: "queued",
        freshnessAt: "2026-07-01T08:00:00.000Z",
        lastSourceAt: "2026-07-01T08:00:00.000Z",
        milestones: [
            {
                id: "fallback-fcc-comment-due",
                title: "Comment period closes",
                status: "planned",
                milestoneAt: "2026-07-29T21:00:00.000Z",
                summary: "Fallback milestone for comment-deadline rendering.",
                complianceNote: "Verify docket-specific filing rules before submission.",
                riskNote: "Missed comment windows reduce influence on final terms.",
                visibilityTier: "scout",
                confidenceLabel: "medium",
                freshnessAt: "2026-07-01T08:00:00.000Z",
            },
        ],
        citations: [
            {
                id: "fallback-fcc-source",
                sourceName: "FCC ECFS",
                title: "FCC electronic comment filing system",
                url: "https://www.fcc.gov/ecfs/search/search-filings",
                publisher: "Federal Communications Commission",
                publishedAt: null,
                retrievedAt: "2026-07-01T08:00:00.000Z",
                summary:
                    "Fallback source placeholder; replace with the exact docket URL after live ingestion.",
                reviewStatus: "queued",
                confidenceLabel: "medium",
            },
        ],
        isFallback: true,
    },
    {
        mode: "regulatory",
        id: "fallback-faa-launch-license",
        slug: "faa-lunar-launch-license-watch",
        title: "FAA lunar launch license milestone watch",
        kind: "license",
        status: "under_review",
        agencyId: "fallback-faa",
        agencyName: "FAA",
        docketNumber: null,
        filingNumber: "Fallback license review",
        jurisdiction: "United States",
        affectedParties: ["launch providers", "payload integrators"],
        summary:
            "Milestone tracker for launch licensing, payload review timing, and commercial lunar campaign risk.",
        lunarRelevance:
            "Connects launch license timing to lunar procurement and mission-readiness schedules.",
        complianceGuidance: null,
        riskNote:
            "Schedule risk rises when licensing, environmental review, and payload integration dates diverge.",
        riskLevel: "elevated",
        filedAt: null,
        publishedAt: null,
        commentOpenAt: null,
        commentDueAt: null,
        effectiveAt: "2026-10-01T12:00:00.000Z",
        sourceUrl: "https://www.faa.gov/space",
        visibilityTier: "command",
        confidenceLabel: "low",
        analystReviewState: "queued",
        freshnessAt: "2026-06-29T14:00:00.000Z",
        lastSourceAt: "2026-06-29T14:00:00.000Z",
        milestones: [],
        citations: [],
        isFallback: true,
    },
];

function toDate(value: string | null | undefined) {
    if (!value) {
        return 0;
    }

    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mapTier(value: string | null | undefined): LunarMarketTier {
    if (
        value === "public" ||
        value === "member" ||
        value === "scout" ||
        value === "command"
    ) {
        return value;
    }

    return "scout";
}

function humanize(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function formatMarketIntelLabel(value: string | null | undefined) {
    return humanize(value);
}

export function formatMarketIntelDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatMarketIntelDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(date);
}

export function formatMarketIntelFreshness(value: string | null | undefined) {
    const timestamp = toDate(value);

    if (!timestamp) {
        return "Freshness pending";
    }

    const ageDays = Math.max(
        0,
        Math.floor((Date.now() - timestamp) / 86_400_000)
    );

    if (ageDays === 0) {
        return "Updated today";
    }

    if (ageDays === 1) {
        return "Updated 1 day ago";
    }

    return `Updated ${ageDays} days ago`;
}

export function formatCurrency(value: number | null, currencyCode: string) {
    if (value === null) {
        return "Value TBD";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
    }).format(value);
}

export function dueDateForRecord(record: LunarMarketRecord) {
    if (record.mode === "procurement") {
        return (
            record.responseDueAt ??
            record.questionsDueAt ??
            record.awardExpectedAt ??
            record.postedAt
        );
    }

    return record.commentDueAt ?? record.effectiveAt ?? record.publishedAt;
}

export function marketIntelMatchesFilter(
    record: LunarMarketRecord,
    filter: string
) {
    if (filter === "open") {
        return [
            "open",
            "questions_due",
            "responses_due",
            "open_for_comment",
        ].includes(record.status);
    }

    if (filter === "due") {
        return Boolean(dueDateForRecord(record));
    }

    if (filter === "awards") {
        return record.mode === "procurement" && record.kind === "award";
    }

    if (filter === "sbir") {
        return (
            record.mode === "procurement" &&
            ["sbir", "sttr"].includes(record.kind)
        );
    }

    if (filter === "comments") {
        return record.mode === "regulatory" && Boolean(record.commentDueAt);
    }

    if (filter === "risk") {
        return record.mode === "regulatory" && record.riskLevel !== "monitor";
    }

    return true;
}

export function marketIntelMatchesQuery(
    record: LunarMarketRecord,
    query: string
) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        return true;
    }

    const fields =
        record.mode === "procurement"
            ? [
                  record.title,
                  record.kind,
                  record.status,
                  record.agencyName,
                  record.programName,
                  record.summary,
                  record.lunarRelevance,
                  record.solicitationNumber,
              ]
            : [
                  record.title,
                  record.kind,
                  record.status,
                  record.agencyName,
                  record.jurisdiction,
                  record.summary,
                  record.lunarRelevance,
                  record.docketNumber,
                  record.riskLevel,
              ];

    return fields.some((field) => field?.toLowerCase().includes(normalized));
}

export function sortMarketIntelByDueDate(
    a: LunarMarketRecord,
    b: LunarMarketRecord
) {
    return toDate(dueDateForRecord(a)) - toDate(dueDateForRecord(b));
}

function fallbackForMode(mode: LunarMarketMode) {
    return mode === "procurement" ? fallbackProcurements : fallbackRegulatory;
}

async function loadAgencies(
    supabase: SupabaseServerClient,
    agencyIds: string[]
) {
    if (agencyIds.length === 0) {
        return new Map<string, string>();
    }

    const { data, error } = await supabase
        .from("lunar_intel_agencies")
        .select("id,name,acronym")
        .in("id", agencyIds);

    if (error) {
        throw new Error(error.message);
    }

    return new Map(
        ((data ?? []) as LunarAgencyRecord[]).map((agency) => [
            agency.id,
            agency.acronym
                ? `${agency.acronym} - ${agency.name}`
                : agency.name,
        ])
    );
}

function mapCitation(row: {
    id: string;
    source_name: string;
    title: string;
    url: string | null;
    publisher: string | null;
    published_at: string | null;
    retrieved_at: string | null;
    summary: string | null;
    review_status: string;
    confidence_label: string;
}): LunarCitationRecord {
    return {
        id: row.id,
        sourceName: row.source_name,
        title: row.title,
        url: row.url,
        publisher: row.publisher,
        publishedAt: row.published_at,
        retrievedAt: row.retrieved_at,
        summary: row.summary,
        reviewStatus: row.review_status,
        confidenceLabel: row.confidence_label,
    };
}

export async function loadLunarMarketIntel({
    mode,
    supabase,
    includePaid = false,
}: {
    mode: LunarMarketMode;
    supabase?: SupabaseServerClient;
    includePaid?: boolean;
}): Promise<LunarMarketRecord[]> {
    if (!hasPotomacSupabasePublicConfig() || !supabase) {
        return fallbackForMode(mode);
    }

    const allowedTiers = includePaid
        ? ["public", "member", "scout", "command"]
        : ["public"];

    try {
        if (mode === "procurement") {
            const { data, error } = await supabase
                .from("lunar_procurements")
                .select(
                    "id,slug,title,procurement_kind,status,agency_id,external_reference,solicitation_number,notice_id,program_name,lunar_relevance,opportunity_summary,eligibility_summary,place_of_performance,estimated_value,currency_code,posted_at,questions_due_at,response_due_at,award_expected_at,source_url,visibility_tier,confidence_label,quality_score,analyst_review_state,freshness_at,last_source_at"
                )
                .eq("publication_status", "published")
                .in("visibility_tier", allowedTiers)
                .order("response_due_at", {
                    ascending: true,
                    nullsFirst: false,
                })
                .limit(50);

            if (error) {
                throw new Error(error.message);
            }

            const rows = (data ?? []) as Array<{
                id: string;
                slug: string;
                title: string;
                procurement_kind: string;
                status: string;
                agency_id: string | null;
                external_reference: string | null;
                solicitation_number: string | null;
                notice_id: string | null;
                program_name: string | null;
                lunar_relevance: string;
                opportunity_summary: string;
                eligibility_summary: string | null;
                place_of_performance: string | null;
                estimated_value: number | null;
                currency_code: string;
                posted_at: string | null;
                questions_due_at: string | null;
                response_due_at: string | null;
                award_expected_at: string | null;
                source_url: string | null;
                visibility_tier: string;
                confidence_label: string;
                quality_score: number;
                analyst_review_state: string;
                freshness_at: string | null;
                last_source_at: string | null;
            }>;

            if (rows.length === 0) {
                return fallbackProcurements;
            }

            const ids = rows.map((row) => row.id);
            const agencyIds = rows
                .map((row) => row.agency_id)
                .filter((id): id is string => Boolean(id));
            const [agencies, citationResult] = await Promise.all([
                loadAgencies(supabase, agencyIds),
                supabase
                    .from("lunar_intel_source_citations")
                    .select(
                        "id,procurement_id,source_name,title,url,publisher,published_at,retrieved_at,summary,review_status,confidence_label"
                    )
                    .in("procurement_id", ids)
                    .order("display_order", { ascending: true }),
            ]);

            if (citationResult.error) {
                throw new Error(citationResult.error.message);
            }

            const citations = (citationResult.data ?? []) as Array<{
                id: string;
                procurement_id: string | null;
                source_name: string;
                title: string;
                url: string | null;
                publisher: string | null;
                published_at: string | null;
                retrieved_at: string | null;
                summary: string | null;
                review_status: string;
                confidence_label: string;
            }>;

            return rows.map((row) => ({
                mode: "procurement",
                id: row.id,
                slug: row.slug,
                title: row.title,
                kind: row.procurement_kind,
                status: row.status,
                agencyId: row.agency_id,
                agencyName: row.agency_id
                    ? agencies.get(row.agency_id) ?? null
                    : null,
                programName: row.program_name,
                externalReference: row.external_reference,
                solicitationNumber: row.solicitation_number,
                noticeId: row.notice_id,
                summary: row.opportunity_summary,
                lunarRelevance: row.lunar_relevance,
                eligibilitySummary: row.eligibility_summary,
                placeOfPerformance: row.place_of_performance,
                estimatedValue: row.estimated_value,
                currencyCode: row.currency_code,
                postedAt: row.posted_at,
                questionsDueAt: row.questions_due_at,
                responseDueAt: row.response_due_at,
                awardExpectedAt: row.award_expected_at,
                sourceUrl: row.source_url,
                visibilityTier: mapTier(row.visibility_tier),
                confidenceLabel: row.confidence_label,
                qualityScore: Number(row.quality_score),
                analystReviewState: row.analyst_review_state,
                freshnessAt: row.freshness_at,
                lastSourceAt: row.last_source_at,
                citations: citations
                    .filter((citation) => citation.procurement_id === row.id)
                    .map(mapCitation),
                isFallback: false,
            }));
        }

        const { data, error } = await supabase
            .from("lunar_regulatory_records")
            .select(
                "id,slug,title,regulatory_kind,status,agency_id,docket_number,filing_number,jurisdiction,affected_parties,lunar_relevance,public_summary,compliance_guidance,risk_note,filed_at,published_at,comment_open_at,comment_due_at,effective_at,source_url,visibility_tier,confidence_label,risk_level,analyst_review_state,freshness_at,last_source_at"
            )
            .eq("publication_status", "published")
            .in("visibility_tier", allowedTiers)
            .order("comment_due_at", { ascending: true, nullsFirst: false })
            .limit(50);

        if (error) {
            throw new Error(error.message);
        }

        const rows = (data ?? []) as Array<{
            id: string;
            slug: string;
            title: string;
            regulatory_kind: string;
            status: string;
            agency_id: string | null;
            docket_number: string | null;
            filing_number: string | null;
            jurisdiction: string | null;
            affected_parties: string[];
            lunar_relevance: string;
            public_summary: string;
            compliance_guidance: string | null;
            risk_note: string | null;
            filed_at: string | null;
            published_at: string | null;
            comment_open_at: string | null;
            comment_due_at: string | null;
            effective_at: string | null;
            source_url: string | null;
            visibility_tier: string;
            confidence_label: string;
            risk_level: string;
            analyst_review_state: string;
            freshness_at: string | null;
            last_source_at: string | null;
        }>;

        if (rows.length === 0) {
            return fallbackRegulatory;
        }

        const ids = rows.map((row) => row.id);
        const agencyIds = rows
            .map((row) => row.agency_id)
            .filter((id): id is string => Boolean(id));
        const [agencies, milestoneResult, citationResult] = await Promise.all([
            loadAgencies(supabase, agencyIds),
            supabase
                .from("lunar_policy_milestones")
                .select(
                    "id,regulatory_record_id,milestone_title,milestone_status,milestone_at,summary,compliance_note,risk_note,visibility_tier,confidence_label,freshness_at"
                )
                .in("regulatory_record_id", ids)
                .in("visibility_tier", allowedTiers)
                .order("milestone_at", { ascending: true, nullsFirst: false }),
            supabase
                .from("lunar_intel_source_citations")
                .select(
                    "id,regulatory_record_id,source_name,title,url,publisher,published_at,retrieved_at,summary,review_status,confidence_label"
                )
                .in("regulatory_record_id", ids)
                .order("display_order", { ascending: true }),
        ]);

        const firstError = milestoneResult.error ?? citationResult.error;

        if (firstError) {
            throw new Error(firstError.message);
        }

        const milestones = (milestoneResult.data ?? []) as Array<{
            id: string;
            regulatory_record_id: string | null;
            milestone_title: string;
            milestone_status: string;
            milestone_at: string | null;
            summary: string;
            compliance_note: string | null;
            risk_note: string | null;
            visibility_tier: string;
            confidence_label: string;
            freshness_at: string | null;
        }>;
        const citations = (citationResult.data ?? []) as Array<{
            id: string;
            regulatory_record_id: string | null;
            source_name: string;
            title: string;
            url: string | null;
            publisher: string | null;
            published_at: string | null;
            retrieved_at: string | null;
            summary: string | null;
            review_status: string;
            confidence_label: string;
        }>;

        return rows.map((row) => ({
            mode: "regulatory",
            id: row.id,
            slug: row.slug,
            title: row.title,
            kind: row.regulatory_kind,
            status: row.status,
            agencyId: row.agency_id,
            agencyName: row.agency_id ? agencies.get(row.agency_id) ?? null : null,
            docketNumber: row.docket_number,
            filingNumber: row.filing_number,
            jurisdiction: row.jurisdiction,
            affectedParties: row.affected_parties,
            summary: row.public_summary,
            lunarRelevance: row.lunar_relevance,
            complianceGuidance: row.compliance_guidance,
            riskNote: row.risk_note,
            riskLevel: row.risk_level,
            filedAt: row.filed_at,
            publishedAt: row.published_at,
            commentOpenAt: row.comment_open_at,
            commentDueAt: row.comment_due_at,
            effectiveAt: row.effective_at,
            sourceUrl: row.source_url,
            visibilityTier: mapTier(row.visibility_tier),
            confidenceLabel: row.confidence_label,
            analystReviewState: row.analyst_review_state,
            freshnessAt: row.freshness_at,
            lastSourceAt: row.last_source_at,
            milestones: milestones
                .filter((milestone) => milestone.regulatory_record_id === row.id)
                .map((milestone) => ({
                    id: milestone.id,
                    title: milestone.milestone_title,
                    status: milestone.milestone_status,
                    milestoneAt: milestone.milestone_at,
                    summary: milestone.summary,
                    complianceNote: milestone.compliance_note,
                    riskNote: milestone.risk_note,
                    visibilityTier: mapTier(milestone.visibility_tier),
                    confidenceLabel: milestone.confidence_label,
                    freshnessAt: milestone.freshness_at,
                })),
            citations: citations
                .filter((citation) => citation.regulatory_record_id === row.id)
                .map(mapCitation),
            isFallback: false,
        }));
    } catch {
        return fallbackForMode(mode);
    }
}

export async function loadLunarMarketIntelBySlug({
    mode,
    slug,
    supabase,
    includePaid = false,
}: {
    mode: LunarMarketMode;
    slug: string;
    supabase?: SupabaseServerClient;
    includePaid?: boolean;
}) {
    const records = await loadLunarMarketIntel({
        mode,
        supabase,
        includePaid,
    });

    return records.find((record) => record.slug === slug) ?? null;
}
