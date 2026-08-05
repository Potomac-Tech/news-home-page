export const CTA_ASSET_BUCKET = "cta-assets";
export const CTA_ASSET_MAX_BYTES = 8 * 1024 * 1024;
export const CTA_ASSET_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
] as const;

export type CtaProduct = "pathfinder" | "source";

function uint24le(bytes: Uint8Array, offset: number) {
    return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function pngDimensions(bytes: Uint8Array) {
    if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50) {
        return null;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegDimensions(bytes: Uint8Array) {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        return null;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 2;

    while (offset + 8 < bytes.length) {
        if (bytes[offset] !== 0xff) {
            offset += 1;
            continue;
        }

        const marker = bytes[offset + 1];
        const segmentLength = view.getUint16(offset + 2);
        if (marker >= 0xc0 && marker <= 0xc3) {
            return {
                width: view.getUint16(offset + 7),
                height: view.getUint16(offset + 5),
            };
        }
        if (segmentLength < 2) break;
        offset += segmentLength + 2;
    }

    return null;
}

function webpDimensions(bytes: Uint8Array) {
    const signature = String.fromCharCode(...bytes.slice(0, 4));
    const format = String.fromCharCode(...bytes.slice(8, 12));
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (bytes.length < 30 || signature !== "RIFF" || format !== "WEBP") {
        return null;
    }

    if (chunk === "VP8X") {
        return {
            width: uint24le(bytes, 24) + 1,
            height: uint24le(bytes, 27) + 1,
        };
    }
    if (chunk === "VP8L") {
        return {
            width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
            height: 1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
        };
    }
    if (chunk === "VP8 ") {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        return {
            width: view.getUint16(26, true) & 0x3fff,
            height: view.getUint16(28, true) & 0x3fff,
        };
    }

    return null;
}

export function readImageDimensions(bytes: Uint8Array, mimeType: string) {
    const dimensions =
        mimeType === "image/png"
            ? pngDimensions(bytes)
            : mimeType === "image/jpeg"
              ? jpegDimensions(bytes)
              : mimeType === "image/webp"
                ? webpDimensions(bytes)
                : null;

    if (
        !dimensions ||
        dimensions.width < 640 ||
        dimensions.height < 360 ||
        dimensions.width > 8000 ||
        dimensions.height > 8000
    ) {
        throw new Error("Image dimensions must be between 640x360 and 8000x8000 pixels.");
    }

    return dimensions;
}

export function validateCtaImageFile(file: File) {
    if (!CTA_ASSET_MIME_TYPES.includes(file.type as (typeof CTA_ASSET_MIME_TYPES)[number])) {
        throw new Error("CTA images must be PNG, JPEG, or WebP files.");
    }
    if (file.size <= 0 || file.size > CTA_ASSET_MAX_BYTES) {
        throw new Error("CTA images must be no larger than 8 MB.");
    }
}

export function safeCtaObjectName(fileName: string) {
    const extension = fileName.toLowerCase().match(/\.(png|jpe?g|webp)$/)?.[0] ?? "";
    const base = fileName
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
    return `${base || "cta-image"}-${crypto.randomUUID()}${extension}`;
}
