"use server";

import { revalidatePath } from "next/cache";
import { requireSavedWorkAccess } from "../../../lib/auth/saved-work";
import {
    dashboardModuleOptions,
    savedSearchFrequencies,
    savedWorkObjectKinds,
    type NotificationChannel,
    type SavedSearchFrequency,
    type SavedWorkObjectKind,
} from "../../_data/savedWork";

const objectKindValues = new Set(savedWorkObjectKinds.map((kind) => kind.value));
const frequencyValues = new Set(
    savedSearchFrequencies.map((frequency) => frequency.value)
);
const moduleValues = new Set(dashboardModuleOptions.map((module) => module.value));

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

function getObjectKind(formData: FormData, key: string): SavedWorkObjectKind {
    const value = getRequiredString(formData, key);

    if (!objectKindValues.has(value as SavedWorkObjectKind)) {
        throw new Error("Unsupported saved-work object type.");
    }

    return value as SavedWorkObjectKind;
}

function getOptionalObjectKind(
    formData: FormData,
    key: string
): SavedWorkObjectKind | null {
    const value = getOptionalString(formData, key);

    if (!value) {
        return null;
    }

    if (!objectKindValues.has(value as SavedWorkObjectKind)) {
        throw new Error("Unsupported saved-work object type.");
    }

    return value as SavedWorkObjectKind;
}

function getFrequency(formData: FormData, key: string): SavedSearchFrequency {
    const value = getRequiredString(formData, key);

    if (!frequencyValues.has(value as SavedSearchFrequency)) {
        throw new Error("Unsupported notification frequency.");
    }

    return value as SavedSearchFrequency;
}

function getSelectedModules(formData: FormData, key: string) {
    return formData
        .getAll(key)
        .map((value) => String(value).trim())
        .filter((value) => moduleValues.has(value));
}

function assertRoutePath(value: string) {
    if (!/^\/|^https?:\/\//i.test(value)) {
        throw new Error("Route path must start with / or http.");
    }
}

function assertLength(value: string | null, maxLength: number, label: string) {
    if (value && value.length > maxLength) {
        throw new Error(`${label} is too long.`);
    }
}

async function auditSavedWork({
    eventType,
    targetTable,
    targetRecordId,
    eventSummary,
}: {
    eventType: string;
    targetTable: string;
    targetRecordId?: string | null;
    eventSummary: string;
}) {
    const { supabase, userId } = await requireSavedWorkAccess();

    await supabase.from("member_saved_work_audit_events").insert({
        actor_user_id: userId,
        owner_user_id: userId,
        event_type: eventType,
        target_table: targetTable,
        target_record_id: targetRecordId ?? null,
        event_summary: eventSummary,
    });
}

export async function createWatchlist(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const name = getRequiredString(formData, "name");
    const description = getOptionalString(formData, "description");
    const colorLabel = getOptionalString(formData, "color_label");

    assertLength(name, 80, "Watchlist name");
    assertLength(description, 500, "Watchlist description");
    assertLength(colorLabel, 40, "Watchlist color label");

    const { data, error } = await supabase
        .from("member_watchlists")
        .insert({
            owner_user_id: userId,
            name,
            description,
            color_label: colorLabel,
            is_default: false,
            created_by: userId,
            updated_by: userId,
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "watchlist_created",
        targetTable: "member_watchlists",
        targetRecordId: data.id as string,
        eventSummary: "Member created a watchlist.",
    });

    revalidatePath("/member/saved-work");
}

export async function archiveWatchlist(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const watchlistId = getRequiredString(formData, "watchlist_id");

    const { error } = await supabase
        .from("member_watchlists")
        .update({
            status: "archived",
            updated_by: userId,
        })
        .eq("id", watchlistId)
        .eq("owner_user_id", userId);

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "watchlist_archived",
        targetTable: "member_watchlists",
        targetRecordId: watchlistId,
        eventSummary: "Member archived a watchlist.",
    });

    revalidatePath("/member/saved-work");
}

