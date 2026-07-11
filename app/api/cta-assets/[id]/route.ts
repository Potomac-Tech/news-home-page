import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: asset, error } = await supabase
        .from("cta_assets")
        .select("storage_bucket,storage_object_path,mime_type,review_status,expires_at")
        .eq("id", id)
        .eq("review_status", "reviewed")
        .maybeSingle();

    if (
        error ||
        !asset?.storage_object_path ||
        (asset.expires_at && new Date(asset.expires_at) <= new Date())
    ) {
        return new Response("CTA asset not found.", { status: 404 });
    }

    const { data: image, error: downloadError } = await supabase.storage
        .from(asset.storage_bucket)
        .download(asset.storage_object_path);
    if (downloadError || !image) {
        return new Response("CTA asset not found.", { status: 404 });
    }

    return new Response(image, {
        headers: {
            "Content-Type": asset.mime_type,
            "Cache-Control": "public, max-age=300, s-maxage=300",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
