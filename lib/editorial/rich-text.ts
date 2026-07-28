import sanitizeHtml from "sanitize-html";

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
        },
        allowedSchemes: ["http", "https", "mailto"],
        transformTags: {
            a: (_tagName, attributes) => ({
                tagName: "a",
                attribs: {
                    ...attributes,
                    target: "_blank",
                    rel: "noopener noreferrer",
                },
            }),
        },
    }).trim();
}

export function isRichArticleHtml(value: string) {
    return /<(?:p|br|strong|b|em|i|u|s|h2|h3|blockquote|ul|ol|li|a|font|figure|figcaption|img|video)(?:\s|>)/i.test(value);
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