export async function saveWatchlistItem(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const watchlistId = getRequiredString(formData, "watchlist_id");
    const objectKind = getObjectKind(formData, "object_kind");
    const objectTitle = getRequiredString(formData, "object_title");
    const objectSlug = getOptionalString(formData, "object_slug");
    const objectRoutePath = getRequiredString(formData, "object_route_path");
    const watchReason = getOptionalString(formData, "watch_reason");

    assertRoutePath(objectRoutePath);
    assertLength(objectTitle, 180, "Object title");
    assertLength(objectSlug, 120, "Object slug");
    assertLength(watchReason, 500, "Watch reason");

    if (!objectSlug) {
        throw new Error("Object slug is required for manual saved work.");
    }

    const { data, error } = await supabase
        .from("member_watchlist_items")
        .insert({
            watchlist_id: watchlistId,
            owner_user_id: userId,
            object_kind: objectKind,
            object_slug: objectSlug,
            object_title: objectTitle,
            object_route_path: objectRoutePath,
            object_source_table: null,
            watch_reason: watchReason,
            status: "active",
            notify_in_app: formData.get("notify_in_app") === "on",
            notify_email: formData.get("notify_email") === "on",
            updated_by: userId,
            created_by: userId,
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "watchlist_item_saved",
        targetTable: "member_watchlist_items",
        targetRecordId: data.id as string,
        eventSummary: "Member saved a watchlist item.",
    });

    revalidatePath("/member/saved-work");
}

export async function archiveWatchlistItem(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const itemId = getRequiredString(formData, "item_id");

    const { error } = await supabase
        .from("member_watchlist_items")
        .update({
            status: "archived",
            updated_by: userId,
        })
        .eq("id", itemId)
        .eq("owner_user_id", userId);

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "watchlist_item_archived",
        targetTable: "member_watchlist_items",
        targetRecordId: itemId,
        eventSummary: "Member removed a watchlist item.",
    });

    revalidatePath("/member/saved-work");
}

export async function saveSearch(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const name = getRequiredString(formData, "name");
    const query = getOptionalString(formData, "query") ?? "";
    const scope = getOptionalObjectKind(formData, "scope");
    const alertFrequency = getFrequency(formData, "alert_frequency");
    const routePath = query
        ? `/search?q=${encodeURIComponent(query)}${scope ? `&scope=${scope}` : ""}`
        : scope
          ? `/search?scope=${scope}`
          : "/search";

    assertLength(name, 80, "Saved search name");
    assertLength(query, 180, "Saved search query");

    const { data, error } = await supabase
        .from("member_saved_searches")
        .insert({
            owner_user_id: userId,
            name,
            query,
            scope,
            route_path: routePath,
            alert_frequency: alertFrequency,
            filters: {},
            created_by: userId,
            updated_by: userId,
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "saved_search_created",
        targetTable: "member_saved_searches",
        targetRecordId: data.id as string,
        eventSummary: "Member saved a search.",
    });

    revalidatePath("/member/saved-work");
}

export async function archiveSavedSearch(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const searchId = getRequiredString(formData, "search_id");

    const { error } = await supabase
        .from("member_saved_searches")
        .update({
            status: "archived",
            updated_by: userId,
        })
        .eq("id", searchId)
        .eq("owner_user_id", userId);

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "saved_search_archived",
        targetTable: "member_saved_searches",
        targetRecordId: searchId,
        eventSummary: "Member archived a saved search.",
    });

    revalidatePath("/member/saved-work");
}

export async function saveReadingListItem(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const objectKind = getObjectKind(formData, "object_kind");
    const title = getRequiredString(formData, "title");
    const objectSlug = getOptionalString(formData, "object_slug");
    const routePath = getRequiredString(formData, "route_path");
    const summary = getOptionalString(formData, "summary");

    assertRoutePath(routePath);
    assertLength(title, 180, "Reading-list title");
    assertLength(objectSlug, 120, "Object slug");
    assertLength(summary, 500, "Reading-list summary");

    if (!objectSlug) {
        throw new Error("Object slug is required for reading-list saves.");
    }

    const { data, error } = await supabase
        .from("member_reading_list_items")
        .insert({
            owner_user_id: userId,
            object_kind: objectKind,
            object_slug: objectSlug,
            title,
            route_path: routePath,
            summary,
            status: "active",
            is_read: false,
            created_by: userId,
            updated_by: userId,
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "reading_list_item_saved",
        targetTable: "member_reading_list_items",
        targetRecordId: data.id as string,
        eventSummary: "Member saved a reading-list item.",
    });

    revalidatePath("/member/saved-work");
}

