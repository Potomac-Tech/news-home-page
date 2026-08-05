type EditorialImageAsset = {
    publicUrl: string;
    mediaType: "image" | "video";
};

type MediaFingerprint = {
    etag: string;
    contentLength: string;
};

function originalUploadName(value: string) {
    try {
        const pathname = new URL(value).pathname;
        const basename = decodeURIComponent(pathname.split("/").pop() ?? "");
        return basename
            .replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "")
            .toLowerCase();
    } catch {
        return "";
    }
}

async function loadMediaFingerprint(url: string): Promise<MediaFingerprint | null> {
    try {
        const response = await fetch(url, {
            method: "HEAD",
            next: { revalidate: 86_400 },
        });
        if (!response.ok) return null;

        const etag = response.headers.get("etag")?.trim();
        const contentLength = response.headers.get("content-length")?.trim();
        if (!etag || !contentLength) return null;

        return { etag, contentLength };
    } catch {
        return null;
    }
}

function fingerprintsMatch(
    left: MediaFingerprint | null,
    right: MediaFingerprint | null
) {
    return Boolean(
        left
        && right
        && left.etag === right.etag
        && left.contentLength === right.contentLength
    );
}

export async function findDuplicateHeroImageUrls(
    heroImageUrl: string,
    mediaAssets: EditorialImageAsset[]
) {
    if (!heroImageUrl) return [];

    const heroUploadName = originalUploadName(heroImageUrl);
    const candidates = mediaAssets.filter(
        (asset) => asset.mediaType === "image"
            && asset.publicUrl !== heroImageUrl
            && heroUploadName
            && originalUploadName(asset.publicUrl) === heroUploadName
    );
    if (!candidates.length) return [heroImageUrl];

    const [heroFingerprint, ...candidateFingerprints] = await Promise.all([
        loadMediaFingerprint(heroImageUrl),
        ...candidates.map((asset) => loadMediaFingerprint(asset.publicUrl)),
    ]);

    return [
        heroImageUrl,
        ...candidates
            .filter((_asset, index) => fingerprintsMatch(
                heroFingerprint,
                candidateFingerprints[index]
            ))
            .map((asset) => asset.publicUrl),
    ];
}
