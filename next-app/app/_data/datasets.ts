import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type DatasetAccessTier = "member" | "scout" | "command" | null;

export type DatasetCatalogSource = {
    id: string;
    dataset_id: string;
    source_key: string;
    source_name: string;
    source_publisher: string | null;
    source_type: string;
    source_url: string | null;
    citation_text: string | null;
    license_notes: string | null;
    published_at: string | null;
    retrieved_at: string | null;
    is_public: boolean;
    confidence_label: string;
    display_order: number;
};

export type DatasetCatalogEntry = {
    id: string;
    dataset_key: string;
    slug: string;
    title: string;
    summary: string;
    dataset_kind: string;
    provider_name: string;
    owner_name: string | null;
    collection_name: string | null;
    availability_state: string;
    availability_note: string | null;
    access_tier_required: DatasetAccessTier;
    is_sample_available: boolean;
    sample_url: string | null;
    is_demo_available: boolean;
    demo_url: string | null;
    sample_note: string | null;
    coverage_start_at: string | null;
    coverage_end_at: string | null;
    geography_scope: string | null;
    mission_name: string | null;
    instrument_name: string | null;
    data_types: string[];
    update_frequency: string | null;
    source_landing_url: string | null;
    source_license: string | null;
    source_retrieved_at: string | null;
    release_target_date: string | null;
    publication_status: string;
    published_at: string | null;
    display_order: number;
    sources: DatasetCatalogSource[];
    isFallback: boolean;
};

type DatasetCatalogEntryRow = Omit<
    DatasetCatalogEntry,
    "sources" | "isFallback"
>;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const entryColumns = [
    "id",
    "dataset_key",
    "slug",
    "title",
    "summary",
    "dataset_kind",
    "provider_name",
    "owner_name",
    "collection_name",
    "availability_state",
    "availability_note",
    "access_tier_required",
    "is_sample_available",
    "sample_url",
    "is_demo_available",
    "demo_url",
    "sample_note",
    "coverage_start_at",
    "coverage_end_at",
    "geography_scope",
    "mission_name",
    "instrument_name",
    "data_types",
    "update_frequency",
    "source_landing_url",
    "source_license",
    "source_retrieved_at",
    "release_target_date",
    "publication_status",
    "published_at",
    "display_order",
].join(",");

const sourceColumns = [
    "id",
    "dataset_id",
    "source_key",
    "source_name",
    "source_publisher",
    "source_type",
    "source_url",
    "citation_text",
    "license_notes",
    "published_at",
    "retrieved_at",
    "is_public",
    "confidence_label",
    "display_order",
].join(",");

const fallbackRetrievedAt = "2026-06-29T13:00:00.000Z";

