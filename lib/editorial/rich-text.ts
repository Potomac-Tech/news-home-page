import sanitizeHtml from "sanitize-html";
import { DomUtils, parseDocument } from "htmlparser2";
import { isYouTubeEmbedUrl } from "./youtube";

const allowedTags = [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "h2",
    "h3",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "font",
    "figure",
    "figcaption",
    "img",
    "video",
    "iframe",
];

export function sanitizeArticleHtml(value: string) {
    return sanitizeHtml(value, {
        allowedTags,
        allowedAttributes: {
            a: ["href", "target", "rel"],
            font: ["face", "size"],
            figure: ["data-media-id", "contenteditable"],
            img: ["src", "alt", "loading"],
            video: [
                "src",
                "controls",
                "preload",
                "playsinline",
                "aria-label",
            ],
            iframe: [
                "src",
                "title",
                "loading",
                "allow",
                "allowfullscreen",
                "referrerpolicy",
            ],
        },
        allowedSchemes: ["http", "https", "mailto"],
        allowedIframeHostnames: ["www.youtube-nocookie.com"],
        transformTags: {
            a: (_tagName, attributes) => ({
                tagName: "a",
                attribs: {
                    ...attributes,
                    target: "_blank",
                    rel: "noopener noreferrer",
                },
            }),
            iframe: (_tagName, attributes) => {
                if (!isYouTubeEmbedUrl(attributes.src ?? "")) {
                    const removedAttributes: Record<string, string> = {
                        class: "removed-unsupported-embed",
                    };
                    return {
                        tagName: "span",
                        attribs: removedAttributes,
                    };
                }
                const iframeAttributes: Record<string, string> = {
                    src: attributes.src,
                    title: attributes.title || "YouTube article video",
                    loading: "lazy",
                    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                    allowfullscreen: "",
                    referrerpolicy: "strict-origin-when-cross-origin",
                };
                return {
                    tagName: "iframe",
                    attribs: iframeAttributes,
                };
            },
        },
    }).trim();
}

export function isRichArticleHtml(value: string) {
    return /<(?:p|br|strong|b|em|i|u|s|h2|h3|blockquote|ul|ol|li|a|font|figure|figcaption|img|video|iframe)(?:\s|>)/i.test(value);
}

export function articlePlainText(value: string) {
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
        .replace(/\s+/g, " ")
        .trim();
}

type RenderArticleHtmlOptions = {
    excludeImageSrcs?: Array<string | null | undefined>;
};

function normalizeMediaSource(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
        const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
        const parsed = new URL(trimmed, "https://relative.cabeus.invalid");
        let pathname = parsed.pathname;

        try {
            pathname = decodeURIComponent(pathname);
        } catch {
            // Preserve the parsed path if it contains malformed escape sequences.
        }

        return {
            host: isAbsolute ? parsed.host.toLowerCase() : null,
            pathname: pathname.replace(/\/{2,}/g, "/").replace(/\/$/, ""),
        };
    } catch {
        return {
            host: null,
            pathname: trimmed,
        };
    }
}

function mediaSourcesMatch(candidate: string, excluded: string) {
    const normalizedCandidate = normalizeMediaSource(candidate);
    const normalizedExcluded = normalizeMediaSource(excluded);

    if (!normalizedCandidate || !normalizedExcluded) return false;
    if (normalizedCandidate.pathname !== normalizedExcluded.pathname) return false;

    return !normalizedCandidate.host
        || !normalizedExcluded.host
        || normalizedCandidate.host === normalizedExcluded.host;
}

function findContainingFigure(image: ReturnType<typeof DomUtils.findAll>[number]) {
    let parent = DomUtils.getParent(image);

    while (parent) {
        if (DomUtils.isTag(parent) && parent.name === "figure") {
            return parent;
        }
        parent = DomUtils.getParent(parent);
    }

    return null;
}

function removeDuplicateImages(html: string, excludedImageSrcs: string[]) {
    const document = parseDocument(html);
    const duplicateImages = DomUtils.findAll(
        (element) => element.name === "img"
            && excludedImageSrcs.some((excludedImageSrc) =>
                mediaSourcesMatch(element.attribs.src ?? "", excludedImageSrc)
            ),
        document
    );
    const removalTargets = new Set(
        duplicateImages.map(
            (image) => findContainingFigure(image) ?? image
        )
    );

    removalTargets.forEach((target) => DomUtils.removeElement(target));
    return DomUtils.getOuterHTML(document);
}

export function renderArticleHtml(
    value: string,
    options: RenderArticleHtmlOptions = {}
) {
    const rendered = isRichArticleHtml(value)
        ? sanitizeArticleHtml(value)
        : value
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => `<p>${sanitizeHtml(paragraph, {
                allowedTags: [],
                allowedAttributes: {},
            })}</p>`)
            .join("");

    const excludedImageSrcs = options.excludeImageSrcs?.filter(
        (value): value is string => Boolean(value)
    ) ?? [];
    if (excludedImageSrcs.length) {
        return removeDuplicateImages(rendered, excludedImageSrcs);
    }

    return rendered;
}
