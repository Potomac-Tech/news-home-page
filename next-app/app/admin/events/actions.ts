"use server";

import { revalidatePath } from "next/cache";
import { requireEventStaff } from "../../../lib/auth/events";

type EventSupabaseClient = Awaited<
    ReturnType<typeof requireEventStaff>
>["supabase"];

const eventStatuses = ["draft", "published", "archived"] as const;
const eventTypes = [
    "conference",
    "summit",
    "workshop",
    "webinar",
    "briefing",
    "roundtable",
    "other",
] as const;
const accessTiers = ["member", "scout", "command"] as const;

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

function getStatus(formData: FormData) {
    const value = String(formData.get("status") ?? "draft");

    if (!eventStatuses.includes(value as (typeof eventStatuses)[number])) {
        throw new Error("Invalid event status.");
    }

    return value;
}

function getEventType(formData: FormData) {
    const value = String(formData.get("event_type") ?? "conference");

    if (!eventTypes.includes(value as (typeof eventTypes)[number])) {
        throw new Error("Invalid event type.");
    }

    return value;
}

function getAccessTier(formData: FormData) {
    const value = String(formData.get("access_tier_required") ?? "member");

    if (!accessTiers.includes(value as (typeof accessTiers)[number])) {
        throw new Error("Invalid access tier.");
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

function getPublicAgenda(formData: FormData) {
    return String(formData.get("public_agenda") ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function getSourceLinks(formData: FormData) {
    return String(formData.get("source_links") ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
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

function publicationFields(status: string, existingPublishedAt?: string | null) {
    const now = new Date().toISOString();

    return {
        published_at:
            status === "published" ? existingPublishedAt ?? now : null,
        archived_at: status === "archived" ? now : null,
    };
}

async function upsertEventDetails(
    supabase: EventSupabaseClient,
    eventId: string,
    formData: FormData,
    userId: string
) {
    const { error } = await supabase
        .from("event_calendar_event_details")
        .upsert(
            {
                event_id: eventId,
                member_details_markdown: getRequiredString(
                    formData,
                    "member_details_markdown"
                ),
                member_packet_url: getOptionalString(
                    formData,
                    "member_packet_url"
                ),
                registration_url: getOptionalString(
                    formData,
                    "registration_url"
                ),
                virtual_url: getOptionalString(formData, "virtual_url"),
                contact_email: getOptionalString(formData, "contact_email"),
                source_links: getSourceLinks(formData),
                preparation_notes: getOptionalString(
                    formData,
                    "preparation_notes"
                ),
                updated_by: userId,
            },
            { onConflict: "event_id" }
        );

    if (error) {
        throw new Error(error.message);
    }
}

export async function createEvent(formData: FormData) {
    const { supabase, userId } = await requireEventStaff();
    const status = getStatus(formData);
    const { data: event, error } = await supabase
        .from("event_calendar_events")
        .insert({
            slug: getRequiredString(formData, "slug"),
            status,
            event_type: getEventType(formData),
            access_tier_required: getAccessTier(formData),
            title: getRequiredString(formData, "title"),
            organizer: getOptionalString(formData, "organizer"),
            location: getRequiredString(formData, "location"),
            timezone: getRequiredString(formData, "timezone"),
            starts_at: getTimestamp(formData, "starts_at", true),
            ends_at: getTimestamp(formData, "ends_at"),
            public_summary: getRequiredString(formData, "public_summary"),
            public_teaser: getRequiredString(formData, "public_teaser"),
            public_agenda: getPublicAgenda(formData),
            hero_image_url: getOptionalString(formData, "hero_image_url"),
            ...publicationFields(status),
            created_by: userId,
            updated_by: userId,
        })
        .select("id")
        .single();

    if (error || !event) {
        throw new Error(error?.message ?? "Event not created.");
    }

    await upsertEventDetails(supabase, event.id as string, formData, userId);

    revalidatePath("/admin/events");
    revalidatePath("/events");
}

export async function updateEvent(formData: FormData) {
    const { supabase, userId } = await requireEventStaff();
    const eventId = getRequiredString(formData, "event_id");
    const status = getStatus(formData);
    const { data: existing, error: existingError } = await supabase
        .from("event_calendar_events")
        .select("published_at")
        .eq("id", eventId)
        .single();

    if (existingError || !existing) {
        throw new Error(existingError?.message ?? "Event not found.");
    }

    const { error } = await supabase
        .from("event_calendar_events")
        .update({
            slug: getRequiredString(formData, "slug"),
            status,
            event_type: getEventType(formData),
            access_tier_required: getAccessTier(formData),
            title: getRequiredString(formData, "title"),
            organizer: getOptionalString(formData, "organizer"),
            location: getRequiredString(formData, "location"),
            timezone: getRequiredString(formData, "timezone"),
            starts_at: getTimestamp(formData, "starts_at", true),
            ends_at: getTimestamp(formData, "ends_at"),
            public_summary: getRequiredString(formData, "public_summary"),
            public_teaser: getRequiredString(formData, "public_teaser"),
            public_agenda: getPublicAgenda(formData),
            hero_image_url: getOptionalString(formData, "hero_image_url"),
            ...publicationFields(
                status,
                existing.published_at as string | null
            ),
            updated_by: userId,
        })
        .eq("id", eventId);

    if (error) {
        throw new Error(error.message);
    }

    await upsertEventDetails(supabase, eventId, formData, userId);

    revalidatePath("/admin/events");
    revalidatePath("/events");
}
