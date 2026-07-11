import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { data: submission, error } = await supabase
        .from("content_submissions")
        .select("storage_bucket,storage_object_path,asset_mime_type,scheduled_at,expires_at")
        .eq("id", id)
        .eq("status", "published")
        .gt("expires_at", now)
        .maybeSingle();
    if (
        error ||
        !submission?.storage_bucket ||
        !submission.storage_object_path ||
        (submission.scheduled_at && submission.scheduled_at > now)
    ) {
        return new Response("Content asset not found.", { status: 404 });
    }
    const { data: file, error: downloadError } = await supabase.storage
        .from(submission.storage_bucket)
        .download(submission.storage_object_path);
    if (downloadError || !file) {
        return new Response("Content asset not found.", { status: 404 });
    }
    return new Response(file, {
        headers: {
            "Content-Type": submission.asset_mime_type ?? "application/octet-stream",
            "Cache-Control": "public, max-age=300, s-maxage=300",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
