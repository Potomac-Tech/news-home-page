import type { createClient } from "../../lib/supabase/server";
import { localMonday } from "./weeklyLaunchTracker";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
export type HomepageLaunchSummary = { reviewedCount: number; lunarCount: number; freshnessAt: string | null; weekStart: string; timeZone: string };

export async function loadHomepageLaunchSummary(supabase: SupabaseServerClient, timeZone: string): Promise<HomepageLaunchSummary> {
    const weekStart = localMonday(new Date(), timeZone);
    const { data, error } = await supabase.rpc("get_homepage_launch_summary", { p_week_start: weekStart }).maybeSingle();
    if (error) throw new Error(error.message);
    const row = data as { reviewed_count?: number | string; lunar_cislunar_count?: number | string; source_freshness_at?: string | null } | null;
    return { reviewedCount: Number(row?.reviewed_count ?? 0), lunarCount: Number(row?.lunar_cislunar_count ?? 0), freshnessAt: row?.source_freshness_at ?? null, weekStart, timeZone };
}
