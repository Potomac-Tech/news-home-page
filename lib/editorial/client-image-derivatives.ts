const articleMaxWidth = 1600;
const thumbnailMaxWidth = 640;
const webpQuality = 0.82;

export type PreparedEditorialMedia = {
    primary: File;
    thumbnail: File | null;
    original: File | null;
    width: number | null;
    height: number | null;
};

function derivativeName(fileName: string, suffix: string) {
    const stem = fileName.replace(/\.[^.]+$/, "") || "story-image";
    return `${stem}.${suffix}.webp`;
}

function canvasBlob(canvas: HTMLCanvasElement) {
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error("The browser could not optimize this image.")),
            "image/webp",
            webpQuality
        );
    });
}

async function renderDerivative(
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
    maxWidth: number
) {
    const scale = Math.min(1, maxWidth / sourceWidth);
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser could not prepare this image.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, width, height);
    return { blob: await canvasBlob(canvas), width, height };
}

async function loadImage(file: File, sourceUrl?: string) {
    const ownsObjectUrl = !sourceUrl;
    const objectUrl = sourceUrl ?? URL.createObjectURL(file);
    const image = new Image();
    try {
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("The browser could not decode this image."));
            image.src = objectUrl;
        });
        return {
            source: image,
            width: image.naturalWidth,
            height: image.naturalHeight,
            close: () => {
                if (ownsObjectUrl) URL.revokeObjectURL(objectUrl);
            },
        };
    } catch (error) {
        if (ownsObjectUrl) URL.revokeObjectURL(objectUrl);
        throw error;
    }
}

export async function prepareEditorialMedia(
    file: File,
    sourceUrl?: string
): Promise<PreparedEditorialMedia> {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
        return { primary: file, thumbnail: null, original: null, width: null, height: null };
    }

    // HTMLImageElement handles camera JPEG metadata more reliably than
    // createImageBitmap, which can stall indefinitely on some large files.
    const image = await loadImage(file, sourceUrl);
    try {
        return await prepareEditorialImage(file, image.source, image.width, image.height);
    } finally {
        image.close();
    }
}

async function prepareEditorialImage(
    file: File,
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number
): Promise<PreparedEditorialMedia> {
    const article = await renderDerivative(source, sourceWidth, sourceHeight, articleMaxWidth);
    const thumbnail = await renderDerivative(source, sourceWidth, sourceHeight, thumbnailMaxWidth);
    return {
        primary: new File([article.blob], derivativeName(file.name, "article"), { type: "image/webp" }),
        thumbnail: new File([thumbnail.blob], derivativeName(file.name, "thumbnail"), { type: "image/webp" }),
        original: file,
        width: article.width,
        height: article.height,
    };
}

export async function prepareEditorialMediaFromImage(file: File, image: HTMLImageElement) {
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
        throw new Error("The displayed image is not ready to optimize.");
    }
    return prepareEditorialImage(file, image, image.naturalWidth, image.naturalHeight);
}

function setPreparedMedia(formData: FormData, media: PreparedEditorialMedia, index: number) {
    formData.set(`story_media_${index}`, media.primary);
    if (media.thumbnail) formData.set(`story_media_thumbnail_${index}`, media.thumbnail);
    if (media.original) formData.set(`story_media_original_${index}`, media.original);
    if (media.width) formData.set(`story_media_width_${index}`, String(media.width));
    if (media.height) formData.set(`story_media_height_${index}`, String(media.height));
}

export async function prepareEditorialMediaFormData(
    formData: FormData,
    sourceUrls: string[] = []
) {
    const files = formData
        .getAll("story_media")
        .filter((value): value is File => value instanceof File && value.size > 0);
    if (!files.length) return 0;

    formData.delete("story_media");
    formData.set("media_upload_count", String(files.length));
    const prepared = await Promise.all(
        files.map((file, index) => prepareEditorialMedia(file, sourceUrls[index]))
    );
    prepared.forEach((media, index) => setPreparedMedia(formData, media, index));
    return prepared.length;
}

export async function prepareRenderedEditorialMediaFormData(
    formData: FormData,
    file: File,
    image: HTMLImageElement
) {
    formData.delete("story_media");
    formData.set("media_upload_count", "1");
    setPreparedMedia(formData, await prepareEditorialMediaFromImage(file, image), 0);
}
