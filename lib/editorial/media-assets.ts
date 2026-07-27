import type { requireEditorialStaff } from "../auth/editorial";

const bucket = "editorial-media";
const maxMediaBytes = 50 * 1024 * 1024;
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
]);

type EditorialSupabaseClient = Awaited<
    ReturnType<typeof requireEditorialStaff>
>["supabase"];

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
    for (const [index, file] of files.entries()) {
        if (!allowedMimeTypes.has(file.type)) {
            throw new Error(`${file.name} is not a supported image or video format.`);
        }
        if (file.size <= 0 || file.size > maxMediaBytes) {
            throw new Error(`${file.name} must be between 1 byte and 50 MB.`);
        }

        const objectPath = `${userId}/${articleId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(objectPath, bytes, {
                cacheControl: "31536000",
                contentType: file.type,
                upsert: false,
            });
        if (uploadError) throw new Error(uploadError.message);

        const publicUrl = supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
        const { error: recordError } = await supabase
            .from("editorial_media_assets")
            .insert({
                article_id: articleId,
                storage_bucket: bucket,
                storage_object_path: objectPath,
                public_url: publicUrl,
                original_file_name: file.name,
                media_type: file.type.startsWith("video/") ? "video" : "image",
                mime_type: file.type,
                size_bytes: file.size,
                alt_text: altText,
                caption,
                sort_order: index,
                uploaded_by: userId,
            });

        if (recordError) {
            await supabase.storage.from(bucket).remove([objectPath]);
            throw new Error(recordError.message);
        }
    }
}
