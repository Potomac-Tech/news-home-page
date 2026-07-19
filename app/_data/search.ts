import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { publicTierName, tierConfig } from "./tiers";
import { isHiddenLaunchPath } from "./launchVisibility";

export type SearchTier = "public" | "explorer" | "scout" | "command" | "staff";

export type SearchResultKind =
    | "article"
    | "event"
    | "company"
    | "lunar_mission"
    | "dataset"
    | "data_request"
    | "data_offer"
    | "job"
    | "procurement"
    | "regulatory_record"
    | "methodology_source"
    | "dashboard_module"
    | "calculator";

export type SearchResult = {
    id: string;
    kind: SearchResultKind;
    title: string;
    eyebrow: string;
    summary: string;
    snippet: string;
    href: string;
    tier: SearchTier;
    confidenceLabel: string;
    freshnessAt: string | null;
    isPinned: boolean;
    sourceCount: number;
    keywords: string[];
    metadata?: Record<string, unknown>;
    isFallback: boolean;
};

export type CommandPaletteEntry = {
    id: string;
    label: string;
    description: string;
    href: string;
    section: string;
    tier: SearchTier;
    shortcut?: string | null;
    isPinned: boolean;
    keywords: string[];
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const searchScopes = [
    { value: "all", label: "All" },
    { value: "article", label: "Articles" },
    { value: "event", label: "Events" },
    { value: "dataset", label: "Datasets" },
    { value: "job", label: "Jobs" },
    { value: "methodology_source", label: "Methodology" },
    { value: "dashboard_module", label: "Modules" },
    { value: "calculator", label: "Calculators" },
] as const;

const allFallbackSearchResults: SearchResult[] = [
    {
        id: "terminal",
        kind: "dashboard_module",
        title: "Lunar Intelligence Terminal",
        eyebrow: "Dashboard module",
        summary:
            "Command-center overview for lunar news, missions, companies, procurements, regulatory watch, datasets, calculators, and alerts.",
        snippet: "Jump to the main lunar industry terminal.",
        href: "/terminal",
        tier: "public",
        confidenceLabel: "high",
        freshnessAt: "2026-07-02T00:02:32.000Z",
        isPinned: true,
        sourceCount: 0,
        keywords: ["terminal", "dashboard", "lunar intelligence"],
        isFallback: true,
    },
    {
        id: "space-investment-forum-article",
        kind: "article",
        title: "Space Investment Forum convenes leaders in capital, industry, and national security",
        eyebrow: "Upcoming event",
        summary:
            "Preview of the July 21 invitation-only forum hosted by Potomac Database Systems and Meet the Future in Washington.",
        snippet:
            "The agenda spans Artemis, cislunar infrastructure, defense, workforce, capital allocation, and data intelligence.",
        href: "/news/potomac-space-investment-forum-2026",
        tier: "public",
        confidenceLabel: "high",
        freshnessAt: "2026-07-19T12:00:00.000Z",
        isPinned: true,
        sourceCount: 1,
        keywords: ["Space Investment Forum", "Potomac", "MTF", "Jim Bridenstine", "Damon Feltman", "Cosmos Club"],
        isFallback: true,
    },
    {
        id: "lunar-delivery-awards-article",
        kind: "article",
        title: "NASA commits nearly $600 million to four more lunar deliveries",
        eyebrow: "News",
        summary:
            "Market analysis of NASA's new awards to Astrobotic, Firefly Aerospace, and Intuitive Machines.",
        snippet:
            "Members receive deeper context on revenue exposure, follow-on procurements, and strategic lunar infrastructure demand.",
        href: "/news/nasa-lunar-delivery-awards-2028",
        tier: "public",
        confidenceLabel: "high",
        freshnessAt: "2026-06-30T12:00:00.000Z",
        isPinned: true,
        sourceCount: 1,
        keywords: ["news", "NASA", "CLPS", "Astrobotic", "Firefly", "Intuitive Machines"],
        isFallback: true,
    },
    {
        id: "events",
        kind: "event",
        title: "Event Calendar",
        eyebrow: "Events",
        summary:
            "Public event teasers and member-gated event detail for lunar industry meetings and Cabeus Explorer summit planning.",
        snippet: "Find public event signals and member preparation paths.",
        href: "/events",
        tier: "public",
        confidenceLabel: "medium",
        freshnessAt: "2026-06-23T22:04:25.000Z",
        isPinned: false,
        sourceCount: 0,
        keywords: ["events", "calendar", "summits"],
        isFallback: true,
    },
    {
        id: "space-industrialist-week-2026",
        kind: "event",
        title: "Space Industrialist Week",
        eyebrow: "September 2026 | Save the date",
        summary:
            "A new gathering for leading figures across the space and lunar industries, featuring the inaugural Cabeus Games.",
        snippet:
            "Dates, venue, participants, and attendance information will be announced as details are confirmed.",
        href: "/events",
        tier: "public",
        confidenceLabel: "medium",
        freshnessAt: "2026-07-19T16:00:00.000Z",
        isPinned: true,
        sourceCount: 1,
        keywords: ["Space Industrialist Week", "Cabeus Games", "September", "lunar industry", "space industry"],
        isFallback: true,
    },
    {
        id: "missions",
        kind: "lunar_mission",
        title: "Launches & Missions",
        eyebrow: "Launches & Missions",
        summary:
            "Lunar launches, spacecraft, landers, payloads, and satellites with status and source freshness.",
        snippet: "Includes Artemis, CLPS, lunar spacecraft, landers, satellites, and payloads.",
        href: "/tracker/launches",
        tier: "public",
        confidenceLabel: "medium",
        freshnessAt: "2026-06-30T12:00:00.000Z",
        isPinned: true,
        sourceCount: 1,
        keywords: ["launches", "missions", "spacecraft", "landers", "satellites", "CLPS"],
        isFallback: true,
    },
    {
        id: "companies",
        kind: "company",
        title: "Lunar Company Directory",
        eyebrow: "Companies",
        summary:
            "Search and compare lunar company profiles, programs, facilities, contracts, leadership, and sources.",
        snippet: "Includes Intuitive Machines, Astrobotic, Firefly, and comparison fields.",
        href: "/companies",
        tier: "explorer",
        confidenceLabel: "medium",
        freshnessAt: "2026-07-01T08:00:00.000Z",
        isPinned: false,
        sourceCount: 3,
        keywords: ["companies", "profiles", "CLPS", "comparison"],
        isFallback: true,
    },
    {
        id: "contract-awards",
        kind: "procurement",
        title: "New Contract Awards",
        eyebrow: "Contract Awards",
        summary: "Reviewed space and lunar contract awards with customers, vendors, dates, confidence, and citations.",
        snippet: "Directly relevant contract awards with tier-controlled value evidence.",
        href: "/tracker/contracts",
        tier: "public",
        confidenceLabel: "high",
        freshnessAt: "2026-07-13T08:10:06.779Z",
        isPinned: true,
        sourceCount: 3,
        keywords: ["contracts", "awards", "procurement", "lunar", "space"],
        isFallback: true,
    },
    {
        id: "datasets",
        kind: "dataset",
        title: "Lunar Dataset Catalog",
        eyebrow: "Datasets",
        summary:
            "Public and paid dataset catalog entries with source metadata, release states, demos, and availability labels.",
        snippet: "Find NASA PDS, LROC, USGS, Cabeus Explorer demo, and proprietary dataset records.",
        href: "/datasets",
        tier: "public",
        confidenceLabel: "high",
        freshnessAt: "2026-06-29T13:00:00.000Z",
        isPinned: false,
        sourceCount: 6,
        keywords: ["datasets", "PDS", "USGS", "release states"],
        isFallback: true,
    },
    {
        id: "procurement",
        kind: "procurement",
        title: "Lunar Procurement Hub",
        eyebrow: "Scout intelligence",
        summary:
            "Searchable opportunity and award intelligence for lunar-relevant procurements, SBIR/STTR items, and deadlines.",
        snippet: "Scout+ access unlocks opportunity records, due dates, and source posture.",
        href: "/procurement",
        tier: "scout",
        confidenceLabel: "medium",
        freshnessAt: "2026-07-01T08:00:00.000Z",
        isPinned: false,
        sourceCount: 1,
        keywords: ["procurement", "SBIR", "STTR", "awards", "RFI"],
        isFallback: true,
    },
    {
        id: "regulatory",
        kind: "regulatory_record",
        title: "Lunar Regulatory Watch",
        eyebrow: "Scout intelligence",
        summary:
            "Policy, filing, comment-period, compliance, and risk intelligence for lunar operators.",
        snippet: "Scout+ access unlocks filings, FCC watch items, milestones, and risk notes.",
        href: "/regulatory",
        tier: "scout",
        confidenceLabel: "medium",
        freshnessAt: "2026-07-01T08:00:00.000Z",
        isPinned: false,
        sourceCount: 1,
        keywords: ["regulatory", "FCC", "policy", "comments", "risk"],
        isFallback: true,
    },
    {
        id: "marketplace",
        kind: "data_request",
        title: "Data Requests and Offers",
        eyebrow: "Scout workspace",
        summary:
            "Paid data-market records for lunar data requests, data offers, evidence, and extraction-backed intelligence.",
        snippet: `Scout and ${tierConfig.enterprise.publicName} users can browse source-backed marketplace records.`,
        href: "/member/marketplace",
        tier: "scout",
        confidenceLabel: "experimental",
        freshnessAt: "2026-06-26T19:35:29.000Z",
        isPinned: false,
        sourceCount: 0,
        keywords: ["data request", "data offer", "marketplace", "sources"],
        isFallback: true,
    },
    {
        id: "jobs",
        kind: "job",
        title: "Space Sector Job Alerts",
        eyebrow: "Member module",
        summary:
            "Member-visible job alert module for lunar and space-sector hiring signals from official career sources.",
        snippet: "Find hiring alerts from NASA, SpaceX, Blue Origin, and Lockheed Martin sources.",
        href: "/member",
        tier: "explorer",
        confidenceLabel: "medium",
        freshnessAt: "2026-06-29T22:03:05.000Z",
        isPinned: false,
        sourceCount: 4,
        keywords: ["jobs", "careers", "hiring", "alerts"],
        isFallback: true,
    },
    {
        id: "calculators",
        kind: "calculator",
        title: "Lunar Mission Calculators",
        eyebrow: "Planning tools",
        summary:
            "Interactive planning calculators for mission cost, windows, RF links, thermal balance, radiation, and power.",
        snippet: "Run six local planning tools with assumptions, formulas, limitations, and citations.",
        href: "/calculators",
        tier: "explorer",
        confidenceLabel: "medium",
        freshnessAt: "2026-07-01T19:02:20.000Z",
        isPinned: false,
        sourceCount: 6,
        keywords: ["calculators", "mission cost", "RF", "thermal", "power"],
        isFallback: true,
    },
    {
        id: "methodology",
        kind: "methodology_source",
        title: "Lunar Economy Methodology Sources",
        eyebrow: "Scout methodology",
        summary:
            "Source-backed methodology and evidence records for lunar economy estimates and benchmark calculations.",
        snippet:
            "Includes Firefly Blue Ghost benchmark context using the full NASA-paid cost basis.",
        href: "/member/economy",
        tier: "scout",
        confidenceLabel: "medium",
        freshnessAt: "2026-06-26T08:14:58.000Z",
        isPinned: false,
        sourceCount: 3,
        keywords: ["methodology", "Firefly", "Blue Ghost", "economy"],
        isFallback: true,
    },
];

const fallbackSearchResults = allFallbackSearchResults.filter(
    (result) => !isHiddenLaunchPath(result.href)
);

const allFallbackCommandEntries: CommandPaletteEntry[] = [
    {
        id: "open-search",
        label: "Open search",
        description: "Search across terminal records and modules.",
        href: "/search",
        section: "Navigation",
        tier: "public",
        shortcut: "mod+k",
        isPinned: true,
        keywords: ["search", "find", "command"],
    },
    ...fallbackSearchResults
        .filter((result) => result.kind === "dashboard_module" || result.isPinned)
        .map((result) => ({
            id: `open-${result.id}`,
            label: result.kind === "dashboard_module" ? result.title : `Open ${result.title}`,
            description: result.snippet || result.summary,
            href: result.href,
            section: result.eyebrow,
            tier: result.tier,
            shortcut: result.id === "terminal" ? "g t" : null,
            isPinned: result.isPinned,
            keywords: result.keywords,
        })),
    {
        id: "open-procurement",
        label: "Open procurement hub",
        description: "Go to Scout lunar procurement and award intelligence.",
        href: "/procurement",
        section: "Lunar terminal",
        tier: "scout",
        isPinned: false,
        keywords: ["procurement", "SBIR", "STTR"],
    },
    {
        id: "open-regulatory",
        label: "Open regulatory watch",
        description: "Go to Scout regulatory and policy intelligence.",
        href: "/regulatory",
        section: "Lunar terminal",
        tier: "scout",
        isPinned: false,
        keywords: ["regulatory", "FCC", "policy"],
    },
    {
        id: "open-companies",
        label: "Open company directory",
        description: "Go to lunar company profiles and comparisons.",
        href: "/companies",
        section: "Lunar terminal",
        tier: "explorer",
        isPinned: false,
        keywords: ["companies", "profiles"],
    },
    {
        id: "open-calculators",
        label: "Open calculators",
        description: "Go to lunar mission planning calculators.",
        href: "/calculators",
        section: "Lunar terminal",
        tier: "explorer",
        isPinned: false,
        keywords: ["calculators", "planning"],
    },
];

export const fallbackCommandEntries = allFallbackCommandEntries.filter(
    (entry) => !isHiddenLaunchPath(entry.href)
);

const tierRank: Record<SearchTier, number> = {
    public: 0,
    explorer: 1,
    scout: 2,
    command: 3,
    staff: 4,
};

export function tierLabel(tier: SearchTier) {
    if (tier === "public") return "Public";
    if (tier === "explorer") return "Explorer+";
    if (tier === "scout") return "Scout+";
    if (tier === "command") return publicTierName(tier);
    return "Staff";
}

export function canPreviewTier(tier: SearchTier) {
    return tier === "public";
}

export function searchResults({
    results,
    query,
    scope,
}: {
    results: SearchResult[];
    query: string;
    scope: string;
}) {
    const normalized = query.trim().toLowerCase();

    return results
        .filter((result) => scope === "all" || result.kind === scope)
        .filter((result) => {
            if (!normalized) return true;

            return [
                result.title,
                result.eyebrow,
                result.summary,
                result.snippet,
                result.kind,
                result.tier,
                ...result.keywords,
            ].some((field) => field.toLowerCase().includes(normalized));
        })
        .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            if (tierRank[a.tier] !== tierRank[b.tier]) {
                return tierRank[a.tier] - tierRank[b.tier];
            }
            return a.title.localeCompare(b.title);
        });
}

