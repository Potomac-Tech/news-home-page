import { createClient } from "../../lib/supabase/server";

export type DataMarketplaceAccessTier = "scout" | "command";

export type DataMarketplaceSourceDocument = {
    id: string;
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
    access_tier_required: DataMarketplaceAccessTier;
    review_status: string;
    confidence_label: string;
};

export type DataMarketplaceCitation = {
    id: string;
    relationship_type: string;
    page_reference: string | null;
    rationale: string | null;
    confidence_label: string;
    display_order: number;
    source: DataMarketplaceSourceDocument | null;
};

type DataMarketplaceRequestRow = {
    id: string;
    slug: string;
    title: string;
    request_summary: string;
    requester_name: string | null;
    requester_organization: string | null;
    status: string;
    access_tier_required: DataMarketplaceAccessTier;
    review_status: string;
    confidence_label: string;
    confidence_score: number;
    extraction_rationale: string | null;
    analyst_notes: string | null;
    data_type: string | null;
    requested_format: string | null;
    mission_name: string | null;
    mission_phase: string | null;
    lunar_region: string | null;
    location_name: string | null;
    instrument_name: string | null;
    needed_by: string | null;
    priority_score: number;
    published_at: string | null;
    updated_at: string;
};

type DataMarketplaceOfferRow = {
    id: string;
    slug: string;
    title: string;
    offer_summary: string;
    provider_name: string | null;
    provider_organization: string | null;
    status: string;
    access_tier_required: DataMarketplaceAccessTier;
    review_status: string;
    confidence_label: string;
    confidence_score: number;
    extraction_rationale: string | null;
    analyst_notes: string | null;
    data_type: string | null;
    delivery_mode: string | null;
    availability_state: string | null;
    mission_name: string | null;
    mission_phase: string | null;
    lunar_region: string | null;
    location_name: string | null;
    instrument_name: string | null;
    coverage_start_at: string | null;
    coverage_end_at: string | null;
    sample_url: string | null;
    published_at: string | null;
    updated_at: string;
};

type DataMarketplaceRequestSourceRow = {
    id: string;
    data_request_id: string;
    source_document_id: string;
    relationship_type: string;
    page_reference: string | null;
    rationale: string | null;
    confidence_label: string;
    display_order: number;
};

type DataMarketplaceOfferSourceRow = {
    id: string;
    data_offer_id: string;
    source_document_id: string;
    relationship_type: string;
    page_reference: string | null;
    rationale: string | null;
    confidence_label: string;
    display_order: number;
};

export type DataMarketplaceRequest = DataMarketplaceRequestRow & {
    sources: DataMarketplaceCitation[];
};

export type DataMarketplaceOffer = DataMarketplaceOfferRow & {
    sources: DataMarketplaceCitation[];
};

