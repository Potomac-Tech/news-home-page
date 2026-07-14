export const productionContentTypes = [
    "cms_story",
    "carousel_slide",
    "tracker_row",
    "udri_cta",
    "pathfinder_cta",
    "source_cta",
    "auth_request_access",
    "upgrade_fixture",
    "profile_completion_fixture",
    "contract_award",
] as const;

export type ProductionContentType = (typeof productionContentTypes)[number];

export type ProductionImportAsset = {
    reference: string;
    review_status: "reviewed";
    alt_text: string;
};

export type ProductionImportRecord = {
    record_key: string;
    content_type: ProductionContentType;
    title: string;
    body_copy: string;
    approved_by: string;
    approved_at: string;
    citation_urls: string[];
    source_registry_ids: string[];
    expires_at: string;
    assets: ProductionImportAsset[];
    payload: Record<string, unknown>;
};

export type ProductionImportValidation = {
    record: ProductionImportRecord | null;
    recordKey: string;
    contentType: string;
    blockers: string[];
};

export type ProductionImportManifestResult = {
    manifestVersion: string;
    records: ProductionImportValidation[];
};

const placeholderPattern = /\b(lorem ipsum|coming soon|launch pending|placeholder|replace me|tbd|todo)\b|https?:\/\/(?:www\.)?example\.com/i;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const expectedFixtureRoutes: Partial<Record<ProductionContentType, string>> = {
    auth_request_access: "/request-access",
    upgrade_fixture: "/upgrade",
    profile_completion_fixture: "/account/profile/complete",
};

