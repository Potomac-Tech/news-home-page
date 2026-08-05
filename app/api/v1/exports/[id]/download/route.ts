import { NextResponse } from "next/server";
import { apiFailure, claimDeveloperRequest, finishDeveloperRequest } from "../../../../../../lib/developer/api-runtime";
import { createServiceClient } from "../../../../../../lib/supabase/service";

export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const startedAt = Date.now();
    const auth = await claimDeveloperRequest(request, "export_jobs");
    if (!auth.claim) return auth.response;
    const { id } = await context.params;
    const supabase = createServiceClient();
    const { data: job } = await supabase.from("developer_export_jobs")
        .select("id,status,storage_bucket,storage_path,expires_at")
        .eq("id", id).eq("owner_user_id", auth.claim.ownerUserId).maybeSingle();
    if (!job || job.status !== "ready" || !job.storage_bucket || !job.storage_path || (job.expires_at && new Date(job.expires_at) <= new Date())) {
        await finishDeveloperRequest(auth.claim, startedAt, 404, {}, "export_not_ready");
        return apiFailure("export_not_ready", "The export is unavailable, incomplete, or expired.", 404, auth.requestId);
    }
    const { data, error } = await supabase.storage.from(job.storage_bucket).createSignedUrl(job.storage_path, 300, { download: true });
    if (error || !data?.signedUrl) {
        await finishDeveloperRequest(auth.claim, startedAt, 500, {}, "download_unavailable");
        return apiFailure("download_unavailable", "A download link could not be created.", 500, auth.requestId);
    }
    await finishDeveloperRequest(auth.claim, startedAt, 302, { export_id: id });
    return NextResponse.redirect(data.signedUrl, 302);
}
