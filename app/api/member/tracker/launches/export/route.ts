import { NextResponse } from "next/server";
import { getWeeklyTrackerAccess } from "../../../../../../lib/auth/weekly-tracker";
import { createClient } from "../../../../../../lib/supabase/server";
import { loadWeeklyTracker, localMonday } from "../../../../../_data/weeklyLaunchTracker";

export const dynamic = "force-dynamic";
const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
    const supabase = await createClient();
    const access = await getWeeklyTrackerAccess({ supabase });
    if (access.state !== "authorized") return NextResponse.json({ error: "Verified profile required." }, { status: 401 });
    if (!access.canUsePremiumTools) return NextResponse.json({ error: "Scout or Cabeus Council access required." }, { status: 403 });
    const { data: profile } = await supabase.from("member_profile_completions").select("timezone").eq("user_id", access.userId!).maybeSingle();
    const weekStart = localMonday(new Date(), profile?.timezone || "UTC");
    const lunarOnly = new URL(request.url).searchParams.get("filter") === "lunar";
    const rows = await loadWeeklyTracker({ supabase, weekStart, lunarOnly });
    const header = ["event_type","title","scheduled_at","provider","vehicle","mission","customer_payload","launch_site","target","status","confidence","value_state","value","methodology"];
    const body = rows.map((row) => [row.eventType,row.title,row.scheduledAt,row.provider,row.vehicle,row.mission,row.customerPayload,row.launchSite,row.target,row.status,row.confidence,row.value?.state,row.value?.exact ?? row.value?.estimate ?? "",row.value?.methodology].map(csv).join(","));
    return new NextResponse([header.map(csv).join(","), ...body].join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="launches-missions-${weekStart}.csv"`, "cache-control": "private, no-store" } });
}
