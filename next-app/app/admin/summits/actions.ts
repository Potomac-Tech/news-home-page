"use server";

import { revalidatePath } from "next/cache";
import { requireEventStaff } from "../../../lib/auth/events";

const publishStatuses = ["draft", "published", "archived"] as const;
const summitStatuses = [
    "planned",
    "in_progress",
    "completed",
    "canceled",
] as const;

function getRequiredString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        throw new Error(`Missing ${key}.`);
    }

    return value;
}

function getOptionalString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    return value || null;
}

function getPublishStatus(formData: FormData) {
    const value = String(formData.get("publish_status") ?? "draft");

    if (!publishStatuses.includes(value as (typeof publishStatuses)[number])) {
        throw new Error("Invalid publish status.");
    }

    return value;
}

function getSummitStatus(formData: FormData) {
    const value = String(formData.get("summit_status") ?? "planned");

    if (!summitStatuses.includes(value as (typeof summitStatuses)[number])) {
        throw new Error("Invalid summit status.");
    }

    return value;
}

function getTimestamp(formData: FormData, key: string, required = false) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        if (required) {
            throw new Error(`Missing ${key}.`);
        }

        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid ${key}.`);
    }

    return date.toISOString();
}

function getStringList(formData: FormData, key: string) {
    return String(formData.get(key) ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function getSourceLinks(formData: FormData) {
    return getStringList(formData, "source_links")
        .map((line) => {
            const parts = line.split("|").map((part) => part.trim());

            if (parts.length >= 3) {
                return {
                    label: parts[0],
                    title: parts[1],
                    url: parts.slice(2).join("|"),
                };
            }

            if (parts.length === 2) {
                return {
                    label: parts[0],
                    title: parts[0],
                    url: parts[1],
                };
            }

            return {
                label: "Source",
                title: parts[0],
                url: parts[0],
            };
        })
        .filter((source) => source.url);
}

function publicationFields(
    publishStatus: string,
    existingPublishedAt?: string | null
) {
    const now = new Date().toISOString();

    return {
        published_at:
            publishStatus === "published" ? existingPublishedAt ?? now : null,
        archived_at: publishStatus === "archived" ? now : null,
    };
}

function summitPayload(
    formData: FormData,
    userId: string,
    existingPublishedAt?: string | null
) {
    const publishStatus = getPublishStatus(formData);

    return {
        slug: getRequiredString(formData, "slug"),
        publish_status: publishStatus,
        summit_status: getSummitStatus(formData),
        title: getRequiredString(formData, "title"),
        location: getRequiredString(formData, "location"),
        timezone: getRequiredString(formData, "timezone"),
        starts_at: getTimestamp(formData, "starts_at", true),
        ends_at: getTimestamp(formData, "ends_at"),
        status_note: getOptionalString(formData, "status_note"),
        tracker_summary: getRequiredString(formData, "tracker_summary"),
        agenda_markdown: getOptionalString(formData, "agenda_markdown"),
        past_event_summary_markdown: getOptionalString(
            formData,
            "past_event_summary_markdown"
        ),
        major_news: getStringList(formData, "major_news"),
        source_links: getSourceLinks(formData),
        next_steps: getStringList(formData, "next_steps"),
        ...publicationFields(publishStatus, existingPublishedAt),
        updated_by: userId,
    };
}

export async function createSummit(formData: FormData) {
    const { supabase, userId } = await requireEventStaff();
    const { error } = await supabase.from("internal_summits").insert({
        ...summitPayload(formData, userId),
        created_by: userId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/summits");
    revalidatePath("/member/summits");
}

export async function updateSummit(formData: FormData) {
    const { supabase, userId } = await requireEventStaff();
    const summitId = getRequiredString(formData, "summit_id");
    const { data: existing, error: existingError } = await supabase
        .from("internal_summits")
        .select("published_at")
        .eq("id", summitId)
        .single();

    if (existingError || !existing) {
        throw new Error(existingError?.message ?? "Summit not found.");
    }

    const { error } = await supabase
        .from("internal_summits")
        .update(
            summitPayload(
                formData,
                userId,
                existing.published_at as string | null
            )
        )
        .eq("id", summitId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/summits");
    revalidatePath("/member/summits");
}
