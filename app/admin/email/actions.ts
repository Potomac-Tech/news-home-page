"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth/admin";

const severities = new Set(["info", "watch", "urgent"]);

function integer(formData: FormData, key: string, minimum: number, maximum: number) {
    const value = Number.parseInt(String(formData.get(key) ?? ""), 10);
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new Error(`${key} must be between ${minimum} and ${maximum}.`);
    }
    return value;
}

export async function updateMemberAlertEmailConfig(formData: FormData) {
    const { supabase, userId } = await requireAdmin();
    const threshold = String(formData.get("instant_priority_threshold") ?? "urgent");
    if (!severities.has(threshold)) throw new Error("Unsupported priority threshold.");

    const { error } = await supabase
        .from("member_alert_email_config")
        .update({
            digest_cadence_hours: integer(formData, "digest_cadence_hours", 1, 168),
            digest_send_hour_utc: integer(formData, "digest_send_hour_utc", 0, 23),
            max_daily_alert_emails: integer(formData, "max_daily_alert_emails", 1, 90),
            per_user_daily_email_cap: integer(formData, "per_user_daily_email_cap", 1, 10),
            instant_daily_reserve: integer(formData, "instant_daily_reserve", 0, 20),
            instant_priority_threshold: threshold,
            low_budget_buffer: integer(formData, "low_budget_buffer", 0, 50),
            max_digest_items: integer(formData, "max_digest_items", 1, 50),
            updated_by: userId,
        })
        .eq("id", true);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/email");
}
