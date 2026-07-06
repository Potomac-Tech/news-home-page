"use server";

import { revalidatePath } from "next/cache";
import { requireMemberAlertsAccess } from "../../lib/auth/member-alerts";
import {
    savedSearchFrequencies,
    savedWorkObjectKinds,
    type SavedSearchFrequency,
    type SavedWorkObjectKind,
} from "../_data/savedWork";

const objectKindValues = new Set(savedWorkObjectKinds.map((kind) => kind.value));
const frequencyValues = new Set(
    savedSearchFrequencies.map((frequency) => frequency.value)
);
const triggerKinds = new Set([
    "watched_object_changed",
    "saved_search_match",
    "freshness_stale",
    "platform_event",
    "command_intelligence",
]);
const severities = new Set(["info", "watch", "urgent"]);

function getRequiredString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) throw new Error(`Missing ${key}.`);

    return value;
}

function getOptionalString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    return value || null;
}

function getObjectKind(formData: FormData): SavedWorkObjectKind | null {
    const value = getOptionalString(formData, "object_kind");

    if (!value) return null;

    if (!objectKindValues.has(value as SavedWorkObjectKind)) {
        throw new Error("Unsupported alert object type.");
    }

    return value as SavedWorkObjectKind;
}

function getFrequency(formData: FormData): SavedSearchFrequency {
    const value = getRequiredString(formData, "frequency");

    if (!frequencyValues.has(value as SavedSearchFrequency)) {
        throw new Error("Unsupported alert frequency.");
    }

    return value as SavedSearchFrequency;
}

function getInteger(formData: FormData, key: string, fallback: number) {
    const value = getOptionalString(formData, key);

    if (!value) return fallback;

    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`${key} must be a nonnegative number.`);
    }

    return parsed;
}

export async function createAlertRule(formData: FormData) {
    const { supabase, userId, canManageAlertRules, tier } =
        await requireMemberAlertsAccess();

    if (!canManageAlertRules) {
        throw new Error("Scout or Command access is required for alert rules.");
    }

    const triggerKind = getRequiredString(formData, "trigger_kind");
    const severity = getRequiredString(formData, "severity");

    if (!triggerKinds.has(triggerKind)) {
        throw new Error("Unsupported alert trigger.");
    }

    if (!severities.has(severity)) {
        throw new Error("Unsupported alert severity.");
    }

    if (triggerKind === "command_intelligence" && tier !== "command" && tier !== "staff") {
        throw new Error("Command intelligence alerts require Command access.");
    }

    const objectKind = getObjectKind(formData);
    const objectSlug = getOptionalString(formData, "object_slug");

    if (
        !objectKind &&
        triggerKind !== "platform_event" &&
        triggerKind !== "command_intelligence"
    ) {
        throw new Error("Choose an object type or platform trigger.");
    }

    const { error } = await supabase.from("member_alert_rules").insert({
        owner_user_id: userId,
        rule_name: getRequiredString(formData, "rule_name").slice(0, 120),
        trigger_kind: triggerKind,
        object_kind: objectKind,
        object_slug: objectSlug,
        severity,
        in_app_enabled: formData.get("in_app_enabled") === "on",
        email_enabled: formData.get("email_enabled") === "on",
        frequency: getFrequency(formData),
        stale_after_hours:
            triggerKind === "freshness_stale"
                ? getInteger(formData, "stale_after_hours", 24)
                : null,
        per_day_limit: getInteger(formData, "per_day_limit", 5),
        created_by: userId,
        updated_by: userId,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/alerts");
}

export async function archiveAlertRule(formData: FormData) {
    const { supabase, userId, canManageAlertRules } =
        await requireMemberAlertsAccess();

    if (!canManageAlertRules) {
        throw new Error("Scout or Command access is required for alert rules.");
    }

    const { error } = await supabase
        .from("member_alert_rules")
        .update({
            status: "archived",
            updated_by: userId,
        })
        .eq("id", getRequiredString(formData, "rule_id"))
        .eq("owner_user_id", userId);

    if (error) throw new Error(error.message);

    revalidatePath("/alerts");
}

export async function markAlertRead(formData: FormData) {
    const { supabase, userId } = await requireMemberAlertsAccess();
    const now = new Date().toISOString();

    const { error } = await supabase
        .from("member_alert_feed_items")
        .update({
            is_read: true,
            read_at: now,
        })
        .eq("id", getRequiredString(formData, "alert_id"))
        .eq("owner_user_id", userId);

    if (error) throw new Error(error.message);

    revalidatePath("/alerts");
}
