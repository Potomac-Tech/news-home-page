import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type LunarCompanyTier = "public" | "member" | "scout" | "command";

export type LunarCompanyCitation = {
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

export type LunarCompanyFacility = {
    id: string;
    name: string;
    type: string;
    location: string | null;
    lunarRole: string;
    capabilities: string[];
    visibilityTier: LunarCompanyTier;
    freshnessAt: string | null;
};

export type LunarCompanyLeader = {
    id: string;
    name: string;
    title: string;
    roleArea: string | null;
    biography: string | null;
    profileUrl: string | null;
    visibilityTier: LunarCompanyTier;
};

export type LunarCompanyContract = {
    id: string;
    title: string;
    customerName: string | null;
    programName: string | null;
    role: string;
    status: string;
    obligatedValue: number | null;
    ceilingValue: number | null;
    currencyCode: string;
    awardAt: string | null;
    lunarScopeNote: string;
    sourceUrl: string | null;
    visibilityTier: LunarCompanyTier;
};

export type LunarCompanyFinancial = {
    id: string;
    metricKey: string;
    metricLabel: string;
    periodLabel: string | null;
    valueNumeric: number | null;
    valueText: string | null;
    currencyCode: string | null;
    unitLabel: string | null;
    isPublicRecord: boolean;
    licenseNotes: string | null;
    visibilityTier: LunarCompanyTier;
    freshnessAt: string | null;
};

export type LunarCompanyNewsLink = {
    id: string;
    title: string;
    url: string | null;
    publisher: string | null;
    publishedAt: string | null;
    summary: string;
    newsRelevance: string;
    visibilityTier: LunarCompanyTier;
};

export type LunarCompanyRelationship = {
    id: string;
    relatedCompanyId: string | null;
    relatedMissionId: string | null;
    kind: string;
    summary: string;
    visibilityTier: LunarCompanyTier;
};

export type LunarCompanyComparisonAttribute = {
    id: string;
    key: string;
    label: string;
    category: string;
    valueText: string | null;
    valueNumeric: number | null;
    valueDate: string | null;
    unitLabel: string | null;
    rankValue: number | null;
    visibilityTier: LunarCompanyTier;
    confidenceLabel: string;
    freshnessAt: string | null;
};

export type LunarCompanyRecord = {
    id: string;
    slug: string;
    name: string;
    legalName: string | null;
    companyType: string;
    sectors: string[];
    programs: string[];
    summary: string;
    lunarRelevance: string;
    headquarters: string | null;
    countryCode: string | null;
    websiteUrl: string | null;
    foundedYear: number | null;
    employeeCountEstimate: number | null;
    publicFinancialSummary: string | null;
    comparisonSummary: string | null;
    visibilityTier: LunarCompanyTier;
    confidenceLabel: string;
    qualityScore: number;
    analystReviewState: string;
    freshnessAt: string | null;
    lastSourceAt: string | null;
    facilities: LunarCompanyFacility[];
    leadership: LunarCompanyLeader[];
    contracts: LunarCompanyContract[];
    financials: LunarCompanyFinancial[];
    newsLinks: LunarCompanyNewsLink[];
    relationships: LunarCompanyRelationship[];
    comparisonAttributes: LunarCompanyComparisonAttribute[];
    citations: LunarCompanyCitation[];
    isFallback: boolean;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const fallbackCompanies: LunarCompanyRecord[] = [
    {
        id: "fallback-intuitive-machines",
        slug: "intuitive-machines",
        name: "Intuitive Machines",
        legalName: "Intuitive Machines, Inc.",
        companyType: "public_company",
        sectors: ["landers", "lunar data", "communications"],
        programs: ["CLPS", "Nova-C", "lunar relay"],
        summary:
            "Commercial lunar delivery and infrastructure company with lander, data, and relay-network exposure.",
        lunarRelevance:
            "A useful benchmark for tracking CLPS execution, recurring lunar delivery cadence, and surface infrastructure monetization.",
        headquarters: "Houston, Texas",
        countryCode: "US",
        websiteUrl: "https://www.intuitivemachines.com/",
        foundedYear: 2013,
        employeeCountEstimate: null,
        publicFinancialSummary:
            "Public-company filings and investor materials should be reviewed before using revenue or backlog figures.",
        comparisonSummary:
            "High lunar focus, public disclosure depth, and direct mission execution make this a core comparison row.",
        visibilityTier: "public",
        confidenceLabel: "medium",
        qualityScore: 78,
        analystReviewState: "queued",
        freshnessAt: "2026-07-01T08:00:00.000Z",
        lastSourceAt: "2026-07-01T08:00:00.000Z",
        facilities: [
            {
                id: "fallback-im-houston",
                name: "Houston operations",
                type: "headquarters",
                location: "Houston, Texas",
                lunarRole: "Mission operations, engineering, and business operations.",
                capabilities: ["mission operations", "lander integration"],
                visibilityTier: "member",
                freshnessAt: "2026-07-01T08:00:00.000Z",
            },
        ],
        leadership: [
            {
                id: "fallback-im-leadership",
                name: "Leadership roster pending",
                title: "Executive team",
                roleArea: "corporate",
                biography:
                    "Fallback row; replace with sourced leadership records after live ingestion.",
                profileUrl: null,
                visibilityTier: "member",
            },
        ],
        contracts: [
            {
                id: "fallback-im-clps",
                title: "CLPS lunar delivery activity",
                customerName: "NASA",
                programName: "Commercial Lunar Payload Services",
                role: "prime_contractor",
                status: "active",
                obligatedValue: null,
                ceilingValue: null,
                currencyCode: "USD",
                awardAt: null,
                lunarScopeNote:
                    "Track delivery task orders, payload manifests, launch windows, and surface operations milestones.",
                sourceUrl: "https://www.nasa.gov/commercial-lunar-payload-services/",
                visibilityTier: "scout",
            },
        ],
        financials: [
            {
                id: "fallback-im-market-cap",
                metricKey: "public_disclosure_depth",
                metricLabel: "Disclosure depth",
                periodLabel: "Current",
                valueNumeric: null,
                valueText: "Public-company filings available",
                currencyCode: null,
                unitLabel: null,
                isPublicRecord: true,
                licenseNotes: "Use official filings or licensed market data for numbers.",
                visibilityTier: "scout",
                freshnessAt: "2026-07-01T08:00:00.000Z",
            },
        ],
        newsLinks: [
            {
                id: "fallback-im-news",
                title: "Company source page",
                url: "https://www.intuitivemachines.com/",
                publisher: "Intuitive Machines",
                publishedAt: null,
                summary: "Official company site for source triangulation.",
                newsRelevance: "Use for official program and investor updates.",
                visibilityTier: "public",
            },
        ],
        relationships: [],
        comparisonAttributes: [
            {
                id: "fallback-im-focus",
                key: "lunar_focus",
                label: "Lunar focus",
                category: "strategy",
                valueText: "High",
                valueNumeric: 9,
                valueDate: null,
                unitLabel: "score",
                rankValue: 9,
                visibilityTier: "public",
                confidenceLabel: "medium",
                freshnessAt: "2026-07-01T08:00:00.000Z",
            },
        ],
        citations: [
            {
                id: "fallback-im-source",
                sourceName: "NASA CLPS",
                title: "Commercial Lunar Payload Services",
                url: "https://www.nasa.gov/commercial-lunar-payload-services/",
                publisher: "NASA",
                publishedAt: null,
                retrievedAt: "2026-07-01T08:00:00.000Z",
                summary:
                    "Official NASA program page used as fallback context for company coverage.",
                reviewStatus: "queued",
                confidenceLabel: "medium",
            },
        ],
        isFallback: true,
    },
    {
        id: "fallback-astrobotic",
        slug: "astrobotic",
        name: "Astrobotic",
        legalName: "Astrobotic Technology, Inc.",
        companyType: "private_company",
        sectors: ["landers", "rovers", "surface systems"],
        programs: ["CLPS", "Peregrine", "Griffin"],
        summary:
            "Lunar logistics company developing landers, rovers, and surface payload services.",
        lunarRelevance:
            "Important for delivery reliability, payload integration, and commercial surface-services competition.",
        headquarters: "Pittsburgh, Pennsylvania",
        countryCode: "US",
        websiteUrl: "https://www.astrobotic.com/",
        foundedYear: 2007,
        employeeCountEstimate: null,
        publicFinancialSummary:
            "Private-company financials require licensed sources or direct disclosures.",
        comparisonSummary:
            "Strong CLPS and surface systems relevance with lower public financial transparency than public peers.",
        visibilityTier: "public",
        confidenceLabel: "medium",
        qualityScore: 70,
        analystReviewState: "queued",
        freshnessAt: "2026-06-30T12:00:00.000Z",
        lastSourceAt: "2026-06-30T12:00:00.000Z",
        facilities: [],
        leadership: [],
        contracts: [
            {
                id: "fallback-astrobotic-clps",
                title: "CLPS delivery and surface systems watch",
                customerName: "NASA",
                programName: "Commercial Lunar Payload Services",
                role: "prime_contractor",
                status: "active",
                obligatedValue: null,
                ceilingValue: null,
                currencyCode: "USD",
                awardAt: null,
                lunarScopeNote:
                    "Monitor NASA delivery tasks, payload changes, launch windows, and surface system dependencies.",
                sourceUrl: "https://www.nasa.gov/commercial-lunar-payload-services/",
                visibilityTier: "scout",
            },
        ],
        financials: [],
        newsLinks: [],
        relationships: [],
        comparisonAttributes: [
            {
                id: "fallback-astrobotic-finance",
                key: "financial_transparency",
                label: "Financial transparency",
                category: "finance",
                valueText: "Limited public disclosure",
                valueNumeric: 3,
                valueDate: null,
                unitLabel: "score",
                rankValue: 3,
                visibilityTier: "scout",
                confidenceLabel: "medium",
                freshnessAt: "2026-06-30T12:00:00.000Z",
            },
        ],
        citations: [],
        isFallback: true,
    },
    {
        id: "fallback-firefly",
        slug: "firefly-aerospace",
        name: "Firefly Aerospace",
        legalName: "Firefly Aerospace Inc.",
        companyType: "private_company",
        sectors: ["landers", "launch", "mission services"],
        programs: ["Blue Ghost", "CLPS", "Alpha"],
        summary:
            "Launch and lunar delivery company with Blue Ghost lunar lander activity and CLPS exposure.",
        lunarRelevance:
            "Relevant for end-to-end launch plus lander economics, lunar surface data pricing, and delivery cadence.",
        headquarters: "Cedar Park, Texas",
        countryCode: "US",
        websiteUrl: "https://fireflyspace.com/",
        foundedYear: 2017,
        employeeCountEstimate: null,
        publicFinancialSummary:
            "Private-company financial values should be treated as licensed or analyst-reviewed estimates.",
        comparisonSummary:
            "Launch-plus-lander positioning makes Firefly a useful cross-market comparison row.",
        visibilityTier: "public",
        confidenceLabel: "medium",
        qualityScore: 74,
        analystReviewState: "queued",
        freshnessAt: "2026-07-01T08:00:00.000Z",
        lastSourceAt: "2026-07-01T08:00:00.000Z",
        facilities: [],
        leadership: [],
        contracts: [],
        financials: [
            {
                id: "fallback-firefly-benchmark",
                metricKey: "blue_ghost_data_benchmark_context",
                metricLabel: "Blue Ghost data benchmark context",
                periodLabel: "Task 046 model",
                valueNumeric: 155000000,
                valueText: null,
                currencyCode: "USD",
                unitLabel: "estimated full NASA-paid data cost",
                isPublicRecord: false,
                licenseNotes:
                    "Includes mission cost, data addendum, and PRISM contract context.",
                visibilityTier: "command",
                freshnessAt: "2026-07-01T08:00:00.000Z",
            },
        ],
        newsLinks: [],
        relationships: [],
        comparisonAttributes: [
            {
                id: "fallback-firefly-stack",
                key: "vertical_stack",
                label: "Launch and lander stack",
                category: "strategy",
                valueText: "Integrated launch and lunar delivery exposure",
                valueNumeric: 8,
                valueDate: null,
                unitLabel: "score",
                rankValue: 8,
                visibilityTier: "member",
                confidenceLabel: "medium",
                freshnessAt: "2026-07-01T08:00:00.000Z",
            },
        ],
        citations: [
            {
                id: "fallback-firefly-source",
                sourceName: "Firefly Aerospace",
                title: "Firefly Aerospace official site",
                url: "https://fireflyspace.com/",
                publisher: "Firefly Aerospace",
                publishedAt: null,
                retrievedAt: "2026-07-01T08:00:00.000Z",
                summary: "Official company source for fallback company context.",
                reviewStatus: "queued",
                confidenceLabel: "medium",
            },
        ],
        isFallback: true,
    },
];

function mapTier(value: string | null | undefined): LunarCompanyTier {
    if (
        value === "public" ||
        value === "member" ||
        value === "scout" ||
        value === "command"
    ) {
        return value;
    }

    return "public";
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

export function formatCompanyLabel(value: string | null | undefined) {
    return humanize(value);
}

export function formatCompanyDate(value: string | null | undefined) {
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

export function formatCompanyFreshness(value: string | null | undefined) {
    if (!value) {
        return "Freshness pending";
    }

    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
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

export function formatCompanyMoney(
    value: number | null,
    currencyCode: string | null
) {
    if (value === null || !currencyCode) {
        return "Value gated";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
    }).format(value);
}

export function companyTierLabel(tier: LunarCompanyTier) {
    if (tier === "member") {
        return "Explorer+";
    }

    if (tier === "scout") {
        return "Scout+";
    }

    if (tier === "command") {
        return "Command";
    }

    return "Public";
}

export function canReadCompanyTier({
    tier,
    canReadMember,
    canReadScout,
    canReadCommand,
}: {
    tier: LunarCompanyTier;
    canReadMember: boolean;
    canReadScout: boolean;
    canReadCommand: boolean;
}) {
    if (tier === "public") {
        return true;
    }

    if (tier === "member") {
        return canReadMember || canReadScout || canReadCommand;
    }

    if (tier === "scout") {
        return canReadScout || canReadCommand;
    }

    return canReadCommand;
}

export function companyMatchesQuery(record: LunarCompanyRecord, query: string) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        return true;
    }

    return [
        record.name,
        record.legalName,
        record.companyType,
        record.summary,
        record.lunarRelevance,
        record.headquarters,
        ...record.sectors,
        ...record.programs,
    ].some((field) => field?.toLowerCase().includes(normalized));
}

export function companyMatchesFilter(
    record: LunarCompanyRecord,
    filter: string
) {
    if (filter === "public") {
        return record.companyType === "public_company";
    }

    if (filter === "landers") {
        return record.sectors.some((sector) => sector.includes("lander"));
    }

    if (filter === "launch") {
        return record.sectors.some((sector) => sector.includes("launch"));
    }

    if (filter === "clps") {
        return record.programs.some((program) => program.toLowerCase() === "clps");
    }

    if (filter === "financials") {
        return record.financials.length > 0;
    }

    return true;
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
}): LunarCompanyCitation {
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

export async function loadLunarCompanies({
    supabase,
    includeMember = false,
    includeScout = false,
    includeCommand = false,
}: {
    supabase?: SupabaseServerClient;
    includeMember?: boolean;
    includeScout?: boolean;
    includeCommand?: boolean;
} = {}): Promise<LunarCompanyRecord[]> {
    if (!hasPotomacSupabasePublicConfig() || !supabase) {
        return fallbackCompanies;
    }

    const allowedTiers: LunarCompanyTier[] = ["public"];

    if (includeMember) {
        allowedTiers.push("member");
    }

    if (includeScout) {
        allowedTiers.push("scout");
    }

    if (includeCommand) {
        allowedTiers.push("command");
    }

    try {
        const { data, error } = await supabase
            .from("lunar_companies")
            .select(
                "id,slug,name,legal_name,company_type,sectors,lunar_programs,summary,lunar_relevance,headquarters,country_code,website_url,founded_year,employee_count_estimate,public_financial_summary,comparison_summary,visibility_tier,confidence_label,quality_score,analyst_review_state,freshness_at,last_source_at"
            )
            .eq("publication_status", "published")
            .in("visibility_tier", allowedTiers)
            .order("quality_score", { ascending: false })
            .limit(50);

        if (error) {
            throw new Error(error.message);
        }

        const rows = (data ?? []) as Array<{
            id: string;
            slug: string;
            name: string;
            legal_name: string | null;
            company_type: string;
            sectors: string[];
            lunar_programs: string[];
            summary: string;
            lunar_relevance: string;
            headquarters: string | null;
            country_code: string | null;
            website_url: string | null;
            founded_year: number | null;
            employee_count_estimate: number | null;
            public_financial_summary: string | null;
            comparison_summary: string | null;
            visibility_tier: string;
            confidence_label: string;
            quality_score: number;
            analyst_review_state: string;
            freshness_at: string | null;
            last_source_at: string | null;
        }>;

        if (rows.length === 0) {
            return fallbackCompanies;
        }

        const ids = rows.map((row) => row.id);
        const [
            facilityResult,
            leadershipResult,
            contractResult,
            financialResult,
            newsResult,
            relationshipResult,
            comparisonResult,
            citationResult,
        ] = await Promise.all([
            supabase
                .from("lunar_company_facilities")
                .select(
                    "id,company_id,facility_name,facility_type,location,lunar_role,capabilities,visibility_tier,freshness_at"
                )
                .in("company_id", ids)
                .in("visibility_tier", allowedTiers),
            supabase
                .from("lunar_company_leadership")
                .select(
                    "id,company_id,person_name,title,role_area,biography,public_profile_url,visibility_tier"
                )
                .in("company_id", ids)
                .in("visibility_tier", allowedTiers),
            supabase
                .from("lunar_company_contracts")
                .select(
                    "id,company_id,contract_title,customer_name,program_name,contract_role,contract_status,obligated_value,ceiling_value,currency_code,award_at,lunar_scope_note,source_url,visibility_tier"
                )
                .in("company_id", ids)
                .in("visibility_tier", allowedTiers),
            supabase
                .from("lunar_company_financials")
                .select(
                    "id,company_id,metric_key,metric_label,period_label,value_numeric,value_text,currency_code,unit_label,is_public_record,license_notes,visibility_tier,freshness_at"
                )
                .in("company_id", ids)
                .in("visibility_tier", allowedTiers),
            supabase
                .from("lunar_company_news_links")
                .select(
                    "id,company_id,title,url,publisher,published_at,summary,news_relevance,visibility_tier"
                )
                .in("company_id", ids)
                .in("visibility_tier", allowedTiers)
                .order("published_at", { ascending: false, nullsFirst: false }),
            supabase
                .from("lunar_company_relationships")
                .select(
                    "id,company_id,related_company_id,related_mission_id,relationship_kind,relationship_summary,visibility_tier"
                )
                .in("company_id", ids)
                .in("visibility_tier", allowedTiers),
            supabase
                .from("lunar_company_comparison_attributes")
                .select(
                    "id,company_id,attribute_key,attribute_label,category,value_text,value_numeric,value_date,unit_label,rank_value,visibility_tier,confidence_label,freshness_at"
                )
                .in("company_id", ids)
                .in("visibility_tier", allowedTiers)
                .order("display_order", { ascending: true }),
            supabase
                .from("lunar_company_source_citations")
                .select(
                    "id,company_id,source_name,title,url,publisher,published_at,retrieved_at,summary,review_status,confidence_label"
                )
                .in("company_id", ids)
                .order("display_order", { ascending: true }),
        ]);

        const firstError =
            facilityResult.error ??
            leadershipResult.error ??
            contractResult.error ??
            financialResult.error ??
            newsResult.error ??
            relationshipResult.error ??
            comparisonResult.error ??
            citationResult.error;

        if (firstError) {
            throw new Error(firstError.message);
        }

        const facilities = (facilityResult.data ?? []) as Array<{
            id: string;
            company_id: string;
            facility_name: string;
            facility_type: string;
            location: string | null;
            lunar_role: string;
            capabilities: string[];
            visibility_tier: string;
            freshness_at: string | null;
        }>;
        const leadership = (leadershipResult.data ?? []) as Array<{
            id: string;
            company_id: string;
            person_name: string;
            title: string;
            role_area: string | null;
            biography: string | null;
            public_profile_url: string | null;
            visibility_tier: string;
        }>;
        const contracts = (contractResult.data ?? []) as Array<{
            id: string;
            company_id: string;
            contract_title: string;
            customer_name: string | null;
            program_name: string | null;
            contract_role: string;
            contract_status: string;
            obligated_value: number | null;
            ceiling_value: number | null;
            currency_code: string;
            award_at: string | null;
            lunar_scope_note: string;
            source_url: string | null;
            visibility_tier: string;
        }>;
        const financials = (financialResult.data ?? []) as Array<{
            id: string;
            company_id: string;
            metric_key: string;
            metric_label: string;
            period_label: string | null;
            value_numeric: number | null;
            value_text: string | null;
            currency_code: string | null;
            unit_label: string | null;
            is_public_record: boolean;
            license_notes: string | null;
            visibility_tier: string;
            freshness_at: string | null;
        }>;
        const newsLinks = (newsResult.data ?? []) as Array<{
            id: string;
            company_id: string;
            title: string;
            url: string | null;
            publisher: string | null;
            published_at: string | null;
            summary: string;
            news_relevance: string;
            visibility_tier: string;
        }>;
        const relationships = (relationshipResult.data ?? []) as Array<{
            id: string;
            company_id: string;
            related_company_id: string | null;
            related_mission_id: string | null;
            relationship_kind: string;
            relationship_summary: string;
            visibility_tier: string;
        }>;
        const comparisonAttributes = (comparisonResult.data ?? []) as Array<{
            id: string;
            company_id: string;
            attribute_key: string;
            attribute_label: string;
            category: string;
            value_text: string | null;
            value_numeric: number | null;
            value_date: string | null;
            unit_label: string | null;
            rank_value: number | null;
            visibility_tier: string;
            confidence_label: string;
            freshness_at: string | null;
        }>;
        const citations = (citationResult.data ?? []) as Array<{
            id: string;
            company_id: string | null;
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
            id: row.id,
            slug: row.slug,
            name: row.name,
            legalName: row.legal_name,
            companyType: row.company_type,
            sectors: row.sectors,
            programs: row.lunar_programs,
            summary: row.summary,
            lunarRelevance: row.lunar_relevance,
            headquarters: row.headquarters,
            countryCode: row.country_code,
            websiteUrl: row.website_url,
            foundedYear: row.founded_year,
            employeeCountEstimate: row.employee_count_estimate,
            publicFinancialSummary: row.public_financial_summary,
            comparisonSummary: row.comparison_summary,
            visibilityTier: mapTier(row.visibility_tier),
            confidenceLabel: row.confidence_label,
            qualityScore: Number(row.quality_score),
            analystReviewState: row.analyst_review_state,
            freshnessAt: row.freshness_at,
            lastSourceAt: row.last_source_at,
            facilities: facilities
                .filter((facility) => facility.company_id === row.id)
                .map((facility) => ({
                    id: facility.id,
                    name: facility.facility_name,
                    type: facility.facility_type,
                    location: facility.location,
                    lunarRole: facility.lunar_role,
                    capabilities: facility.capabilities,
                    visibilityTier: mapTier(facility.visibility_tier),
                    freshnessAt: facility.freshness_at,
                })),
            leadership: leadership
                .filter((leader) => leader.company_id === row.id)
                .map((leader) => ({
                    id: leader.id,
                    name: leader.person_name,
                    title: leader.title,
                    roleArea: leader.role_area,
                    biography: leader.biography,
                    profileUrl: leader.public_profile_url,
                    visibilityTier: mapTier(leader.visibility_tier),
                })),
            contracts: contracts
                .filter((contract) => contract.company_id === row.id)
                .map((contract) => ({
                    id: contract.id,
                    title: contract.contract_title,
                    customerName: contract.customer_name,
                    programName: contract.program_name,
                    role: contract.contract_role,
                    status: contract.contract_status,
                    obligatedValue: contract.obligated_value,
                    ceilingValue: contract.ceiling_value,
                    currencyCode: contract.currency_code,
                    awardAt: contract.award_at,
                    lunarScopeNote: contract.lunar_scope_note,
                    sourceUrl: contract.source_url,
                    visibilityTier: mapTier(contract.visibility_tier),
                })),
            financials: financials
                .filter((financial) => financial.company_id === row.id)
                .map((financial) => ({
                    id: financial.id,
                    metricKey: financial.metric_key,
                    metricLabel: financial.metric_label,
                    periodLabel: financial.period_label,
                    valueNumeric: financial.value_numeric,
                    valueText: financial.value_text,
                    currencyCode: financial.currency_code,
                    unitLabel: financial.unit_label,
                    isPublicRecord: financial.is_public_record,
                    licenseNotes: financial.license_notes,
                    visibilityTier: mapTier(financial.visibility_tier),
                    freshnessAt: financial.freshness_at,
                })),
            newsLinks: newsLinks
                .filter((newsLink) => newsLink.company_id === row.id)
                .map((newsLink) => ({
                    id: newsLink.id,
                    title: newsLink.title,
                    url: newsLink.url,
                    publisher: newsLink.publisher,
                    publishedAt: newsLink.published_at,
                    summary: newsLink.summary,
                    newsRelevance: newsLink.news_relevance,
                    visibilityTier: mapTier(newsLink.visibility_tier),
                })),
            relationships: relationships
                .filter((relationship) => relationship.company_id === row.id)
                .map((relationship) => ({
                    id: relationship.id,
                    relatedCompanyId: relationship.related_company_id,
                    relatedMissionId: relationship.related_mission_id,
                    kind: relationship.relationship_kind,
                    summary: relationship.relationship_summary,
                    visibilityTier: mapTier(relationship.visibility_tier),
                })),
            comparisonAttributes: comparisonAttributes
                .filter((attribute) => attribute.company_id === row.id)
                .map((attribute) => ({
                    id: attribute.id,
                    key: attribute.attribute_key,
                    label: attribute.attribute_label,
                    category: attribute.category,
                    valueText: attribute.value_text,
                    valueNumeric: attribute.value_numeric,
                    valueDate: attribute.value_date,
                    unitLabel: attribute.unit_label,
                    rankValue: attribute.rank_value,
                    visibilityTier: mapTier(attribute.visibility_tier),
                    confidenceLabel: attribute.confidence_label,
                    freshnessAt: attribute.freshness_at,
                })),
            citations: citations
                .filter((citation) => citation.company_id === row.id)
                .map(mapCitation),
            isFallback: false,
        }));
    } catch {
        return fallbackCompanies;
    }
}

export async function loadLunarCompanyBySlug({
    slug,
    supabase,
    includeMember = false,
    includeScout = false,
    includeCommand = false,
}: {
    slug: string;
    supabase?: SupabaseServerClient;
    includeMember?: boolean;
    includeScout?: boolean;
    includeCommand?: boolean;
}) {
    const companies = await loadLunarCompanies({
        supabase,
        includeMember,
        includeScout,
        includeCommand,
    });

    return companies.find((company) => company.slug === slug) ?? null;
}
