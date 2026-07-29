import sanitizeHtml from "sanitize-html";
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

export function renderArticleHtml(value: string) {
    if (isRichArticleHtml(value)) {
        return sanitizeArticleHtml(value);
    }

    return value
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `<p>${sanitizeHtml(paragraph, {
            allowedTags: [],
            allowedAttributes: {},
        })}</p>`)
        .join("");
}
