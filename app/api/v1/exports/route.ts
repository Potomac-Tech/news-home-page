import { apiFailure, apiSuccess, claimDeveloperRequest, finishDeveloperRequest } from "../../../../lib/developer/api-runtime";
import type { DeveloperSource } from "../../../../lib/developer/data-sources";
import { createServiceClient } from "../../../../lib/supabase/service";

export const dynamic = "force-dynamic";
const sources = new Set<DeveloperSource>(["lunar_articles", "lunar_missions", "procurement_regulatory", "company_profiles", "command_briefs"]);
const formats = new Set(["csv", "pdf", "json"]);

export async function POST(request: Request) {
    const startedAt = Date.now();
    const auth = await claimDeveloperRequest(request, "export_jobs");
    if (!auth.claim) return auth.response;
    let input: Record<string, unknown>;
    try { input = await request.json() as Record<string, unknown>; }
    catch {
        await finishDeveloperRequest(auth.claim, startedAt, 400, {}, "invalid_json");
        return apiFailure("invalid_json", "Request body must be valid JSON.", 400, auth.requestId);
    }
    const source = String(input.source ?? "") as DeveloperSource;
    const format = String(input.format ?? "csv").toLowerCase();
    if (!sources.has(source) || !formats.has(format) || (source === "command_briefs" && auth.claim.tier === "scout")) {
        await finishDeveloperRequest(auth.claim, startedAt, 400, {}, "invalid_export_request");
        return apiFailure("invalid_export_request", "Choose an entitled source and csv, pdf, or json format.", 400, auth.requestId);
    }
    const supabase = createServiceClient();
    const { data: limits } = await supabase.from("developer_tier_limits").select("daily_export_quota").eq("tier", auth.claim.tier).maybeSingle();
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase.from("developer_export_jobs").select("id", { count: "exact", head: true })
        .eq("owner_user_id", auth.claim.ownerUserId).gte("requested_at", since.toISOString());
    if ((count ?? 0) >= Number(limits?.daily_export_quota ?? 0)) {
        await finishDeveloperRequest(auth.claim, startedAt, 429, {}, "daily_export_quota_exceeded");
        return apiFailure("daily_export_quota_exceeded", "The daily export quota has been exhausted.", 429, auth.requestId);
    }
    const { data, error } = await supabase.from("developer_export_jobs").insert({
        owner_user_id: auth.claim.ownerUserId,
        organization_id: auth.claim.organizationId,
        export_name: String(input.name ?? `${source} export`).slice(0, 120),
        source_kind: source,
        export_format: format,
        requested_filters: input.filters && typeof input.filters === "object" ? input.filters : {},
        created_by: auth.claim.ownerUserId,
        updated_by: auth.claim.ownerUserId,
    }).select("id,status,requested_at").single();
    if (error) {
        await finishDeveloperRequest(auth.claim, startedAt, 500, {}, "export_enqueue_failed");
        return apiFailure("export_enqueue_failed", "The export could not be queued.", 500, auth.requestId);
    }
    await finishDeveloperRequest(auth.claim, startedAt, 202, data);
    return apiSuccess(data, auth.claim, auth.requestId, 202);
}
