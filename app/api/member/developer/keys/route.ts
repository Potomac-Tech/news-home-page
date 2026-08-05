import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getDeveloperPlatformAccessContext } from "../../../../../lib/auth/developer-platform";
import { createClient } from "../../../../../lib/supabase/server";
import { createServiceClient } from "../../../../../lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const supabase = await createClient();
    const access = await getDeveloperPlatformAccessContext({ supabase, nextPath: "/member/developer" });
    if (!access.canUseDeveloperPlatform || !access.userId) return NextResponse.json({ error: "Scout or Cabeus Council access is required." }, { status: 403 });
    const input = await request.json().catch(() => ({})) as Record<string, unknown>;
    const name = String(input.name ?? "Primary API key").trim().slice(0, 100);
    if (!name) return NextResponse.json({ error: "A key name is required." }, { status: 400 });
    const admin = createServiceClient();
    const tier = access.tier;
    const { data: limit } = await admin.from("developer_tier_limits").select("max_active_api_keys").eq("tier", tier).single();
    const { count } = await admin.from("developer_api_keys").select("id", { count: "exact", head: true }).eq("owner_user_id", access.userId).eq("status", "active");
    if ((count ?? 0) >= Number(limit?.max_active_api_keys ?? 0)) return NextResponse.json({ error: "The active API key limit has been reached." }, { status: 409 });
    const identifier = randomBytes(4).toString("hex");
    const secret = randomBytes(32).toString("base64url");
    const prefix = `cbe_${tier}_live_${identifier}`;
    const rawKey = `${prefix}_${secret}`;
    const { data, error } = await admin.from("developer_api_keys").insert({ owner_user_id: access.userId, key_name: name, key_prefix: prefix, key_hash: createHash("sha256").update(rawKey).digest("hex"), tier, allowed_endpoint_keys: Array.isArray(input.scopes) ? input.scopes.map(String) : [], created_by: access.userId, updated_by: access.userId }).select("id,key_name,key_prefix,tier,status,created_at").single();
    if (error) return NextResponse.json({ error: "The API key could not be created." }, { status: 400 });
    return NextResponse.json({ data: { ...data, api_key: rawKey }, warning: "This API key is shown once. Store it securely." }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