function mapTier(value: string | null | undefined): SearchTier {
    if (
        value === "public" ||
        value === "explorer" ||
        value === "scout" ||
        value === "command" ||
        value === "staff"
    ) {
        return value;
    }

    return "explorer";
}

export async function loadSearchResults({
    supabase,
    limit = 80,
    publicOnly = false,
}: {
    supabase?: SupabaseServerClient;
    limit?: number;
    publicOnly?: boolean;
} = {}): Promise<SearchResult[]> {
    if (!hasPotomacSupabasePublicConfig() || !supabase) {
        return publicOnly
            ? fallbackSearchResults.filter((result) => result.tier === "public")
            : fallbackSearchResults;
    }

    try {
        let query = supabase
            .from("intelligence_search_records")
            .select(
                "id,source_kind,title,eyebrow,summary,snippet,route_path,visibility_tier,confidence_label,freshness_at,is_admin_pinned,source_count,keywords,metadata"
            )
            .eq("publication_status", "published")
            .eq("is_search_enabled", true);

        if (publicOnly) {
            query = query.eq("visibility_tier", "public");
        }

        const { data, error } = await query
            .order("is_admin_pinned", { ascending: false })
            .order("result_rank", { ascending: true })
            .limit(limit);

        if (error || !data?.length) {
            return publicOnly
                ? fallbackSearchResults.filter((result) => result.tier === "public")
                : fallbackSearchResults;
        }

        return (data as Array<{
            id: string;
            source_kind: SearchResultKind;
            title: string;
            eyebrow: string | null;
            summary: string | null;
            snippet: string | null;
            route_path: string;
            visibility_tier: string | null;
            confidence_label: string | null;
            freshness_at: string | null;
            is_admin_pinned: boolean;
            source_count: number | null;
            keywords: string[] | null;
            metadata: Record<string, unknown> | null;
        }>).filter((row) => !isHiddenLaunchPath(row.route_path)).map((row) => ({
            id: row.id,
            kind: row.source_kind,
            title: row.title,
            eyebrow: row.eyebrow ?? "Search result",
            summary: row.summary ?? "",
            snippet: row.snippet ?? row.summary ?? "",
            href: row.route_path,
            tier: mapTier(row.visibility_tier),
            confidenceLabel: row.confidence_label ?? "medium",
            freshnessAt: row.freshness_at,
            isPinned: row.is_admin_pinned,
            sourceCount: row.source_count ?? 0,
            keywords: row.keywords ?? [],
            metadata: row.metadata ?? {},
            isFallback: false,
        }));
    } catch {
        return publicOnly
            ? fallbackSearchResults.filter((result) => result.tier === "public")
            : fallbackSearchResults;
    }
}

