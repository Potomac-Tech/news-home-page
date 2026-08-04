import type { requireEditorialStaff } from "../auth/editorial";
import { parseYouTubeVideoUrl } from "./youtube";

const bucket = "editorial-media";
const maxMediaBytes = 50 * 1024 * 1024;
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
]);

type EditorialSupabaseClient = Awaited<
    ReturnType<typeof requireEditorialStaff>
>["supabase"];

export type StoredMediaAsset = {
    id: string;
    publicUrl: string;
    mediaType: "image" | "video";
    hostingProvider: "supabase" | "youtube";
    sourceUrl: string;
    altText: string;
    caption: string;
};

function safeFileName(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "story-media";
}

export function mediaFilesFrom(formData: FormData) {
    return formData
        .getAll("story_media")
        .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function storeMediaAssets({
    supabase,
    userId,
    articleId,
    files,
    altText,
    caption,
}: {
    supabase: EditorialSupabaseClient;
    userId: string;
    articleId: string;
    files: File[];
    altText: string | null;
    caption: string | null;
}) {
    const storedAssets: StoredMediaAsset[] = [];

    for (const [index, file] of files.entries()) {
        if (!allowedMimeTypes.has(file.type)) {
            throw new Error(`${file.name} is not a supported image or video format.`);
        }
        if (file.size <= 0 || file.size > maxMediaBytes) {
            throw new Error(`${file.name} must be between 1 byte and 50 MB.`);
        }

        const assetId = crypto.randomUUID();
        const objectPath = `${userId}/${articleId}/${assetId}-${safeFileName(file.name)}`;
        const applicationUrl = `/api/editorial-media/${assetId}`;
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(objectPath, bytes, {
                cacheControl: "31536000",
                contentType: file.type,
                upsert: false,
            });
        if (uploadError) throw new Error(uploadError.message);

        const { data: record, error: recordError } = await supabase
            .from("editorial_media_assets")
            .insert({
                id: assetId,
                article_id: articleId,
                storage_bucket: bucket,
                storage_object_path: objectPath,
                public_url: applicationUrl,
                original_file_name: file.name,
                media_type: file.type.startsWith("video/") ? "video" : "image",
                hosting_provider: "supabase",
                mime_type: file.type,
                size_bytes: file.size,
                alt_text: altText,
                caption,
                sort_order: index,
                uploaded_by: userId,
            })
            .select("id,public_url,media_type,hosting_provider,source_url,alt_text,caption")
            .single();

        if (recordError || !record) {
            await supabase.storage.from(bucket).remove([objectPath]);
            throw new Error(recordError?.message ?? "Media record was not created.");
        }

        storedAssets.push({
            id: record.id,
            publicUrl: record.public_url,
            mediaType: record.media_type as "image" | "video",
            hostingProvider: "supabase",
            sourceUrl: record.source_url ?? applicationUrl,
            altText: record.alt_text ?? "",
            caption: record.caption ?? "",
        });
    }

    return storedAssets;
}

export async function storeYouTubeAsset({
    supabase,
    userId,
    articleId,
    youtubeUrl,
    altText,
    caption,
}: {
    supabase: EditorialSupabaseClient;
    userId: string;
    articleId: string;
    youtubeUrl: string;
    altText: string | null;
    caption: string | null;
}) {
    const reference = parseYouTubeVideoUrl(youtubeUrl);
    const { data: record, error } = await supabase
        .from("editorial_media_assets")
        .insert({
            article_id: articleId,
            storage_bucket: null,
            storage_object_path: null,
            public_url: reference.embedUrl,
            original_file_name: null,
            media_type: "video",
            hosting_provider: "youtube",
            external_video_id: reference.videoId,
            source_url: reference.watchUrl,
            mime_type: null,
            size_bytes: null,
            alt_text: altText,
            caption,
            sort_order: 0,
            uploaded_by: userId,
        })
        .select("id,public_url,media_type,hosting_provider,source_url,alt_text,caption")
        .single();

    if (error || !record) {
        if (error?.code === "23505") {
            throw new Error("This YouTube video is already attached to the story.");
        }
        throw new Error(error?.message ?? "YouTube video was not attached.");
    }

    return {
        id: record.id,
        publicUrl: record.public_url,
        mediaType: "video" as const,
        hostingProvider: "youtube" as const,
        sourceUrl: record.source_url ?? reference.watchUrl,
        altText: record.alt_text ?? "",
        caption: record.caption ?? "",
    };
}
