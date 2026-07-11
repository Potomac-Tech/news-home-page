"use server";

import { revalidatePath } from "next/cache";
import { requireEditorialStaff } from "../../../lib/auth/editorial";
import {
    readImageDimensions,
    safeCtaObjectName,
    validateCtaImageFile,
} from "../../../lib/assets/cta-images";

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
        destination_url: optional(formData, "destination_url"),
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
