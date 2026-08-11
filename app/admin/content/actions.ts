"use server";

import { revalidatePath } from "next/cache";
import { requireEditorialStaff } from "../../../lib/auth/editorial";
import {
    readImageDimensions,
    safeCtaObjectName,
    validateCtaImageFile,
} from "../../../lib/assets/cta-images";
import {
    applyApprovedEditorialApprovers,
    applyApprovedSourceRegistry,
    validateProductionImportManifest,
} from "../../../lib/content/production-import";

const bucket = "content-submissions";
const contentTypes = [
    "homepage_slide", "carousel_visual", "tracker_row", "source_citation",
    "house_ad", "pathfinder_cta", "source_cta", "contract_award",
    "public_empty_state",
] as const;
const origins = [
    "ceo_provided", "editor_authored", "partner_provided", "licensed_import",
] as const;

function required(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();
    if (!value) throw new Error(`Missing ${key}.`);
    return value;
}

function optional(formData: FormData, key: string) {
    return String(formData.get(key) ?? "").trim() || null;
}

function destination(formData: FormData) {
    const value = optional(formData, "destination_url");
    if (!value) return null;
    if (value.startsWith("/") && !value.startsWith("//")) return value;

    const url = new URL(value);
    if (url.protocol !== "https:") {
        throw new Error("Destination URLs must use HTTPS or a local site path.");
    }
    return url.toString();
}

function allowed<T extends readonly string[]>(formData: FormData, key: string, values: T) {
    const value = required(formData, key);
    if (!values.includes(value)) throw new Error(`Invalid ${key}.`);
    return value;
}

function defaultExpiration(contentType: string) {
    const days = contentType === "tracker_row" ? 7
        : ["homepage_slide", "carousel_visual"].includes(contentType) ? 14
        : 30;
    return new Date(Date.now() + days * 86_400_000).toISOString();
}

function expiration(formData: FormData, contentType: string) {
    const raw = optional(formData, "expires_at");
    if (!raw) return defaultExpiration(contentType);
    const date = new Date(raw);
    if (Number.isNaN(date.getTime()) || date <= new Date()) {
        throw new Error("Expiration must be in the future.");
    }
    return date.toISOString();
}

function citations(formData: FormData) {
    return required(formData, "citation_urls")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
            const url = new URL(item);
            if (url.protocol !== "https:") throw new Error("Citations must use HTTPS.");
            return url.toString();
        });
}

export async function createContentSubmission(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff("/admin/content");
    const contentType = allowed(formData, "content_type", contentTypes);
    const file = formData.get("asset");
    let assetFields: Record<string, string | number> = {};
    let objectPath: string | null = null;

    if (file instanceof File && file.size > 0) {
        validateCtaImageFile(file);
        const bytes = new Uint8Array(await file.arrayBuffer());
        const dimensions = readImageDimensions(bytes, file.type);
        objectPath = `${contentType}/${safeCtaObjectName(file.name)}`;
        const { error } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
        });
        if (error) throw new Error(error.message);
        assetFields = {
            storage_bucket: bucket,
            storage_object_path: objectPath,
            asset_mime_type: file.type,
            asset_size_bytes: file.size,
            asset_width_px: dimensions.width,
            asset_height_px: dimensions.height,
            asset_alt_text: required(formData, "asset_alt_text"),
        };
    }

    const { error } = await supabase.from("content_submissions").insert({
        content_type: contentType,
        title: required(formData, "title"),
        body_copy: required(formData, "body_copy"),
        destination_url: destination(formData),
        citation_urls: citations(formData),
        source_note: required(formData, "source_note"),
        content_origin: allowed(formData, "content_origin", origins),
        copy_owner_confirmed: formData.get("copy_owner_confirmed") === "on",
        scheduled_at: optional(formData, "scheduled_at")
            ? new Date(required(formData, "scheduled_at")).toISOString()
            : null,
        expires_at: expiration(formData, contentType),
        expiration_exception_reason: optional(formData, "expiration_exception_reason"),
        expiration_exception_approved_by: optional(formData, "expiration_exception_reason")
            ? userId
            : null,
        submitted_by: userId,
        ...assetFields,
    });
    if (error) {
        if (objectPath) await supabase.storage.from(bucket).remove([objectPath]);
        throw new Error(error.message);
    }
    revalidatePath("/admin/content");
}

async function transition(id: string, status: "approved" | "rejected" | "published", formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff("/admin/content");
    const now = new Date().toISOString();
    const fields = status === "approved"
        ? { status, approved_by: userId, approved_at: now }
        : status === "published"
          ? { status, published_by: userId, published_at: now }
          : { status, review_note: optional(formData, "review_note") };
    const { error } = await supabase.from("content_submissions").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/content");
}