export const fallbackDatasetCatalogEntries: DatasetCatalogEntry[] = [
    {
        id: "fallback-nasa-pds-lunar-ode",
        dataset_key: "nasa-pds-lunar-ode",
        slug: "nasa-pds-lunar-orbital-data-explorer",
        title: "NASA PDS Lunar Orbital Data Explorer",
        summary:
            "Cross-mission lunar archive access for searching, displaying, and downloading PDS science data from major lunar orbital missions.",
        dataset_kind: "public_science",
        provider_name: "PDS Geosciences Node",
        owner_name: "NASA Planetary Data System",
        collection_name: "Lunar Orbital Data Explorer",
        availability_state: "available",
        availability_note: "Public science archive with source-hosted data access.",
        access_tier_required: null,
        is_sample_available: true,
        sample_url: "https://ode.rsl.wustl.edu/moon/",
        is_demo_available: true,
        demo_url: "https://ode.rsl.wustl.edu/moon/mapsearch",
        sample_note:
            "Use the source archive for data access and source-specific download terms.",
        coverage_start_at: null,
        coverage_end_at: null,
        geography_scope: "Moon; multi-mission orbital coverage",
        mission_name:
            "LRO, GRAIL, Clementine, Lunar Prospector, Lunar Orbiter, Chandrayaan-1",
        instrument_name: null,
        data_types: [
            "orbital imagery",
            "spectroscopy",
            "altimetry",
            "radar",
            "mission archive",
        ],
        update_frequency: "Source archive updates vary by mission and release.",
        source_landing_url: "https://ode.rsl.wustl.edu/moon/",
        source_license:
            "Public PDS archive; users must follow source archive terms and citations.",
        source_retrieved_at: fallbackRetrievedAt,
        release_target_date: null,
        publication_status: "published",
        published_at: fallbackRetrievedAt,
        display_order: 10,
        isFallback: true,
        sources: [
            {
                id: "fallback-source-pds-ode",
                dataset_id: "fallback-nasa-pds-lunar-ode",
                source_key: "pds-ode-home",
                source_name: "Lunar Orbital Data Explorer home page",
                source_publisher: "PDS Geosciences Node",
                source_type: "archive",
                source_url: "https://ode.rsl.wustl.edu/moon/",
                citation_text:
                    "PDS Geosciences Node Lunar Orbital Data Explorer page for Moon archives.",
                license_notes: "Use source archive terms and citation guidance.",
                published_at: null,
                retrieved_at: fallbackRetrievedAt,
                is_public: true,
                confidence_label: "high",
                display_order: 10,
            },
        ],
    },
    {
        id: "fallback-nasa-pds-lro-lroc-rdr",
        dataset_key: "nasa-pds-lro-lroc-rdr",
        slug: "nasa-pds-lro-lroc-reduced-data-records",
        title: "LRO LROC Reduced Data Records",
        summary:
            "Calibrated and reduced Lunar Reconnaissance Orbiter Camera products for lunar imaging, mosaics, and terrain context.",
        dataset_kind: "public_science",
        provider_name: "PDS Imaging Node / LROC Data Node",
        owner_name: "NASA Planetary Data System",
        collection_name: "LRO LROC archive",
        availability_state: "available",
        availability_note: "Public science archive with source-hosted LROC products.",
        access_tier_required: null,
        is_sample_available: true,
        sample_url: "https://pds.lroc.im-ldi.com/",
        is_demo_available: true,
        demo_url: "https://pds-imaging.jpl.nasa.gov/volumes/lro.html",
        sample_note:
            "Use the source archive for product download and citation requirements.",
        coverage_start_at: null,
        coverage_end_at: null,
        geography_scope: "Moon; LRO orbital imaging coverage",
        mission_name: "Lunar Reconnaissance Orbiter",
        instrument_name: "LROC",
        data_types: [
            "calibrated imagery",
            "reduced data records",
            "mosaics",
            "terrain context",
        ],
        update_frequency: "Periodic PDS releases.",
        source_landing_url:
            "https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn%3Anasa%3Apds%3Alro-l-lroc-5-rdr&version=3.0",
        source_license:
            "Public PDS archive; users must follow source archive terms and citations.",
        source_retrieved_at: fallbackRetrievedAt,
        release_target_date: null,
        publication_status: "published",
        published_at: fallbackRetrievedAt,
        display_order: 20,
        isFallback: true,
        sources: [
            {
                id: "fallback-source-lroc-rdr",
                dataset_id: "fallback-nasa-pds-lro-lroc-rdr",
                source_key: "pds-lroc-rdr-bundle",
                source_name: "PDS LRO LROC RDR bundle record",
                source_publisher: "NASA Planetary Data System",
                source_type: "archive",
                source_url:
                    "https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn%3Anasa%3Apds%3Alro-l-lroc-5-rdr&version=3.0",
                citation_text:
                    "PDS bundle record for LRO LROC reduced data products.",
                license_notes: "Use source archive terms and citation guidance.",
                published_at: "2023-01-01",
                retrieved_at: fallbackRetrievedAt,
                is_public: true,
                confidence_label: "high",
                display_order: 10,
            },
        ],
    },
    {
        id: "fallback-usgs-unified-map",
        dataset_key: "usgs-unified-geologic-map-moon",
        slug: "usgs-unified-geologic-map-of-the-moon",
        title: "USGS Unified Geologic Map of the Moon",
        summary:
            "Global 1:5,000,000-scale lunar geologic map that summarizes lunar geologic units and provides context for exploration planning.",
        dataset_kind: "public_science",
        provider_name: "USGS Astrogeology Science Center",
        owner_name: "U.S. Geological Survey",
        collection_name: "Unified Geologic Map of the Moon",
        availability_state: "available",
        availability_note: "Public science map and associated download products.",
        access_tier_required: null,
        is_sample_available: true,
        sample_url:
            "https://astrogeology.usgs.gov/search/map/unified_geologic_map_of_the_moon_1_5m_2020",
        is_demo_available: true,
        demo_url:
            "https://www.usgs.gov/news/national-news-release/usgs-releases-first-ever-comprehensive-geologic-map-moon",
        sample_note:
            "Use USGS source pages for authoritative downloads and citation details.",
        coverage_start_at: null,
        coverage_end_at: null,
        geography_scope: "Global lunar geology",
        mission_name: null,
        instrument_name: null,
        data_types: [
            "geologic map",
            "stratigraphy",
            "surface units",
            "planning reference",
        ],
        update_frequency: "Published map product; source updates may occur.",
        source_landing_url:
            "https://astrogeology.usgs.gov/search/map/unified_geologic_map_of_the_moon_1_5m_2020",
        source_license:
            "USGS public source; users must follow source usage and citation guidance.",
        source_retrieved_at: fallbackRetrievedAt,
        release_target_date: null,
        publication_status: "published",
        published_at: fallbackRetrievedAt,
        display_order: 30,
        isFallback: true,
        sources: [
            {
                id: "fallback-source-usgs-map",
                dataset_id: "fallback-usgs-unified-map",
                source_key: "usgs-astrogeology-map",
                source_name: "Unified Geologic Map of the Moon, 1:5M, 2020",
                source_publisher: "USGS Astrogeology Science Center",
                source_type: "map",
                source_url:
                    "https://astrogeology.usgs.gov/search/map/unified_geologic_map_of_the_moon_1_5m_2020",
                citation_text:
                    "USGS Astrogeology map product page for the unified lunar geologic map.",
                license_notes: "Use USGS source usage and citation guidance.",
                published_at: "2020-04-20",
                retrieved_at: fallbackRetrievedAt,
                is_public: true,
                confidence_label: "high",
                display_order: 10,
            },
        ],
    },
    {
        id: "fallback-potomac-site-intelligence",
        dataset_key: "potomac-lunar-site-intelligence-demo",
        slug: "potomac-lunar-site-intelligence-demo",
        title: "Potomac Lunar Site Intelligence Demo",
        summary:
            "Potomac proprietary site-scoring preview that packages public lunar context, operator needs, and proposal-ready location intelligence.",
        dataset_kind: "potomac_proprietary",
        provider_name: "Potomac Database Systems",
        owner_name: "Potomac Database Systems",
        collection_name: "Nexus lunar intelligence",
        availability_state: "preview",
        availability_note:
            "Demo entry is visible publicly; full working data is reserved for paid access.",
        access_tier_required: "scout",
        is_sample_available: true,
        sample_url: "https://potomacdb.com/nexus",
        is_demo_available: true,
        demo_url: "https://potomacdb.com/nexus",
        sample_note:
            "Public demo only; underlying enriched records remain proprietary.",
        coverage_start_at: null,
        coverage_end_at: null,
        geography_scope: "Selected lunar regions and candidate operating areas",
        mission_name: null,
        instrument_name: null,
        data_types: [
            "site scoring",
            "terrain context",
            "operator workflow",
            "GIS-ready preview",
        ],
        update_frequency: "Preview cadence controlled by Potomac analyst review.",
        source_landing_url: "https://potomacdb.com/nexus",
        source_license:
            "Potomac proprietary catalog entry; no redistribution without written permission.",
        source_retrieved_at: fallbackRetrievedAt,
        release_target_date: null,
        publication_status: "published",
        published_at: fallbackRetrievedAt,
        display_order: 40,
        isFallback: true,
        sources: [
            {
                id: "fallback-source-potomac-nexus",
                dataset_id: "fallback-potomac-site-intelligence",
                source_key: "potomac-nexus-public-page",
                source_name: "Potomac Nexus public product page",
                source_publisher: "Potomac Database Systems",
                source_type: "product",
                source_url: "https://potomacdb.com/nexus",
                citation_text:
                    "Potomac public Nexus page describing proprietary lunar site intelligence positioning.",
                license_notes:
                    "Potomac proprietary material; no redistribution without written permission.",
                published_at: null,
                retrieved_at: fallbackRetrievedAt,
                is_public: true,
                confidence_label: "medium",
                display_order: 10,
            },
        ],
    },
    {
        id: "fallback-potomac-economy-pack",
        dataset_key: "potomac-lunar-economy-benchmark-pack",
        slug: "potomac-lunar-economy-benchmark-pack",
        title: "Potomac Lunar Economy Benchmark Pack",
        summary:
            "Source-backed Potomac benchmark pack for lunar data economics, including the full NASA-paid Firefly Blue Ghost cost basis.",
        dataset_kind: "derived_model",
        provider_name: "Potomac Database Systems",
        owner_name: "Potomac Database Systems",
        collection_name: "Lunar economy intelligence",
        availability_state: "upcoming",
        availability_note:
            "Cataloged before full dataset release; current public preview is limited to methodology summaries.",
        access_tier_required: "scout",
        is_sample_available: false,
        sample_url: null,
        is_demo_available: true,
        demo_url: "https://potomacdb.com/member/economy",
        sample_note:
            "Scout and Command users can review the connected methodology dashboard after sign-in.",
        coverage_start_at: null,
        coverage_end_at: null,
        geography_scope: "Lunar economy benchmarks",
        mission_name: "Firefly Blue Ghost Mission 1",
        instrument_name: null,
        data_types: [
            "benchmark model",
            "source table",
            "cost basis",
            "economy estimate",
        ],
        update_frequency: "Updated as methodology versions are published.",
        source_landing_url: "https://potomacdb.com/member/economy",
        source_license:
            "Potomac proprietary derived model; source citations remain visible where licensed or public.",
        source_retrieved_at: fallbackRetrievedAt,
        release_target_date: "2026-07-31",
        publication_status: "published",
        published_at: fallbackRetrievedAt,
        display_order: 50,
        isFallback: true,
        sources: [
            {
                id: "fallback-source-potomac-economy",
                dataset_id: "fallback-potomac-economy-pack",
                source_key: "potomac-economy-dashboard-reference",
                source_name: "Potomac lunar economy dashboard reference",
                source_publisher: "Potomac Database Systems",
                source_type: "derived_model",
                source_url: "https://potomacdb.com/member/economy",
                citation_text:
                    "Potomac member economy route connected to the Firefly full NASA-paid cost benchmark methodology.",
                license_notes:
                    "Potomac proprietary derived model with public-source citations where permitted.",
                published_at: null,
                retrieved_at: fallbackRetrievedAt,
                is_public: true,
                confidence_label: "medium",
                display_order: 10,
            },
        ],
    },
];

