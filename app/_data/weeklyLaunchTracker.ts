import type { createClient } from "../../lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type WeeklyTrackerRow = {
    id: string; eventType: string; title: string; scheduledAt: string | null;
    provider: string | null; vehicle: string | null; mission: string;
    customerPayload: string | null; launchSite: string | null; eventLocation: string | null;
    target: string; status: string; confidence: string; isLunar: boolean;
    sourceCheckedAt: string | null; reviewedAt: string | null;
    value: { state: string; currency: string; exact: number | null; low: number | null; high: number | null; estimate: number | null; confidence: string | null } | null;
    citations: Array<{ title: string; url: string; retrievedAt: string }>;
};

export function localMonday(now: Date, timeZone: string) {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
    const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday) + 1;
    const localDate = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
    localDate.setUTCDate(localDate.getUTCDate() - Math.max(0, day - 1));
    return localDate.toISOString().slice(0, 10);
}

export async function loadWeeklyTracker({ supabase, weekStart, lunarOnly }: { supabase: SupabaseServerClient; weekStart: string; lunarOnly: boolean }) {
    let query = supabase.from("weekly_lunar_tracker_entries")
        .select("id,event_type,title,scheduled_at,launch_provider,vehicle,mission_name,customer_payload,launch_site,event_location,target_orbit_location,status,schedule_confidence,is_lunar_or_cislunar,source_checked_at,last_reviewed_at")
        .eq("week_start_local", weekStart).order("scheduled_at", { ascending: true, nullsFirst: false });
    if (lunarOnly) query = query.eq("is_lunar_or_cislunar", true);
    const { data: entries, error } = await query;
    if (error) throw new Error(error.message);
    const ids = (entries ?? []).map((entry) => entry.id);
    if (!ids.length) return [];
    const [{ data: citations }, { data: values }] = await Promise.all([
        supabase.from("weekly_lunar_tracker_sources").select("tracker_entry_id,citation_title,citation_url,retrieved_at").in("tracker_entry_id", ids).order("is_primary", { ascending: false }),
        supabase.from("weekly_lunar_tracker_values").select("tracker_entry_id,value_state,currency_code,exact_cited_value,cited_range_low,cited_range_high,analyst_estimate,estimate_confidence").in("tracker_entry_id", ids),
    ]);
    return (entries ?? []).map((entry): WeeklyTrackerRow => {
        const value = values?.find((candidate) => candidate.tracker_entry_id === entry.id);
        return {
            id: entry.id, eventType: entry.event_type, title: entry.title, scheduledAt: entry.scheduled_at,
            provider: entry.launch_provider, vehicle: entry.vehicle, mission: entry.mission_name,
            customerPayload: entry.customer_payload, launchSite: entry.launch_site, eventLocation: entry.event_location,
            target: entry.target_orbit_location, status: entry.status, confidence: entry.schedule_confidence,
            isLunar: entry.is_lunar_or_cislunar, sourceCheckedAt: entry.source_checked_at, reviewedAt: entry.last_reviewed_at,
            value: value ? { state: value.value_state, currency: value.currency_code, exact: value.exact_cited_value, low: value.cited_range_low, high: value.cited_range_high, estimate: value.analyst_estimate, confidence: value.estimate_confidence } : null,
            citations: (citations ?? []).filter((citation) => citation.tracker_entry_id === entry.id).map((citation) => ({ title: citation.citation_title, url: citation.citation_url, retrievedAt: citation.retrieved_at })),
        };
    });
}

export async function loadWeeklyEmptyState({ supabase, weekStart, lunarOnly }: { supabase: SupabaseServerClient; weekStart: string; lunarOnly: boolean }) {
    const { data } = await supabase.from("weekly_lunar_empty_states").select("message,source_checked_at")
        .eq("week_start_local", weekStart).eq("filter_scope", lunarOnly ? "lunar_cislunar" : "all").maybeSingle();
    return data;
}
