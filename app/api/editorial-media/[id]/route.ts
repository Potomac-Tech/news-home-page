import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: asset, error } = await supabase
        .from("editorial_media_assets")
        .select("article_id,storage_bucket,storage_object_path,thumbnail_storage_object_path,mime_type")
        .eq("id", id)
        .eq("hosting_provider", "supabase")
        .maybeSingle();

    if (error || !asset?.storage_bucket || !asset.storage_object_path) {
        return new Response("Editorial media not found.", { status: 404 });
    }

    const variant = new URL(request.url).searchParams.get("variant");
    const objectPath = variant === "thumbnail" && asset.thumbnail_storage_object_path
        ? asset.thumbnail_storage_object_path
        : asset.storage_object_path;
    const { data: file, error: downloadError } = await supabase.storage
        .from(asset.storage_bucket)
        .download(objectPath);
    if (downloadError || !file) {
        return new Response("Editorial media not found.", { status: 404 });
    }

    const { data: article } = await supabase
        .from("editorial_articles")
        .select("status,published_at")
        .eq("id", asset.article_id)
        .maybeSingle();
    const isPublished = article?.status === "published"
        && Boolean(article.published_at)
        && new Date(article.published_at).getTime() <= Date.now();

    return new Response(file, {
        headers: {
            "Content-Type": variant === "thumbnail" && asset.thumbnail_storage_object_path
                ? "image/webp"
                : asset.mime_type || "application/octet-stream",
            "Content-Length": String(file.size),
            "Cache-Control": isPublished
                ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
                : "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
