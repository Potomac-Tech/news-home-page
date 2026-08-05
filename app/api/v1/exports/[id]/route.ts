import { apiFailure, apiSuccess, claimDeveloperRequest, finishDeveloperRequest } from "../../../../../lib/developer/api-runtime";
import { createServiceClient } from "../../../../../lib/supabase/service";

export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const startedAt = Date.now();
    const auth = await claimDeveloperRequest(request, "export_jobs");
    if (!auth.claim) return auth.response;
    const { id } = await context.params;
    const { data } = await createServiceClient().from("developer_export_jobs")
        .select("id,export_name,source_kind,export_format,status,row_count,file_size_bytes,requested_at,completed_at,expires_at,failure_reason")
        .eq("id", id).eq("owner_user_id", auth.claim.ownerUserId).maybeSingle();
    if (!data) {
        await finishDeveloperRequest(auth.claim, startedAt, 404, {}, "export_not_found");
        return apiFailure("export_not_found", "Export job not found.", 404, auth.requestId);
    }
    await finishDeveloperRequest(auth.claim, startedAt, 200, data);
    return apiSuccess(data, auth.claim, auth.requestId);
}
