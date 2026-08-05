import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getDeveloperPlatformAccessContext } from "../../../../../lib/auth/developer-platform";
import { createClient } from "../../../../../lib/supabase/server";
import { createServiceClient } from "../../../../../lib/supabase/service";
import { parseSafeWebhookDestination } from "../../../../../lib/developer/webhook-destination";

export const dynamic = "force-dynamic";
const eventKinds = new Set(["alert.created", "saved_search.match", "watchlist.changed", "dataset.updated", "export.completed", "command_brief.published"]);

export async function POST(request: Request) {
    const supabase = await createClient();
    const access = await getDeveloperPlatformAccessContext({ supabase, nextPath: "/member/developer" });
    if (!access.canUseWebhooks || !access.userId) return NextResponse.json({ error: "Cabeus Council access is required." }, { status: 403 });
    const input = await request.json().catch(() => ({})) as Record<string, unknown>;
    const name = String(input.name ?? "Primary webhook").trim().slice(0, 100);
    let endpoint: string;
    try {
        endpoint = parseSafeWebhookDestination(String(input.endpoint_url ?? "").trim());
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Provide a public HTTPS endpoint." },
            { status: 400 }
        );
    }
    const events = Array.isArray(input.events) ? [...new Set(input.events.map(String))] : [];
    if (!name || events.length === 0 || events.some((event) => !eventKinds.has(event))) return NextResponse.json({ error: "Provide a name, public HTTPS endpoint, and supported event list." }, { status: 400 });
    const admin = createServiceClient();
    const { data: limit } = await admin.from("developer_tier_limits").select("max_webhook_subscriptions").eq("tier", access.tier).single();
    const { count } = await admin.from("developer_webhook_subscriptions").select("id", { count: "exact", head: true }).eq("owner_user_id", access.userId).eq("status", "active");
    if ((count ?? 0) >= Number(limit?.max_webhook_subscriptions ?? 0)) return NextResponse.json({ error: "The webhook subscription limit has been reached." }, { status: 409 });
    const secret = `whsec_${randomBytes(32).toString("base64url")}`;
    const { data, error } = await admin.from("developer_webhook_subscriptions").insert({ owner_user_id: access.userId, subscription_name: name, endpoint_url: endpoint, event_kinds: events, signing_secret_hash: createHash("sha256").update(secret).digest("hex"), created_by: access.userId, updated_by: access.userId }).select("id,subscription_name,endpoint_url,event_kinds,status,created_at").single();
    if (error || !data) return NextResponse.json({ error: "The webhook subscription could not be created." }, { status: 400 });
    const { error: vaultError } = await admin.rpc("create_developer_webhook_secret", { p_subscription_id: data.id, p_secret: secret });
    if (vaultError) {
        await admin.from("developer_webhook_subscriptions").delete().eq("id", data.id);
        return NextResponse.json({ error: "The webhook signing secret could not be secured." }, { status: 500 });
    }
    return NextResponse.json({ data: { ...data, signing_secret: secret }, warning: "This signing secret is shown once. Store it securely." }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