export async function updateReadingListItem(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const itemId = getRequiredString(formData, "item_id");
    const action = getRequiredString(formData, "reading_action");
    const now = new Date().toISOString();

    const patch =
        action === "read"
            ? {
                  is_read: true,
                  read_at: now,
                  updated_by: userId,
              }
            : action === "archive"
              ? {
                    status: "archived",
                    archived_at: now,
                    updated_by: userId,
                }
              : null;

    if (!patch) {
        throw new Error("Unsupported reading-list action.");
    }

    const { error } = await supabase
        .from("member_reading_list_items")
        .update(patch)
        .eq("id", itemId)
        .eq("owner_user_id", userId);

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType:
            action === "read"
                ? "reading_list_item_read"
                : "reading_list_item_archived",
        targetTable: "member_reading_list_items",
        targetRecordId: itemId,
        eventSummary:
            action === "read"
                ? "Member marked a reading-list item read."
                : "Member archived a reading-list item.",
    });

    revalidatePath("/member/saved-work");
}

export async function saveNotificationPreference(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const channel = getRequiredString(formData, "channel");
    const objectKind = getOptionalObjectKind(formData, "object_kind");
    const frequency = getFrequency(formData, "frequency");
    const timezone =
        getOptionalString(formData, "timezone") ?? "America/New_York";

    if (channel !== "in_app" && channel !== "email") {
        throw new Error("Unsupported notification channel.");
    }

    const preferenceQuery = supabase
        .from("member_notification_preferences")
        .select("id")
        .eq("owner_user_id", userId)
        .eq("channel", channel);

    const { data: existing, error: existingError } = objectKind
        ? await preferenceQuery.eq("object_kind", objectKind).maybeSingle()
        : await preferenceQuery.is("object_kind", null).maybeSingle();

    if (existingError) {
        throw new Error(existingError.message);
    }

    const preferencePatch = {
        owner_user_id: userId,
        channel: channel as NotificationChannel,
        object_kind: objectKind,
        enabled: formData.get("enabled") === "on",
        frequency,
        timezone,
        updated_by: userId,
        created_by: userId,
    };

    const { data, error } = existing
        ? await supabase
              .from("member_notification_preferences")
              .update(preferencePatch)
              .eq("id", existing.id)
              .select("id")
              .single()
        : await supabase
              .from("member_notification_preferences")
              .insert(preferencePatch)
              .select("id")
              .single();

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "notification_preference_saved",
        targetTable: "member_notification_preferences",
        targetRecordId: data.id as string,
        eventSummary: "Member updated saved-work notifications.",
    });

    revalidatePath("/member/saved-work");
}

export async function saveDashboardDefaults(formData: FormData) {
    const { supabase, userId } = await requireSavedWorkAccess();
    const pinnedModuleKeys = getSelectedModules(formData, "pinned_module_keys");
    const hiddenModuleKeys = getSelectedModules(formData, "hidden_module_keys");
    const defaultScope = getOptionalString(formData, "default_scope");
    const defaultFilters = defaultScope ? { scope: defaultScope } : {};

    const preferencePatch = {
        owner_user_id: userId,
        dashboard_key: "terminal",
        pinned_module_keys: pinnedModuleKeys,
        hidden_module_keys: hiddenModuleKeys,
        default_filters: defaultFilters,
        layout_config: {
            density: getOptionalString(formData, "density") ?? "compact",
        },
        updated_by: userId,
        created_by: userId,
    };
    const { data: existing, error: existingError } = await supabase
        .from("member_dashboard_preferences")
        .select("id")
        .eq("owner_user_id", userId)
        .eq("dashboard_key", "terminal")
        .maybeSingle();

    if (existingError) {
        throw new Error(existingError.message);
    }

    const { data, error } = existing
        ? await supabase
              .from("member_dashboard_preferences")
              .update(preferencePatch)
              .eq("id", existing.id)
              .select("id")
              .single()
        : await supabase
              .from("member_dashboard_preferences")
              .insert(preferencePatch)
              .select("id")
              .single();

    if (error) {
        throw new Error(error.message);
    }

    await auditSavedWork({
        eventType: "dashboard_defaults_saved",
        targetTable: "member_dashboard_preferences",
        targetRecordId: data.id as string,
        eventSummary: "Member updated dashboard defaults.",
    });

    revalidatePath("/member/saved-work");
}