export async function approveContentSubmission(formData: FormData) {
    await transition(required(formData, "submission_id"), "approved", formData);
}

export async function rejectContentSubmission(formData: FormData) {
    await transition(required(formData, "submission_id"), "rejected", formData);
}

export async function publishContentSubmission(formData: FormData) {
    await transition(required(formData, "submission_id"), "published", formData);
}

export async function importProductionContent(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff("/admin/content");
    const file = formData.get("manifest");
    if (!(file instanceof File) || file.size === 0) throw new Error("Select a JSON manifest.");
    if (file.size > 2_097_152) throw new Error("Manifest must not exceed 2 MB.");
    if (file.type && file.type !== "application/json") throw new Error("Manifest must be JSON.");

    let input: unknown;
    try {
        input = JSON.parse(await file.text());
    } catch {
        throw new Error("Manifest is not valid JSON.");
    }

    const validated = validateProductionImportManifest(input);
    const sourceIds = [...new Set(validated.records.flatMap((item) => item.record?.source_registry_ids ?? []))];
    const approverIds = [...new Set(validated.records
        .filter((item) => !item.blockers.includes("valid_approver_required"))
        .flatMap((item) => item.record?.approved_by ?? []))];
    const approvedSourceIds = new Set<string>();
    const approvedApproverIds = new Set<string>();
    const [sourceResult, approverResult] = await Promise.all([
        sourceIds.length ? supabase
            .from("intelligence_data_sources")
            .select("id,license_status,analyst_review_state,publication_status")
            .in("id", sourceIds) : Promise.resolve({ data: [], error: null }),
        approverIds.length ? supabase
            .from("member_role_assignments")
            .select("user_id,role_id,expires_at")
            .in("user_id", approverIds)
            .in("role_id", ["editor", "admin"])
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`) : Promise.resolve({ data: [], error: null }),
    ]);
    if (sourceResult.error) throw new Error(sourceResult.error.message);
    if (approverResult.error) throw new Error(approverResult.error.message);
    for (const source of sourceResult.data ?? []) {
            if (source.license_status === "approved"
                && source.analyst_review_state === "approved"
                && source.publication_status === "published") {
                approvedSourceIds.add(source.id);
            }
    }
    for (const assignment of approverResult.data ?? []) approvedApproverIds.add(assignment.user_id);

    const result = applyApprovedSourceRegistry(
        applyApprovedEditorialApprovers(validated, approvedApproverIds),
        approvedSourceIds,
    );
    const blockedRecords = result.records.filter((item) => item.blockers.length > 0).length;
    const acceptedRecords = result.records.length - blockedRecords;
    const { data: batch, error: batchError } = await supabase
        .from("production_content_import_batches")
        .insert({
            file_name: file.name,
            manifest_version: result.manifestVersion || "invalid",
            status: blockedRecords ? "blocked" : "accepted",
            total_records: result.records.length,
            accepted_records: acceptedRecords,
            blocked_records: blockedRecords,
            imported_by: userId,
        })
        .select("id")
        .single();
    if (batchError) throw new Error(batchError.message);

    const items = result.records.map((item) => ({
        batch_id: batch.id,
        record_key: item.recordKey,
        content_type: item.contentType,
        import_status: item.blockers.length ? "blocked" : "accepted",
        blockers: item.blockers,
        approved_by: item.blockers.some((blocker) => ["valid_approver_required", "approver_not_editor_or_admin"].includes(blocker)) ? null : item.record?.approved_by ?? null,
        approved_at: item.blockers.includes("valid_approval_timestamp_required") ? null : item.record?.approved_at ?? null,
        citation_urls: item.record?.citation_urls ?? [],
        source_registry_ids: item.blockers.includes("valid_source_registry_ids_required") ? [] : item.record?.source_registry_ids ?? [],
        expires_at: item.blockers.includes("future_expiration_required") ? null : item.record?.expires_at ?? null,
        asset_references: item.record?.assets ?? [],
        payload: item.record ? {
            ...item.record.payload,
            title: item.record.title,
            body_copy: item.record.body_copy,
        } : {},
    }));
    const { error: itemError } = await supabase.from("production_content_import_items").insert(items);
    if (itemError) {
        await supabase.from("production_content_import_batches").delete().eq("id", batch.id);
        throw new Error(itemError.message);
    }
    revalidatePath("/admin/content");
}