function object(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function string(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function validHttps(value: string) {
    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}

function requiredPayloadFields(type: ProductionContentType) {
    const fields: Record<ProductionContentType, string[]> = {
        cms_story: ["slug", "public_summary", "public_teaser_markdown", "body_markdown"],
        carousel_slide: ["cta_route", "visual_asset_url", "visual_asset_alt"],
        tracker_row: ["provider", "mission", "scheduled_at"],
        udri_cta: ["destination_url"],
        pathfinder_cta: ["destination_url"],
        source_cta: ["destination_url"],
        auth_request_access: ["route"],
        upgrade_fixture: ["route"],
        profile_completion_fixture: ["route"],
        contract_award: ["external_source_key", "award_date", "customer_name", "vendor_name", "relevance_statement"],
    };
    return fields[type];
}

function validateRecord(value: unknown, index: number, now: Date): ProductionImportValidation {
    const raw = object(value);
    const blockers: string[] = [];
    if (!raw) {
        return { record: null, recordKey: `row-${index + 1}`, contentType: "unknown", blockers: ["record_must_be_an_object"] };
    }

    const recordKey = string(raw.record_key) || `row-${index + 1}`;
    const contentType = string(raw.content_type);
    if (!/^[a-z0-9][a-z0-9:_-]{2,119}$/i.test(recordKey)) blockers.push("invalid_record_key");
    if (!productionContentTypes.includes(contentType as ProductionContentType)) blockers.push("unsupported_content_type");

    const title = string(raw.title);
    const bodyCopy = string(raw.body_copy);
    if (title.length < 3) blockers.push("final_title_required");
    if (bodyCopy.length < 10) blockers.push("final_body_copy_required");
    if (placeholderPattern.test(JSON.stringify(raw))) blockers.push("placeholder_copy_prohibited");

    const approvedBy = string(raw.approved_by);
    const approvedAt = string(raw.approved_at);
    if (!uuidPattern.test(approvedBy)) blockers.push("valid_approver_required");
    const approvalDate = new Date(approvedAt);
    if (!approvedAt || Number.isNaN(approvalDate.getTime()) || approvalDate > now) blockers.push("valid_approval_timestamp_required");

    const citations = Array.isArray(raw.citation_urls) ? raw.citation_urls.map(string).filter(Boolean) : [];
    if (!citations.length || citations.some((url) => !validHttps(url))) blockers.push("https_citations_required");

    const sourceIds = Array.isArray(raw.source_registry_ids) ? raw.source_registry_ids.map(string).filter(Boolean) : [];
    if (!sourceIds.length || sourceIds.some((id) => !uuidPattern.test(id))) blockers.push("valid_source_registry_ids_required");

    const expiresAt = string(raw.expires_at);
    const expirationDate = new Date(expiresAt);
    if (!expiresAt || Number.isNaN(expirationDate.getTime()) || expirationDate <= now) blockers.push("future_expiration_required");

    const assets = Array.isArray(raw.assets) ? raw.assets : [];
    const normalizedAssets: ProductionImportAsset[] = [];
    if (!assets.length) blockers.push("reviewed_asset_reference_required");
    for (const candidate of assets) {
        const asset = object(candidate);
        const reference = string(asset?.reference);
        const reviewStatus = string(asset?.review_status);
        const altText = string(asset?.alt_text);
        if (!reference || reviewStatus !== "reviewed" || altText.length < 12 || placeholderPattern.test(reference)) {
            blockers.push("unreviewed_or_incomplete_asset");
            continue;
        }
        normalizedAssets.push({ reference, review_status: "reviewed", alt_text: altText });
    }

    const payload = object(raw.payload) ?? {};
    if (productionContentTypes.includes(contentType as ProductionContentType)) {
        const type = contentType as ProductionContentType;
        for (const field of requiredPayloadFields(type)) {
            if (!string(payload[field])) blockers.push(`payload_${field}_required`);
        }
        const expectedRoute = expectedFixtureRoutes[type];
        if (expectedRoute && string(payload.route) !== expectedRoute) blockers.push("fixture_route_mismatch");
    }

    const record = blockers.some((blocker) => blocker === "record_must_be_an_object") ? null : {
        record_key: recordKey,
        content_type: contentType as ProductionContentType,
        title,
        body_copy: bodyCopy,
        approved_by: approvedBy,
        approved_at: approvedAt,
        citation_urls: citations,
        source_registry_ids: sourceIds,
        expires_at: expiresAt,
        assets: normalizedAssets,
        payload,
    };
    return { record, recordKey, contentType, blockers: [...new Set(blockers)] };
}

export function validateProductionImportManifest(input: unknown, now = new Date()): ProductionImportManifestResult {
    const manifest = object(input);
    const manifestVersion = string(manifest?.manifest_version);
    const rows = Array.isArray(manifest?.records) ? manifest.records : [];
    if (manifestVersion !== "1.0") {
        return { manifestVersion, records: [{ record: null, recordKey: "manifest", contentType: "manifest", blockers: ["manifest_version_1_0_required"] }] };
    }
    if (!rows.length || rows.length > 250) {
        return { manifestVersion, records: [{ record: null, recordKey: "manifest", contentType: "manifest", blockers: ["records_must_contain_1_to_250_items"] }] };
    }
    const records = rows.map((row, index) => validateRecord(row, index, now));
    const counts = new Map<string, number>();
    for (const item of records) counts.set(item.recordKey, (counts.get(item.recordKey) ?? 0) + 1);
    return {
        manifestVersion,
        records: records.map((item) => counts.get(item.recordKey) === 1
            ? item
            : { ...item, blockers: [...new Set([...item.blockers, "duplicate_record_key"])] }),
    };
}

export function applyApprovedSourceRegistry(
    result: ProductionImportManifestResult,
    approvedSourceIds: Set<string>,
) {
    return {
        ...result,
        records: result.records.map((item) => {
            const sourceIds = item.record?.source_registry_ids ?? [];
            const hasUnapprovedSource = sourceIds.some((id) => !approvedSourceIds.has(id));
            return hasUnapprovedSource
                ? { ...item, blockers: [...new Set([...item.blockers, "source_not_approved_for_publication"])] }
                : item;
        }),
    };
}

export function applyApprovedEditorialApprovers(
    result: ProductionImportManifestResult,
    approvedApproverIds: Set<string>,
) {
    return {
        ...result,
        records: result.records.map((item) => {
            const approverId = item.record?.approved_by;
            const validFormat = !item.blockers.includes("valid_approver_required");
            return approverId && validFormat && !approvedApproverIds.has(approverId)
                ? { ...item, blockers: [...new Set([...item.blockers, "approver_not_editor_or_admin"])] }
                : item;
        }),
    };
}