export type DataMarketplaceDashboard = {
    requests: DataMarketplaceRequest[];
    offers: DataMarketplaceOffer[];
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const requestColumns = [
    "id",
    "slug",
    "title",
    "request_summary",
    "requester_name",
    "requester_organization",
    "status",
    "access_tier_required",
    "review_status",
    "confidence_label",
    "confidence_score",
    "extraction_rationale",
    "analyst_notes",
    "data_type",
    "requested_format",
    "mission_name",
    "mission_phase",
    "lunar_region",
    "location_name",
    "instrument_name",
    "needed_by",
    "priority_score",
    "published_at",
    "updated_at",
].join(",");

const offerColumns = [
    "id",
    "slug",
    "title",
    "offer_summary",
    "provider_name",
    "provider_organization",
    "status",
    "access_tier_required",
    "review_status",
    "confidence_label",
    "confidence_score",
    "extraction_rationale",
    "analyst_notes",
    "data_type",
    "delivery_mode",
    "availability_state",
    "mission_name",
    "mission_phase",
    "lunar_region",
    "location_name",
    "instrument_name",
    "coverage_start_at",
    "coverage_end_at",
    "sample_url",
    "published_at",
    "updated_at",
].join(",");

const sourceDocumentColumns = [
    "id",
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
    "access_tier_required",
    "review_status",
    "confidence_label",
].join(",");

function uniqueValues(values: string[]) {
    return Array.from(new Set(values.filter(Boolean)));
}

function buildCitation(
    row: {
        id: string;
        source_document_id: string;
        relationship_type: string;
        page_reference: string | null;
        rationale: string | null;
        confidence_label: string;
        display_order: number;
    },
    sourcesById: Map<string, DataMarketplaceSourceDocument>
): DataMarketplaceCitation {
    return {
        id: row.id,
        relationship_type: row.relationship_type,
        page_reference: row.page_reference,
        rationale: row.rationale,
        confidence_label: row.confidence_label,
        display_order: row.display_order,
        source: sourcesById.get(row.source_document_id) ?? null,
    };
}

function groupRequestSources(
    rows: DataMarketplaceRequestSourceRow[],
    sourcesById: Map<string, DataMarketplaceSourceDocument>
) {
    const groups = new Map<string, DataMarketplaceCitation[]>();

    for (const row of rows) {
        const citations = groups.get(row.data_request_id) ?? [];
        citations.push(buildCitation(row, sourcesById));
        groups.set(row.data_request_id, citations);
    }

    return groups;
}

function groupOfferSources(
    rows: DataMarketplaceOfferSourceRow[],
    sourcesById: Map<string, DataMarketplaceSourceDocument>
) {
    const groups = new Map<string, DataMarketplaceCitation[]>();

    for (const row of rows) {
        const citations = groups.get(row.data_offer_id) ?? [];
        citations.push(buildCitation(row, sourcesById));
        groups.set(row.data_offer_id, citations);
    }

    return groups;
}

async function loadRequestSourceRows(
    supabase: SupabaseServerClient,
    requestIds: string[]
) {
    if (!requestIds.length) {
        return [];
    }

    const { data, error } = await supabase
        .from("data_market_request_sources")
        .select(
            "id,data_request_id,source_document_id,relationship_type,page_reference,rationale,confidence_label,display_order"
        )
        .in("data_request_id", requestIds)
        .order("display_order", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []) as unknown as DataMarketplaceRequestSourceRow[];
}

async function loadOfferSourceRows(
    supabase: SupabaseServerClient,
    offerIds: string[]
) {
    if (!offerIds.length) {
        return [];
    }

    const { data, error } = await supabase
        .from("data_market_offer_sources")
        .select(
            "id,data_offer_id,source_document_id,relationship_type,page_reference,rationale,confidence_label,display_order"
        )
        .in("data_offer_id", offerIds)
        .order("display_order", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []) as unknown as DataMarketplaceOfferSourceRow[];
}

async function loadSourceDocuments(
    supabase: SupabaseServerClient,
    sourceDocumentIds: string[]
) {
    if (!sourceDocumentIds.length) {
        return new Map<string, DataMarketplaceSourceDocument>();
    }

    const { data, error } = await supabase
        .from("data_market_source_documents")
        .select(sourceDocumentColumns)
        .in("id", sourceDocumentIds)
        .eq("review_status", "approved");

    if (error) {
        throw new Error(error.message);
    }

    const sources = (data ?? []) as unknown as DataMarketplaceSourceDocument[];

    return new Map(sources.map((source) => [source.id, source]));
}

export async function loadDataMarketplaceDashboard(
    supabase: SupabaseServerClient
): Promise<DataMarketplaceDashboard> {
    const now = new Date().toISOString();
    const [requestsResult, offersResult] = await Promise.all([
        supabase
            .from("data_market_data_requests")
            .select(requestColumns)
            .eq("review_status", "approved")
            .in("status", ["open", "matched", "fulfilled"])
            .lte("published_at", now)
            .order("published_at", { ascending: false })
            .limit(24),
        supabase
            .from("data_market_data_offers")
            .select(offerColumns)
            .eq("review_status", "approved")
            .in("status", ["available", "matched", "fulfilled"])
            .lte("published_at", now)
            .order("published_at", { ascending: false })
            .limit(24),
    ]);

    const firstError = requestsResult.error ?? offersResult.error;

    if (firstError) {
        throw new Error(firstError.message);
    }

    const requestRows = (requestsResult.data ??
        []) as unknown as DataMarketplaceRequestRow[];
    const offerRows = (offersResult.data ??
        []) as unknown as DataMarketplaceOfferRow[];
    const requestIds = requestRows.map((request) => request.id);
    const offerIds = offerRows.map((offer) => offer.id);
    const [requestSourceRows, offerSourceRows] = await Promise.all([
        loadRequestSourceRows(supabase, requestIds),
        loadOfferSourceRows(supabase, offerIds),
    ]);
    const sourceDocumentIds = uniqueValues([
        ...requestSourceRows.map((row) => row.source_document_id),
        ...offerSourceRows.map((row) => row.source_document_id),
    ]);
    const sourcesById = await loadSourceDocuments(supabase, sourceDocumentIds);
    const requestSourcesById = groupRequestSources(
        requestSourceRows,
        sourcesById
    );
    const offerSourcesById = groupOfferSources(offerSourceRows, sourcesById);

    return {
        requests: requestRows.map((request) => ({
            ...request,
            sources: requestSourcesById.get(request.id) ?? [],
        })),
        offers: offerRows.map((offer) => ({
            ...offer,
            sources: offerSourcesById.get(offer.id) ?? [],
        })),
    };
}
