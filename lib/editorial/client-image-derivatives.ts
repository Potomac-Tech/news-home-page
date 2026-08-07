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

async function loadImage(file: File) {
    const objectUrl = URL.createObjectURL(file);
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
            close: () => URL.revokeObjectURL(objectUrl),
        };
    } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
    }
}

export async function prepareEditorialMedia(file: File): Promise<PreparedEditorialMedia> {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
        return { primary: file, thumbnail: null, original: null, width: null, height: null };
    }

    // HTMLImageElement handles camera JPEG metadata more reliably than
    // createImageBitmap, which can stall indefinitely on some large files.
    const image = await loadImage(file);
    try {
        const article = await renderDerivative(image.source, image.width, image.height, articleMaxWidth);
        const thumbnail = await renderDerivative(image.source, image.width, image.height, thumbnailMaxWidth);
        return {
            primary: new File([article.blob], derivativeName(file.name, "article"), { type: "image/webp" }),
            thumbnail: new File([thumbnail.blob], derivativeName(file.name, "thumbnail"), { type: "image/webp" }),
            original: file,
            width: article.width,
            height: article.height,
        };
    } finally {
        image.close();
    }
}

export async function prepareEditorialMediaFormData(formData: FormData) {
    const files = formData
        .getAll("story_media")
        .filter((value): value is File => value instanceof File && value.size > 0);
    if (!files.length) return 0;

    formData.delete("story_media");
    formData.set("media_upload_count", String(files.length));
    const prepared = await Promise.all(files.map(prepareEditorialMedia));
    prepared.forEach((media, index) => {
        formData.set(`story_media_${index}`, media.primary);
        if (media.thumbnail) formData.set(`story_media_thumbnail_${index}`, media.thumbnail);
        if (media.original) formData.set(`story_media_original_${index}`, media.original);
        if (media.width) formData.set(`story_media_width_${index}`, String(media.width));
        if (media.height) formData.set(`story_media_height_${index}`, String(media.height));
    });
    return prepared.length;
}