export async function loadCommandPaletteEntries({
    supabase,
    publicOnly = false,
}: {
    supabase?: SupabaseServerClient;
    publicOnly?: boolean;
} = {}): Promise<CommandPaletteEntry[]> {
    if (!hasPotomacSupabasePublicConfig() || !supabase) {
        return publicOnly
            ? fallbackCommandEntries.filter((entry) => entry.tier === "public")
            : fallbackCommandEntries;
    }

    try {
        let query = supabase
            .from("intelligence_command_entries")
            .select(
                "id,label,description,route_path,keyboard_shortcut,section_label,keywords,visibility_tier,is_admin_pinned"
            )
            .eq("publication_status", "published");

        if (publicOnly) {
            query = query.eq("visibility_tier", "public");
        }

        const { data, error } = await query
            .order("is_admin_pinned", { ascending: false })
            .order("admin_pin_rank", { ascending: true, nullsFirst: false })
            .limit(40);

        if (error || !data?.length) {
            return publicOnly
                ? fallbackCommandEntries.filter((entry) => entry.tier === "public")
                : fallbackCommandEntries;
        }

        return (data as Array<{
            id: string;
            label: string;
            description: string | null;
            route_path: string;
            keyboard_shortcut: string | null;
            section_label: string | null;
            keywords: string[] | null;
            visibility_tier: string | null;
            is_admin_pinned: boolean;
        }>).filter((row) => !isHiddenLaunchPath(row.route_path)).map((row) => ({
            id: row.id,
            label: row.label,
            description: row.description ?? "",
            href: row.route_path,
            section: row.section_label ?? "Terminal",
            tier: mapTier(row.visibility_tier),
            shortcut: row.keyboard_shortcut,
            isPinned: row.is_admin_pinned,
            keywords: row.keywords ?? [],
        }));
    } catch {
        return publicOnly
            ? fallbackCommandEntries.filter((entry) => entry.tier === "public")
            : fallbackCommandEntries;
    }
}

export async function getSearchSupabaseClient() {
    if (!hasPotomacSupabasePublicConfig()) {
        return undefined;
    }

    return createClient();
}
