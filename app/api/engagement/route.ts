import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

const supported = new Set(["article_read", "search", "saved_work", "watchlist", "tracker_row", "company_profile_view", "alert", "paid_article", "dataset", "export", "cta_click"]);

export async function POST(request: Request) {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body.eventType !== "string" || !supported.has(body.eventType) || typeof body.route !== "string") {
        return NextResponse.json({ error: "Invalid engagement event." }, { status: 400 });
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_member_engagement", {
        p_event_type: body.eventType,
        p_route: body.route,
        p_object_type: typeof body.objectType === "string" ? body.objectType : null,
        p_object_id: typeof body.objectId === "string" ? body.objectId : null,
        p_metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    });
    if (error) return NextResponse.json({ error: "Unable to record engagement." }, { status: 400 });
    return new NextResponse(null, { status: 204 });
}
