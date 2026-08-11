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

function hasPrefix(bytes: Uint8Array, expected: readonly number[], offset = 0) {
    return expected.every((value, index) => bytes[offset + index] === value);
}

function hasExpectedMediaSignature(mimeType: string, bytes: Uint8Array) {
    switch (mimeType) {
        case "image/jpeg":
            return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
        case "image/png":
            return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        case "image/webp":
            return hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46])
                && hasPrefix(bytes, [0x57, 0x45, 0x42, 0x50], 8);
        case "image/gif":
            return hasPrefix(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
                || hasPrefix(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
        case "video/webm":
            return hasPrefix(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
        case "video/mp4":
        case "video/quicktime":
        case "video/x-m4v":
            return hasPrefix(bytes, [0x66, 0x74, 0x79, 0x70], 4);
        default:
            return false;
    }
}

async function assertMediaSignature(file: File) {
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!hasExpectedMediaSignature(file.type, header)) {
        throw new Error(`${file.name} does not match its declared image or video format.`);
    }
}

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

export type EditorialMediaUpload = {
    file: File;
    thumbnail: File | null;
    original: File | null;
    width: number | null;
    height: number | null;
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

function optionalFile(formData: FormData, key: string) {
    const value = formData.get(key);
    return value instanceof File && value.size > 0 ? value : null;
}

function optionalPositiveInteger(formData: FormData, key: string) {
    const value = Number(formData.get(key));
    return Number.isInteger(value) && value > 0 ? value : null;
}

export function mediaUploadsFrom(formData: FormData): EditorialMediaUpload[] {
    const count = Number(formData.get("media_upload_count"));
    if (Number.isInteger(count) && count > 0 && count <= 20) {
        return Array.from({ length: count }, (_, index) => {
            const file = optionalFile(formData, `story_media_${index}`);
            if (!file) throw new Error(`Missing prepared media file ${index + 1}.`);
            return {
                file,
                thumbnail: optionalFile(formData, `story_media_thumbnail_${index}`),
                original: optionalFile(formData, `story_media_original_${index}`),
                width: optionalPositiveInteger(formData, `story_media_width_${index}`),
                height: optionalPositiveInteger(formData, `story_media_height_${index}`),
            };
        });
    }

    return mediaFilesFrom(formData).map((file) => ({
        file,
        thumbnail: null,
        original: null,
        width: null,
        height: null,
    }));
}

export async function storeMediaAssets({
    supabase,
    userId,
    articleId,
    uploads,
    altText,
    caption,
}: {
    supabase: EditorialSupabaseClient;
    userId: string;
    articleId: string;
    uploads: EditorialMediaUpload[];
    altText: string | null;
    caption: string | null;
}) {
    const storedAssets: StoredMediaAsset[] = [];

    for (const [index, upload] of uploads.entries()) {
        const { file, thumbnail, original, width, height } = upload;
        if (!allowedMimeTypes.has(file.type)) {
            throw new Error(`${file.name} is not a supported image or video format.`);
        }
        if (file.size <= 0 || file.size > maxMediaBytes) {
            throw new Error(`${file.name} must be between 1 byte and 50 MB.`);
        }
        await assertMediaSignature(file);

        if (thumbnail && (thumbnail.type !== "image/webp" || thumbnail.size <= 0 || thumbnail.size > maxMediaBytes)) {
            throw new Error(`${file.name} has an invalid thumbnail derivative.`);
        }
        if (thumbnail) await assertMediaSignature(thumbnail);
        if (original && (original.size <= 0 || original.size > maxMediaBytes)) {
            throw new Error(`${file.name} has an invalid original file size.`);
        }

        const assetId = crypto.randomUUID();
        const objectPath = `${userId}/${articleId}/${assetId}-article-${safeFileName(file.name)}`;
        const thumbnailPath = thumbnail
            ? `${userId}/${articleId}/${assetId}-thumbnail.webp`
            : null;
        const originalPath = original
            ? `${userId}/${articleId}/${assetId}-original-${safeFileName(original.name)}`
            : null;
        const applicationUrl = `/api/editorial-media/${assetId}`;
        const thumbnailUrl = thumbnailPath
            ? `/api/editorial-media/${assetId}?variant=thumbnail`
            : applicationUrl;
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(objectPath, bytes, {
                cacheControl: "31536000",
                contentType: file.type,
                upsert: false,
        });
        if (uploadError) throw new Error(uploadError.message);

        const uploadedPaths = [objectPath];
        for (const item of [
            thumbnail && thumbnailPath ? { file: thumbnail, path: thumbnailPath } : null,
            original && originalPath ? { file: original, path: originalPath } : null,
        ]) {
            if (!item) continue;
            const { error } = await supabase.storage
                .from(bucket)
                .upload(item.path, new Uint8Array(await item.file.arrayBuffer()), {
                    cacheControl: "31536000",
                    contentType: item.file.type,
                    upsert: false,
                });
            if (error) {
                await supabase.storage.from(bucket).remove(uploadedPaths);
                throw new Error(error.message);
            }
            uploadedPaths.push(item.path);
        }

        const { data: record, error: recordError } = await supabase
            .from("editorial_media_assets")
            .insert({
                id: assetId,
                article_id: articleId,
                storage_bucket: bucket,
                storage_object_path: objectPath,
                thumbnail_storage_object_path: thumbnailPath,
                original_storage_object_path: originalPath,
                public_url: applicationUrl,
                thumbnail_url: thumbnailUrl,
                original_file_name: original?.name ?? file.name,
                media_type: file.type.startsWith("video/") ? "video" : "image",
                hosting_provider: "supabase",
                mime_type: file.type,
                size_bytes: file.size,
                original_size_bytes: original?.size ?? file.size,
                pixel_width: width,
                pixel_height: height,
                is_optimized: Boolean(thumbnail && width && height),
                alt_text: altText,
                caption,
                sort_order: index,
                uploaded_by: userId,
            })
            .select("id,public_url,media_type,hosting_provider,source_url,alt_text,caption")
            .single();

        if (recordError || !record) {
            await supabase.storage.from(bucket).remove(uploadedPaths);
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

export async function replaceImageDerivatives({
    supabase,
    userId,
    articleId,
    assetId,
    upload,
}: {
    supabase: EditorialSupabaseClient;
    userId: string;
    articleId: string;
    assetId: string;
    upload: EditorialMediaUpload;
}) {
    if (!upload.thumbnail || !upload.width || !upload.height || upload.file.type !== "image/webp") {
        throw new Error("A WebP article image and thumbnail are required.");
    }
    await Promise.all([
        assertMediaSignature(upload.file),
        assertMediaSignature(upload.thumbnail),
    ]);
    const { data: existing, error: existingError } = await supabase
        .from("editorial_media_assets")
        .select("storage_bucket,storage_object_path,original_storage_object_path,thumbnail_storage_object_path,public_url,original_file_name,size_bytes,original_size_bytes,alt_text,caption")
        .eq("id", assetId)
        .eq("article_id", articleId)
        .eq("media_type", "image")
        .eq("hosting_provider", "supabase")
        .single();
    if (existingError || !existing) {
        throw new Error(existingError?.message ?? "Image was not found.");
    }

    const revision = crypto.randomUUID();
    const articlePath = `${userId}/${articleId}/${assetId}-${revision}-article.webp`;
    const thumbnailPath = `${userId}/${articleId}/${assetId}-${revision}-thumbnail.webp`;
    const uploadedPaths: string[] = [];
    for (const item of [
        { file: upload.file, path: articlePath },
        { file: upload.thumbnail, path: thumbnailPath },
    ]) {
        const { error } = await supabase.storage
            .from(existing.storage_bucket)
            .upload(item.path, new Uint8Array(await item.file.arrayBuffer()), {
                cacheControl: "31536000",
                contentType: "image/webp",
                upsert: false,
            });
        if (error) {
            if (uploadedPaths.length) await supabase.storage.from(existing.storage_bucket).remove(uploadedPaths);
            throw new Error(error.message);
        }
        uploadedPaths.push(item.path);
    }

    const applicationUrl = `/api/editorial-media/${assetId}?v=${revision}`;
    const thumbnailUrl = `/api/editorial-media/${assetId}?variant=thumbnail&v=${revision}`;
    const { data: record, error: updateError } = await supabase
        .from("editorial_media_assets")
        .update({
            storage_object_path: articlePath,
            thumbnail_storage_object_path: thumbnailPath,
            original_storage_object_path: existing.original_storage_object_path ?? existing.storage_object_path,
            public_url: applicationUrl,
            thumbnail_url: thumbnailUrl,
            source_url: applicationUrl,
            mime_type: "image/webp",
            size_bytes: upload.file.size,
            original_size_bytes: existing.original_size_bytes ?? existing.size_bytes,
            pixel_width: upload.width,
            pixel_height: upload.height,
            is_optimized: true,
        })
        .eq("id", assetId)
        .eq("article_id", articleId)
        .select("id,public_url,media_type,hosting_provider,source_url,alt_text,caption")
        .single();
    if (updateError || !record) {
        await supabase.storage.from(existing.storage_bucket).remove(uploadedPaths);
        throw new Error(updateError?.message ?? "Optimized image was not saved.");
    }

    const stalePaths = [
        existing.original_storage_object_path ? existing.storage_object_path : null,
        existing.thumbnail_storage_object_path,
    ].filter((path): path is string => Boolean(path));
    if (stalePaths.length) await supabase.storage.from(existing.storage_bucket).remove(stalePaths);

    return {
        id: record.id,
        publicUrl: record.public_url,
        mediaType: "image" as const,
        hostingProvider: "supabase" as const,
        sourceUrl: record.source_url ?? record.public_url,
        altText: record.alt_text ?? "",
        caption: record.caption ?? "",
        previousPublicUrl: existing.public_url,
    };
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
