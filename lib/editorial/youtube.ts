export const CABEUS_YOUTUBE_CHANNEL_URL =
    "https://www.youtube.com/channel/UCVEihTOMM2801sGKtplQ7qw";
export const YOUTUBE_UPLOAD_URL = "https://www.youtube.com/upload";

const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const youtubeHosts = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtu.be",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
]);

export type YouTubeVideoReference = {
    videoId: string;
    watchUrl: string;
    embedUrl: string;
};

function videoIdFromPath(pathname: string) {
    const parts = pathname.split("/").filter(Boolean);
    if (!parts.length) return null;
    if (["embed", "shorts", "live"].includes(parts[0])) {
        return parts[1] ?? null;
    }
    return parts[0];
}

export function parseYouTubeVideoUrl(value: string): YouTubeVideoReference {
    let url: URL;
    try {
        url = new URL(value.trim());
    } catch {
        throw new Error("Enter a valid YouTube watch, share, Shorts, Live, or embed URL.");
    }

    const hostname = url.hostname.toLowerCase();
    if (!youtubeHosts.has(hostname) || url.protocol !== "https:") {
        throw new Error("Only HTTPS YouTube video URLs are supported.");
    }

    const candidate = hostname.endsWith("youtu.be")
        ? videoIdFromPath(url.pathname)
        : url.searchParams.get("v") ?? videoIdFromPath(url.pathname);
    const videoId = candidate?.trim() ?? "";

    if (!videoIdPattern.test(videoId)) {
        throw new Error("The YouTube URL does not contain a valid video ID.");
    }

    return {
        videoId,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    };
}

export function isYouTubeEmbedUrl(value: string) {
    try {
        const url = new URL(value);
        return (
            url.protocol === "https:"
            && url.hostname === "www.youtube-nocookie.com"
            && /^\/embed\/[A-Za-z0-9_-]{11}$/.test(url.pathname)
            && url.searchParams.get("rel") === "0"
        );
    } catch {
        return false;
    }
}
