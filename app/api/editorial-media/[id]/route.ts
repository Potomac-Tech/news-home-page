import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: asset, error } = await supabase
        .from("editorial_media_assets")
        .select("storage_bucket,storage_object_path,mime_type")
        .eq("id", id)
        .eq("hosting_provider", "supabase")
        .maybeSingle();

    if (error || !asset?.storage_bucket || !asset.storage_object_path) {
        return new Response("Editorial media not found.", { status: 404 });
    }

    const { data: file, error: downloadError } = await supabase.storage
        .from(asset.storage_bucket)
        .download(asset.storage_object_path);
    if (downloadError || !file) {
        return new Response("Editorial media not found.", { status: 404 });
    }

    return new Response(file, {
        headers: {
            "Content-Type": asset.mime_type || "application/octet-stream",
            "Cache-Control": "private, max-age=300",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