function groupSourcesByDataset(sources: DatasetCatalogSource[]) {
    const groups = new Map<string, DatasetCatalogSource[]>();

    for (const source of sources) {
        const current = groups.get(source.dataset_id) ?? [];
        current.push(source);
        groups.set(source.dataset_id, current);
    }

    return groups;
}

async function loadDatasetSources(
    supabase: SupabaseServerClient,
    datasetIds: string[]
) {
    if (!datasetIds.length) {
        return [];
    }

    const { data, error } = await supabase
        .from("dataset_catalog_sources")
        .select(sourceColumns)
        .in("dataset_id", datasetIds)
        .eq("is_public", true)
        .order("display_order", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []) as unknown as DatasetCatalogSource[];
}

export async function loadDatasetCatalog(): Promise<DatasetCatalogEntry[]> {
    if (!hasPotomacSupabasePublicConfig()) {
        return fallbackDatasetCatalogEntries;
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("dataset_catalog_entries")
            .select(entryColumns)
            .eq("publication_status", "published")
            .lte("published_at", new Date().toISOString())
            .order("display_order", { ascending: true })
            .limit(48);

        if (error || !data?.length) {
            return fallbackDatasetCatalogEntries;
        }

        const entryRows = (data ?? []) as unknown as DatasetCatalogEntryRow[];
        const sources = await loadDatasetSources(
            supabase,
            entryRows.map((entry) => entry.id)
        );
        const sourcesByDataset = groupSourcesByDataset(sources);

        return entryRows.map((entry) => ({
            ...entry,
            sources: sourcesByDataset.get(entry.id) ?? [],
            isFallback: false,
        }));
    } catch {
        return fallbackDatasetCatalogEntries;
    }
}
