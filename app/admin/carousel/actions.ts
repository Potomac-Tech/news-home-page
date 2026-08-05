"use server";

import { revalidatePath } from "next/cache";
import { requireEditorialStaff } from "../../../lib/auth/editorial";

const slideTypes = ["anonymous_teaser", "signed_in_editorial_story", "custom_intelligence_card", "paid_tier_teaser"] as const;
const selectionModes = ["manual", "auto_latest"] as const;
const visibilities = ["public_teaser", "member_only"] as const;
const audiences = ["anonymous", "verified_member"] as const;
const tiers = ["public", "member", "scout", "command"] as const;

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
function timestamp(formData: FormData, key: string, requiredValue = false) {
    const raw = optional(formData, key);
    if (!raw) {
        if (requiredValue) throw new Error(`Missing ${key}.`);
        return null;
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${key}.`);
    return date.toISOString();
}

export async function createCarouselSlide(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff("/admin/carousel");
    const scheduledAt = timestamp(formData, "scheduled_at");
    const expiresAt = timestamp(formData, "expires_at", true)!;
    const start = scheduledAt ? new Date(scheduledAt) : new Date();
    if (new Date(expiresAt) > new Date(start.getTime() + 14 * 86_400_000 + 3_600_000)) {
        throw new Error("Carousel slides cannot exceed the 14-day window.");
    }
    const { error } = await supabase.from("homepage_carousel_slides").insert({
        slide_type: allowed(formData, "slide_type", slideTypes),
        article_id: optional(formData, "article_id"),
        selection_mode: allowed(formData, "selection_mode", selectionModes),
        title: required(formData, "title"),
        summary: required(formData, "summary"),
        status: "draft",
        is_pinned: formData.get("is_pinned") === "on",
        display_rank: Number(required(formData, "display_rank")),
        is_required: formData.get("is_required") === "on",
        content_visibility: allowed(formData, "content_visibility", visibilities),
        audience_mode: allowed(formData, "audience_mode", audiences),
        minimum_tier: allowed(formData, "minimum_tier", tiers),
        visual_asset_url: required(formData, "visual_asset_url"),
        visual_asset_alt: required(formData, "visual_asset_alt"),
        cta_label: required(formData, "cta_label"),
        cta_route: required(formData, "cta_route"),
        citation_url: required(formData, "citation_url"),
        source_note: required(formData, "source_note"),
        freshness_at: timestamp(formData, "freshness_at", true),
        scheduled_at: scheduledAt,
        expires_at: expiresAt,
        created_by: userId,
        updated_by: userId,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/carousel");
}

async function updateSlide(formData: FormData, status?: string) {
    const { supabase, userId } = await requireEditorialStaff("/admin/carousel");
    const slideId = required(formData, "slide_id");
    const fields: Record<string, unknown> = { updated_by: userId };
    if (status) fields.status = status;
    if (status === "published") {
        fields.published_by = userId;
        fields.published_at = new Date().toISOString();
    }
    if (formData.has("display_rank")) fields.display_rank = Number(required(formData, "display_rank"));
    const { error } = await supabase.from("homepage_carousel_slides").update(fields).eq("id", slideId);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/carousel");
}

export async function previewCarouselSlide(formData: FormData) { await updateSlide(formData, "preview"); }
export async function publishCarouselSlide(formData: FormData) { await updateSlide(formData, "published"); }
export async function unpublishCarouselSlide(formData: FormData) { await updateSlide(formData, "unpublished"); }
export async function expireCarouselSlide(formData: FormData) { await updateSlide(formData, "expired"); }
export async function reorderCarouselSlide(formData: FormData) { await updateSlide(formData); }
