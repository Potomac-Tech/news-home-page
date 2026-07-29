"use client";

import {
    type ClipboardEvent,
    type DragEvent,
    useMemo,
    useRef,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    type EditorialSectionSlug,
    editorialSections,
} from "../../lib/editorial/section-tags";
import {
    addYouTubeArticleMedia,
    createArticleDraft,
    removeArticleMedia,
    setArticleHeroMedia,
    uploadArticleMedia,
    updateArticleSectionTags,
    updateArticleDraft,
    updateArticleMediaMetadata,
} from "../admin/editorial/actions";
import {
    CABEUS_YOUTUBE_CHANNEL_URL,
    YOUTUBE_UPLOAD_URL,
} from "../../lib/editorial/youtube";

export type StudioArticle = {
    id: string;
    slug: string;
    status: string;
    accessTier: string;
    title: string;
    authorName: string;
    publicSummary: string;
    publicTeaser: string;
    intro: string;
    body: string;
    bodyExcerpt: string;
    seoTitle: string;
    seoDescription: string;
    aeoSummary: string;
    heroImageUrl: string;
    publishAt: string;
    updatedAt: string;
    sectionTags: EditorialSectionSlug[];
    sourceDocuments: Array<{
        id: string;
        fileName: string;
        sizeBytes: number;
        createdAt: string;
    }>;
    mediaAssets: Array<{
        id: string;
        publicUrl: string;
        mediaType: "image" | "video";
        hostingProvider: "supabase" | "youtube";
        sourceUrl: string;
        altText: string;
        caption: string;
    }>;
};

const inputClass =
    "mt-2 w-full border border-potomac-regolith/30 bg-potomac-primary px-4 py-3 text-base text-white outline-none transition placeholder:text-potomac-regolith/55 focus:border-potomac-gold";
const labelClass =
    "block font-mono text-[0.64rem] font-bold uppercase text-potomac-gold";

function slugify(value: string) {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function toEditorHtml(value: string) {
    if (/<(?:p|br|strong|b|em|i|u|s|h2|h3|blockquote|ul|ol|li|a|font|figure|figcaption|img|video|iframe)(?:\s|>)/i.test(value)) {
        return value;
    }

    return value
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
        .join("");
}

function editorPlainText(value: string) {
    if (typeof document === "undefined") {
        return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    const container = document.createElement("div");
    container.innerHTML = value;
    return (container.textContent ?? "").replace(/\s+/g, " ").trim();
}

function emptyArticle(): StudioArticle {
    return {
        id: "new",
        slug: "",
        status: "draft",
        accessTier: "explorer",
        title: "",
        authorName: "",
        publicSummary: "",
        publicTeaser: "",
        intro: "",
        body: "",
        bodyExcerpt: "",
        seoTitle: "",
        seoDescription: "",
        aeoSummary: "",
        heroImageUrl: "",
        publishAt: "",
        updatedAt: "",
        sectionTags: ["news"],
        sourceDocuments: [],
        mediaAssets: [],
    };
}

function formatUpdatedDate(value: string) {
    if (!value) return "Not saved";
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: "UTC",
    }).format(new Date(value));
}

function formatFileSize(bytes: number) {
    return bytes < 1_000_000
        ? `${Math.max(1, Math.round(bytes / 1_000))} KB`
        : `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function MediaAssetEditor({
    asset,
    disabled,
    onSave,
    onRemove,
    onInsert,
    onUseAsThumbnail,
    isThumbnail,
}: {
    asset: StudioArticle["mediaAssets"][number];
    disabled: boolean;
    onSave: (assetId: string, altText: string, caption: string) => Promise<void>;
    onRemove: (assetId: string) => Promise<void>;
    onInsert: (asset: StudioArticle["mediaAssets"][number]) => void;
    onUseAsThumbnail: (assetId: string) => Promise<void>;
    isThumbnail: boolean;
}) {
    const [altText, setAltText] = useState(asset.altText);
    const [caption, setCaption] = useState(asset.caption);

    return (
        <figure
            draggable
            onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData("application/x-cabeus-media", asset.id);
            }}
            className="border border-potomac-regolith/25 p-2"
        >
            {asset.hostingProvider === "youtube" ? (
                <iframe
                    src={asset.publicUrl}
                    title={altText || "YouTube article video"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="aspect-video w-full"
                />
            ) : asset.mediaType === "video" ? (
                <video
                    src={asset.publicUrl}
                    className="aspect-video w-full object-cover"
                    controls
                    preload="metadata"
                    playsInline
                    aria-label={altText || "Article video"}
                />
            ) : (
                <img
                    src={asset.publicUrl}
                    alt={altText}
                    className="aspect-video w-full object-cover"
                />
            )}
            {asset.hostingProvider === "youtube" ? (
                <a
                    href={asset.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-mono text-[0.58rem] font-bold uppercase text-potomac-gold underline"
                >
                    Open on YouTube
                </a>
            ) : null}
            <label className={`${labelClass} mt-3`}>
                Media description
                <input
                    value={altText}
                    onChange={(event) => setAltText(event.target.value)}
                    className={inputClass}
                    placeholder="Describe this media"
                />
            </label>
            <label className={`${labelClass} mt-3`}>
                Caption
                <input
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    className={inputClass}
                    placeholder="Optional caption or credit"
                />
            </label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onInsert({
                    ...asset,
                    altText,
                    caption,
                })}
                className="mt-3 w-full bg-potomac-gold px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-potomac-primary disabled:opacity-40"
            >
                Insert at cursor
            </button>
            {asset.mediaType === "image" ? (
                <button
                    type="button"
                    disabled={disabled || isThumbnail}
                    onClick={() => void onUseAsThumbnail(asset.id)}
                    className="mt-2 w-full border border-potomac-gold/55 px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-potomac-gold disabled:opacity-55"
                >
                    {isThumbnail ? "Main-page thumbnail" : "Use as thumbnail"}
                </button>
            ) : null}
            <button
                type="button"
                disabled={disabled}
                onClick={() => void onSave(asset.id, altText, caption)}
                className="mt-3 w-full border border-potomac-gold/55 px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-potomac-gold hover:border-potomac-gold disabled:opacity-40"
            >
                Save media details
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => void onRemove(asset.id)}
                className="mt-2 w-full border border-red-300/45 px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-red-200 hover:border-red-200 disabled:opacity-40"
            >
                Remove media
            </button>
        </figure>
    );
}

export function EditorialStudio({
    articles,
    startNew = false,
}: {
    articles: StudioArticle[];
    startNew?: boolean;
}) {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState(
        startNew ? "new" : articles[0]?.id ?? "new"
    );
    const selected = useMemo(
        () => articles.find((article) => article.id === selectedId) ?? emptyArticle(),
        [articles, selectedId]
    );
    const [draft, setDraft] = useState(selected);
    const [bodyHtml, setBodyHtml] = useState(() => toEditorHtml(selected.body));
    const bodyHtmlRef = useRef(bodyHtml);
    const [query, setQuery] = useState("");
    const [importStatus, setImportStatus] = useState<string>("");
    const [saveStatus, setSaveStatus] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [mediaAltText, setMediaAltText] = useState("");
    const [mediaCaption, setMediaCaption] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [selectedMediaNames, setSelectedMediaNames] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const bodyInputRef = useRef<HTMLInputElement>(null);
    const savedSelectionRef = useRef<Range | null>(null);
    const insertUploadedMediaRef = useRef(false);
    const formId = "editorial-studio-story-form";

    const filteredArticles = articles.filter((article) =>
        `${article.title} ${article.authorName} ${article.status}`.toLowerCase().includes(query.toLowerCase())
    );
    const action = draft.id === "new" ? createArticleDraft : updateArticleDraft;

    function replaceBodyHtml(nextBody: string) {
        bodyHtmlRef.current = nextBody;
        setBodyHtml(nextBody);
        if (bodyRef.current) bodyRef.current.innerHTML = nextBody;
        if (bodyInputRef.current) bodyInputRef.current.value = nextBody;
    }

    function syncBodyFromEditor() {
        const nextBody = bodyRef.current?.innerHTML ?? "";
        bodyHtmlRef.current = nextBody;
        if (bodyInputRef.current) bodyInputRef.current.value = nextBody;
    }

    function rememberEditorSelection() {
        const selection = window.getSelection();
        if (
            selection?.rangeCount
            && bodyRef.current?.contains(selection.anchorNode)
        ) {
            savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
        }
    }

    function mediaMarkup(asset: StudioArticle["mediaAssets"][number]) {
        const description = escapeHtml(
            asset.altText || (asset.mediaType === "video" ? "Article video" : "Article image")
        );
        const caption = asset.caption
            ? `<figcaption>${escapeHtml(asset.caption)}</figcaption>`
            : "";
        const media = asset.hostingProvider === "youtube"
            ? `<iframe src="${escapeHtml(asset.publicUrl)}" title="${description}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
            : asset.mediaType === "video"
              ? `<video src="${escapeHtml(asset.publicUrl)}" controls preload="metadata" playsinline aria-label="${description}"></video>`
            : `<img src="${escapeHtml(asset.publicUrl)}" alt="${description}" loading="lazy">`;
        return `<figure data-media-id="${escapeHtml(asset.id)}" contenteditable="false">${media}${caption}</figure><p><br></p>`;
    }

    function insertMediaAtCursor(asset: StudioArticle["mediaAssets"][number]) {
        bodyRef.current?.focus();
        const selection = window.getSelection();
        const range = savedSelectionRef.current;
        if (selection && range && bodyRef.current?.contains(range.commonAncestorContainer)) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
        document.execCommand("insertHTML", false, mediaMarkup(asset));
        syncBodyFromEditor();
        rememberEditorSelection();
        setSaveStatus("Media inserted in the story. Save the draft to keep its position.");
    }

    function handleEditorDrop(event: DragEvent<HTMLDivElement>) {
        const assetId = event.dataTransfer.getData("application/x-cabeus-media");
        if (!assetId) return;
        const asset = draft.mediaAssets.find((item) => item.id === assetId);
        if (!asset) return;
        event.preventDefault();
        const caretRange = document.caretRangeFromPoint?.(
            event.clientX,
            event.clientY
        );
        if (caretRange) savedSelectionRef.current = caretRange;
        insertMediaAtCursor(asset);
    }

    function handlePlainTextPaste(event: ClipboardEvent<HTMLDivElement>) {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain");
        const html = text
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
            .join("");
        document.execCommand("insertHTML", false, html || escapeHtml(text));
        syncBodyFromEditor();
    }

    function chooseArticle(article: StudioArticle) {
        setSelectedId(article.id);
        setDraft(article);
        const nextBody = toEditorHtml(article.body);
        replaceBodyHtml(nextBody);
        setImportStatus("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (mediaInputRef.current) mediaInputRef.current.value = "";
        setMediaAltText("");
        setMediaCaption("");
        setYoutubeUrl("");
        setSelectedMediaNames([]);
    }

    function startNewStory() {
        const next = emptyArticle();
        setSelectedId("new");
        setDraft(next);
        replaceBodyHtml("");
        setImportStatus("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (mediaInputRef.current) mediaInputRef.current.value = "";
        setMediaAltText("");
        setMediaCaption("");
        setSelectedMediaNames([]);
    }

    async function saveStory(formData: FormData) {
        setIsSaving(true);
        setSaveStatus("Saving...");
        try {
            const result = await action(formData);
            setSelectedId(result.articleId);
            setDraft((current) => ({
                ...current,
                id: result.articleId,
                heroImageUrl:
                    current.heroImageUrl
                    || result.uploadedMedia.find((asset) => asset.mediaType === "image")?.publicUrl
                    || "",
                mediaAssets: [...current.mediaAssets, ...result.uploadedMedia],
            }));
            if (fileInputRef.current) fileInputRef.current.value = "";
            if (mediaInputRef.current) mediaInputRef.current.value = "";
            setMediaAltText("");
            setMediaCaption("");
            setSelectedMediaNames([]);
            setSaveStatus(
                result.uploadedMedia.length
                    ? `Draft saved with ${result.uploadedMedia.length} new media file${result.uploadedMedia.length === 1 ? "" : "s"}.`
                    : "Draft saved."
            );
            router.refresh();
        } catch (error) {
            setSaveStatus(error instanceof Error ? error.message : "Draft could not be saved.");
        } finally {
            setIsSaving(false);
        }
    }

    async function removeMedia(assetId: string) {
        if (draft.id === "new") return;
        setIsSaving(true);
        setSaveStatus("Removing media...");
        const formData = new FormData();
        formData.set("studio_context", "studio");
        formData.set("article_id", draft.id);
        formData.set("asset_id", assetId);
        try {
            await removeArticleMedia(formData);
            setDraft((current) => ({
                ...current,
                heroImageUrl:
                    current.mediaAssets.find((asset) => asset.id === assetId)?.publicUrl
                    === current.heroImageUrl
                        ? ""
                        : current.heroImageUrl,
                mediaAssets: current.mediaAssets.filter((asset) => asset.id !== assetId),
            }));
            setSaveStatus("Media removed. Preview approval must be renewed.");
            router.refresh();
        } catch (error) {
            setSaveStatus(error instanceof Error ? error.message : "Media could not be removed.");
        } finally {
            setIsSaving(false);
        }
    }

    async function saveMediaDetails(
        assetId: string,
        altText: string,
        caption: string
    ) {
        if (draft.id === "new") return;
        setIsSaving(true);
        setSaveStatus("Saving media details...");
        const formData = new FormData();
        formData.set("studio_context", "studio");
        formData.set("article_id", draft.id);
        formData.set("asset_id", assetId);
        formData.set("media_alt_text", altText);
        formData.set("media_caption", caption);
        try {
            const savedAsset = await updateArticleMediaMetadata(formData);
            setDraft((current) => ({
                ...current,
                mediaAssets: current.mediaAssets.map((asset) =>
                    asset.id === assetId ? savedAsset : asset
                ),
            }));
            setSaveStatus("Media description and caption saved.");
            router.refresh();
        } catch (error) {
            setSaveStatus(
                error instanceof Error
                    ? error.message
                    : "Media details could not be saved."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function uploadMediaImmediately(files: FileList | null) {
        const selectedFiles = Array.from(files ?? []);
        setSelectedMediaNames(selectedFiles.map((file) => file.name));
        if (!selectedFiles.length) return;
        if (draft.id === "new") {
            insertUploadedMediaRef.current = false;
            setSaveStatus("Save the draft once before inserting media into the story.");
            return;
        }

        setIsSaving(true);
        setSaveStatus("Uploading media...");
        const formData = new FormData();
        formData.set("studio_context", "studio");
        formData.set("article_id", draft.id);
        formData.set("media_alt_text", mediaAltText);
        formData.set("media_caption", mediaCaption);
        selectedFiles.forEach((file) => formData.append("story_media", file));
        try {
            const result = await uploadArticleMedia(formData);
            setDraft((current) => ({
                ...current,
                heroImageUrl:
                    current.heroImageUrl
                    || result.uploadedMedia.find((asset) => asset.mediaType === "image")?.publicUrl
                    || "",
                mediaAssets: [...current.mediaAssets, ...result.uploadedMedia],
            }));
            if (insertUploadedMediaRef.current && result.uploadedMedia[0]) {
                insertMediaAtCursor(result.uploadedMedia[0]);
            } else {
                setSaveStatus(
                    `${result.uploadedMedia.length} media file${result.uploadedMedia.length === 1 ? "" : "s"} uploaded.`
                );
            }
            setMediaAltText("");
            setMediaCaption("");
            setSelectedMediaNames([]);
            router.refresh();
        } catch (error) {
            setSaveStatus(
                error instanceof Error ? error.message : "Media could not be uploaded."
            );
        } finally {
            insertUploadedMediaRef.current = false;
            if (mediaInputRef.current) mediaInputRef.current.value = "";
            setIsSaving(false);
        }
    }

    async function attachYouTubeVideo() {
        if (draft.id === "new") {
            setSaveStatus("Save the draft once before attaching a YouTube video.");
            return;
        }
        if (!youtubeUrl.trim()) {
            setSaveStatus("Paste a YouTube video URL first.");
            return;
        }

        setIsSaving(true);
        setSaveStatus("Attaching YouTube video...");
        const formData = new FormData();
        formData.set("studio_context", "studio");
        formData.set("article_id", draft.id);
        formData.set("youtube_url", youtubeUrl);
        formData.set("media_alt_text", mediaAltText);
        formData.set("media_caption", mediaCaption);

        try {
            const result = await addYouTubeArticleMedia(formData);
            setDraft((current) => ({
                ...current,
                mediaAssets: [...current.mediaAssets, ...result.uploadedMedia],
            }));
            setYoutubeUrl("");
            setMediaAltText("");
            setMediaCaption("");
            setSaveStatus("YouTube video attached. Insert it at the intended story position.");
            router.refresh();
        } catch (error) {
            setSaveStatus(
                error instanceof Error
                    ? error.message
                    : "YouTube video could not be attached."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function useAsThumbnail(assetId: string) {
        if (draft.id === "new") return;
        setIsSaving(true);
        setSaveStatus("Updating main-page thumbnail...");
        const formData = new FormData();
        formData.set("studio_context", "studio");
        formData.set("article_id", draft.id);
        formData.set("asset_id", assetId);
        try {
            const result = await setArticleHeroMedia(formData);
            setDraft((current) => ({
                ...current,
                heroImageUrl: result.publicUrl,
            }));
            setSaveStatus("Main-page thumbnail updated for the article and carousel.");
            router.refresh();
        } catch (error) {
            setSaveStatus(
                error instanceof Error
                    ? error.message
                    : "Main-page thumbnail could not be updated."
            );
        } finally {
            setIsSaving(false);
        }
    }

    function updateDraft(field: keyof StudioArticle, value: string) {
        setDraft((current) => ({ ...current, [field]: value }));
    }

    async function toggleSectionTag(slug: EditorialSectionSlug) {
        if (isSaving) return;
        const previousSections = draft.sectionTags;
        const selected = previousSections.includes(slug)
            ? previousSections.filter((tag) => tag !== slug)
            : [...previousSections, slug];
        const nextSections: EditorialSectionSlug[] = selected.length
            ? selected
            : ["news"];

        setDraft((current) => ({ ...current, sectionTags: nextSections }));
        if (draft.id === "new") {
            setSaveStatus("Sections will save with the draft.");
            return;
        }

        setIsSaving(true);
        setSaveStatus("Saving article sections...");
        try {
            const result = await updateArticleSectionTags(
                draft.id,
                nextSections
            );
            setDraft((current) => ({
                ...current,
                sectionTags: result.sectionTags,
            }));
            setSaveStatus("Article sections saved.");
            router.refresh();
        } catch (error) {
            setDraft((current) => ({
                ...current,
                sectionTags: previousSections,
            }));
            setSaveStatus(
                error instanceof Error
                    ? error.message
                    : "Article sections could not be saved."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function importWordDocument(file: File) {
        if (!file.name.toLowerCase().endsWith(".docx")) {
            setImportStatus("Select a .docx Word document.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setImportStatus("The Word document must be 10 MB or smaller.");
            return;
        }

        setImportStatus("Reading document...");
        try {
            const mammoth = (await import("mammoth")).default;
            const result = await mammoth.extractRawText({
                arrayBuffer: await file.arrayBuffer(),
            });
            const imported = result.value
                .split(/\n\s*\n/)
                .map((text) => text.trim())
                .filter(Boolean);

            if (!imported.length) {
                setImportStatus("No readable story text was found.");
                return;
            }

            const probableHeadline = imported[0].replace(/\s+/g, " ");
            const bodySections = probableHeadline.length <= 180
                ? imported.slice(1)
                : imported;
            const nextBodyParagraphs = bodySections.length ? bodySections : imported;
            const nextBody = nextBodyParagraphs
                .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
                .join("");

            replaceBodyHtml(nextBody);
            setDraft((current) => {
                const headline = current.title || (probableHeadline.length <= 180 ? probableHeadline : "");
                const firstBody = nextBodyParagraphs[0] ?? "";
                return {
                    ...current,
                    title: headline,
                    slug: current.slug || slugify(headline),
                    publicSummary: current.publicSummary || firstBody.slice(0, 240),
                    bodyExcerpt: current.bodyExcerpt || firstBody.slice(0, 300),
                };
            });

            if (fileInputRef.current) {
                const transfer = new DataTransfer();
                transfer.items.add(file);
                fileInputRef.current.files = transfer.files;
            }
            const warningCount = result.messages.length;
            setImportStatus(
                warningCount
                    ? `${file.name} imported with ${warningCount} formatting note${warningCount === 1 ? "" : "s"}.`
                    : `${file.name} imported.`
            );
        } catch {
            setImportStatus("The Word document could not be read.");
        }
    }

    function draftTeaser() {
        const source = draft.publicSummary || editorPlainText(bodyHtmlRef.current);
        const normalized = source.replace(/\s+/g, " ").trim();
        updateDraft("publicTeaser", normalized.length > 320 ? `${normalized.slice(0, 317).trimEnd()}...` : normalized);
    }

    function runEditorCommand(command: string, value?: string) {
        bodyRef.current?.focus();
        const selection = window.getSelection();
        const range = savedSelectionRef.current;
        if (selection && range && bodyRef.current?.contains(range.commonAncestorContainer)) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
        document.execCommand(command, false, value);
        syncBodyFromEditor();
        rememberEditorSelection();
    }

    function addLink() {
        const href = window.prompt("Link URL", "https://");
        if (href) runEditorCommand("createLink", href);
    }

    return (
        <div className="min-h-screen bg-[#080a0c] text-potomac-cream">
            <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080a0c]/95 backdrop-blur">
                <div className="flex min-h-16 w-full flex-wrap items-center justify-between gap-3 px-3 md:px-6">
                    <div className="flex items-center gap-3">
                        <a href="/studio/dashboard" aria-label="Back to article dashboard" title="Article dashboard" className="grid h-10 w-10 place-items-center text-xl text-potomac-regolith hover:text-white">←</a>
                        <span className="h-5 w-px bg-white/15" />
                        <p role="status" className="font-mono text-[0.62rem] uppercase text-potomac-regolith">
                            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${isSaving ? "bg-potomac-gold" : "bg-emerald-400"}`} />
                            {saveStatus || (draft.id === "new" ? "Unsaved draft" : "Saved")}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/studio?new=1" className="border border-white/15 px-4 py-2.5 font-mono text-[0.64rem] font-bold uppercase text-white hover:border-potomac-gold">New story</a>
                        {draft.id !== "new" ? (
                            <a href={`/studio/preview/${draft.id}`} className="border border-white/15 px-4 py-2.5 font-mono text-[0.64rem] font-bold uppercase text-white hover:border-potomac-gold">Preview</a>
                        ) : null}
                        <button disabled={isSaving} type="submit" form={formId} className="bg-potomac-gold px-4 py-2.5 font-mono text-[0.64rem] font-bold uppercase text-potomac-primary disabled:cursor-wait disabled:opacity-55">{draft.id === "new" ? "Save draft" : "Continue"}</button>
                    </div>
                </div>
                <div className="overflow-x-auto border-t border-white/10">
                    <div className="mx-auto flex min-w-max items-center justify-center gap-1 px-4 py-2">
                        <select
                            aria-label="Text style"
                            defaultValue=""
                            onChange={(event) => {
                                if (event.target.value) {
                                    runEditorCommand("formatBlock", event.target.value);
                                }
                                event.target.value = "";
                            }}
                            className="h-9 border-0 bg-transparent px-2 text-sm text-potomac-cream outline-none"
                        >
                            <option value="" className="bg-potomac-primary">Style</option>
                            <option value="p" className="bg-potomac-primary">Body</option>
                            <option value="h2" className="bg-potomac-primary">Heading 2</option>
                            <option value="h3" className="bg-potomac-primary">Heading 3</option>
                            <option value="blockquote" className="bg-potomac-primary">Quote</option>
                        </select>
                        <select
                            aria-label="Font family"
                            defaultValue=""
                            onChange={(event) => {
                                if (event.target.value) runEditorCommand("fontName", event.target.value);
                                event.target.value = "";
                            }}
                            className="h-9 border-0 bg-transparent px-2 text-sm text-potomac-cream outline-none"
                        >
                            <option value="" className="bg-potomac-primary">Font</option>
                            <option value="Arial" className="bg-potomac-primary">Sans</option>
                            <option value="Georgia" className="bg-potomac-primary">Serif</option>
                            <option value="Courier New" className="bg-potomac-primary">Mono</option>
                        </select>
                        <select
                            aria-label="Font size"
                            defaultValue=""
                            onChange={(event) => {
                                if (event.target.value) runEditorCommand("fontSize", event.target.value);
                                event.target.value = "";
                            }}
                            className="h-9 border-0 bg-transparent px-2 text-sm text-potomac-cream outline-none"
                        >
                            <option value="" className="bg-potomac-primary">Size</option>
                            <option value="2" className="bg-potomac-primary">Small</option>
                            <option value="3" className="bg-potomac-primary">Body</option>
                            <option value="4" className="bg-potomac-primary">Large</option>
                            <option value="5" className="bg-potomac-primary">Display</option>
                        </select>
                        <button
                            type="button"
                            title="Clear formatting"
                            aria-label="Clear formatting"
                            onClick={() => runEditorCommand("removeFormat")}
                            className="h-9 px-2 font-mono text-xs font-bold hover:bg-white/5"
                        >
                            Tx
                        </button>
                        <button
                            type="button"
                            title="Upload media into story"
                            aria-label="Upload media into story"
                            onClick={() => {
                                rememberEditorSelection();
                                insertUploadedMediaRef.current = true;
                                mediaInputRef.current?.click();
                            }}
                            className="h-9 px-2 font-mono text-xs font-bold hover:bg-white/5"
                        >
                            Media
                        </button>
                        <span className="mx-2 h-5 w-px bg-white/15" />
                        <button type="button" title="Bold" aria-label="Bold" onClick={() => runEditorCommand("bold")} className="h-9 w-9 text-lg font-bold hover:bg-white/5">B</button>
                        <button type="button" title="Italic" aria-label="Italic" onClick={() => runEditorCommand("italic")} className="h-9 w-9 font-serif text-lg italic hover:bg-white/5">I</button>
                        <button type="button" title="Underline" aria-label="Underline" onClick={() => runEditorCommand("underline")} className="h-9 w-9 text-lg underline hover:bg-white/5">U</button>
                        <button type="button" title="Heading" aria-label="Heading" onClick={() => runEditorCommand("formatBlock", "h2")} className="h-9 w-9 text-lg font-bold hover:bg-white/5">T</button>
                        <button type="button" title="Insert link" aria-label="Insert link" onClick={addLink} className="h-9 w-9 text-lg hover:bg-white/5">↗</button>
                        <span className="mx-2 h-5 w-px bg-white/15" />
                        <button type="button" title="Upload image or video" aria-label="Upload image or video" onClick={() => mediaInputRef.current?.click()} className="h-9 w-9 text-lg hover:bg-white/5">▧</button>
                        <button type="button" title="Import Word document" aria-label="Import Word document" onClick={() => fileInputRef.current?.click()} className="h-9 px-3 font-mono text-xs font-bold hover:bg-white/5">DOC</button>
                        <span className="mx-2 h-5 w-px bg-white/15" />
                        <button type="button" title="Bulleted list" aria-label="Bulleted list" onClick={() => runEditorCommand("insertUnorderedList")} className="h-9 w-9 text-lg hover:bg-white/5">•</button>
                        <button type="button" title="Quote" aria-label="Quote" onClick={() => runEditorCommand("formatBlock", "blockquote")} className="h-9 w-9 text-lg hover:bg-white/5">”</button>
                    </div>
                </div>
            </header>

            <div className="mx-auto w-full">
                <aside className="hidden">
                    <button onClick={startNewStory} className="w-full bg-potomac-gold px-4 py-3 font-mono text-[0.68rem] font-bold uppercase text-potomac-primary">New story</button>
                    <label className={`${labelClass} mt-5`}>
                        Find a story
                        <input value={query} onChange={(event) => setQuery(event.target.value)} className={inputClass} type="search" placeholder="Headline or status" />
                    </label>
                    <div className="mt-5 max-h-[34rem] space-y-px overflow-y-auto border-y border-potomac-regolith/20">
                        {filteredArticles.map((article) => (
                            <button
                                key={article.id}
                                onClick={() => chooseArticle(article)}
                                className={`w-full border-b border-potomac-regolith/15 px-3 py-4 text-left transition ${selectedId === article.id ? "bg-potomac-gold/12" : "hover:bg-white/5"}`}
                            >
                                <span className="block font-mono text-[0.58rem] font-bold uppercase text-potomac-gold">{article.status} · {article.accessTier}</span>
                                <span className="mt-2 block font-serif text-base leading-5 text-white">{article.title}</span>
                                <span className="mt-2 block text-xs text-potomac-cream/65">{article.authorName ? `By ${article.authorName}` : "Byline not set"}</span>
                                <span className="mt-2 block font-mono text-[0.56rem] uppercase text-potomac-regolith">{formatUpdatedDate(article.updatedAt)}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="mx-auto min-w-0 max-w-[52rem] px-5 pb-24 pt-14 md:px-10">
                    <form id={formId} action={saveStory}>
                        <input type="hidden" name="studio_context" value="studio" />
                        {draft.id !== "new" ? <input type="hidden" name="article_id" value={draft.id} /> : null}
                        <input
                            ref={bodyInputRef}
                            type="hidden"
                            name="body_markdown"
                            defaultValue={bodyHtml.trim()}
                        />
                        <input type="hidden" name="body_excerpt" value={draft.bodyExcerpt || draft.publicTeaser} />

                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-potomac-regolith/25 pb-4">
                            <div>
                                <p className="font-mono text-[0.6rem] font-bold uppercase text-potomac-gold">{draft.id === "new" ? "New assignment" : draft.status}</p>
                                <p className="mt-1 text-sm text-potomac-regolith">{draft.id === "new" ? "Unsaved story" : `/news/${draft.slug}`}</p>
                            </div>
                            <label className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">
                                Reader access
                                <select name="access_tier_required" value={draft.accessTier} onChange={(event) => updateDraft("accessTier", event.target.value)} className="ml-3 border border-potomac-regolith/30 bg-potomac-primary px-3 py-2 text-potomac-cream">
                                    <option value="explorer">Explorer</option>
                                    <option value="scout">Scout</option>
                                    <option value="meridian">Meridian</option>
                                </select>
                            </label>
                        </div>

                        <fieldset className="mt-5 border-b border-potomac-regolith/25 pb-5">
                            <legend className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">
                                Article sections
                            </legend>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                                {editorialSections.map((section) => (
                                    <label
                                        key={section.slug}
                                        className="flex items-center gap-2 text-sm text-white"
                                    >
                                        <input
                                            type="checkbox"
                                            name="section_tags"
                                            value={section.slug}
                                            checked={draft.sectionTags.includes(section.slug)}
                                            onChange={() => toggleSectionTag(section.slug)}
                                            disabled={isSaving}
                                            className="h-4 w-4 accent-potomac-gold"
                                        />
                                        {section.label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="mt-6 flex flex-col">
                            <label className="order-1 block">
                                <span className="sr-only">Headline</span>
                                <textarea
                                    required
                                    name="title"
                                    rows={1}
                                    value={draft.title}
                                    onChange={(event) => {
                                        const title = event.target.value;
                                        setDraft((current) => ({
                                            ...current,
                                            title,
                                            slug: current.id === "new" ? slugify(title) : current.slug,
                                        }));
                                    }}
                                    className="mt-6 w-full resize-none overflow-hidden border-0 bg-transparent font-serif text-5xl leading-[1.08] text-white outline-none [field-sizing:content] placeholder:text-white/25 md:text-6xl"
                                    placeholder="Title"
                                />
                            </label>

                            <label className="order-3 mt-7 block">
                                <span className="sr-only">Byline</span>
                                <input
                                    required
                                    name="author_name"
                                    value={draft.authorName}
                                    onChange={(event) => updateDraft("authorName", event.target.value)}
                                    className="min-w-48 border border-white/15 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-potomac-gold"
                                    placeholder="Author name"
                                    autoComplete="name"
                                />
                            </label>

                            <label className="order-2 block">
                                <span className="sr-only">Standfirst</span>
                                <textarea required name="public_summary" rows={1} value={draft.publicSummary} onChange={(event) => updateDraft("publicSummary", event.target.value)} className="mt-4 w-full resize-none overflow-hidden border-0 bg-transparent text-xl leading-8 text-potomac-cream/75 outline-none [field-sizing:content] placeholder:text-potomac-regolith/50" placeholder="Add a subtitle..." />
                            </label>

                            <section className="order-6 mt-10 border-y border-white/10 py-6">
                                <div
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        const file = event.dataTransfer.files[0];
                                        if (file) void importWordDocument(file);
                                    }}
                                    className="border border-dashed border-potomac-gold/55 bg-potomac-primary/45 p-6 text-center transition hover:border-potomac-gold"
                                >
                                    <input
                                        ref={fileInputRef}
                                        name="source_document"
                                        type="file"
                                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        className="sr-only"
                                        id="studio-word-document"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            if (file) void importWordDocument(file);
                                        }}
                                    />
                                    <label htmlFor="studio-word-document" className="cursor-pointer">
                                        <span className="block font-serif text-xl uppercase text-white">Drop Word story here</span>
                                        <span className="mt-2 block text-sm text-potomac-regolith">or select a .docx file · 10 MB maximum</span>
                                    </label>
                                    {importStatus ? <p role="status" className="mt-3 text-sm text-potomac-gold">{importStatus}</p> : null}
                                </div>
                                {draft.sourceDocuments.length ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {draft.sourceDocuments.map((document) => (
                                            <span key={document.id} className="border border-potomac-regolith/25 px-3 py-2 text-xs text-potomac-cream/70">{document.fileName} · {formatFileSize(document.sizeBytes)}</span>
                                        ))}
                                    </div>
                                ) : null}
                            </section>

                            <section className="order-7 border-b border-white/10 py-6">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <label className={`${labelClass} md:col-span-2`}>
                                        Story images and video
                                        <input
                                            ref={mediaInputRef}
                                            name="story_media"
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v,.mov,.m4v"
                                            className={inputClass}
                                            onChange={(event) => void uploadMediaImmediately(event.target.files)}
                                        />
                                        <span className="mt-2 block text-[0.58rem] text-potomac-regolith">JPG, PNG, WebP, GIF, MP4, WebM, MOV, or M4V. 50 MB maximum per file.</span>
                                        <span className="mt-1 block text-[0.58rem] text-potomac-regolith">After upload, drag media into the story, use Insert at cursor, and choose one image as the main-page thumbnail.</span>
                                        {selectedMediaNames.length ? (
                                            <span className="mt-2 block normal-case text-white">
                                                Ready to upload: {selectedMediaNames.join(", ")}
                                            </span>
                                        ) : null}
                                    </label>
                                    <div className="border border-potomac-regolith/25 p-4 md:col-span-2">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className={labelClass}>YouTube Unlisted video</p>
                                                <p className="mt-2 max-w-2xl text-xs leading-5 text-potomac-regolith">
                                                    Upload the video to the Cabeus channel with visibility set to Unlisted, then paste its YouTube watch or share URL. Anyone with access to the published article can play the video.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <a
                                                    href={CABEUS_YOUTUBE_CHANNEL_URL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border border-potomac-regolith/40 px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-white"
                                                >
                                                    Cabeus channel
                                                </a>
                                                <a
                                                    href={YOUTUBE_UPLOAD_URL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border border-potomac-gold/55 px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-potomac-gold"
                                                >
                                                    Upload on YouTube
                                                </a>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                            <input
                                                type="url"
                                                value={youtubeUrl}
                                                onChange={(event) => setYoutubeUrl(event.target.value)}
                                                className={`${inputClass} mt-0 flex-1`}
                                                placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                                                aria-label="YouTube Unlisted video URL"
                                            />
                                            <button
                                                type="button"
                                                disabled={isSaving || !youtubeUrl.trim()}
                                                onClick={() => void attachYouTubeVideo()}
                                                className="bg-potomac-gold px-5 py-3 font-mono text-[0.62rem] font-bold uppercase text-potomac-primary disabled:opacity-40"
                                            >
                                                Attach video
                                            </button>
                                        </div>
                                    </div>
                                    <label className={labelClass}>
                                        Media description
                                        <input
                                            name="media_alt_text"
                                            value={mediaAltText}
                                            onChange={(event) => setMediaAltText(event.target.value)}
                                            className={inputClass}
                                            placeholder="Describe the image for readers using assistive technology"
                                        />
                                    </label>
                                    <label className={labelClass}>
                                        Media caption
                                        <input
                                            name="media_caption"
                                            value={mediaCaption}
                                            onChange={(event) => setMediaCaption(event.target.value)}
                                            className={inputClass}
                                            placeholder="Optional caption or credit"
                                        />
                                    </label>
                                </div>
                                {draft.mediaAssets.length ? (
                                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {draft.mediaAssets.map((asset) => (
                                            <MediaAssetEditor
                                                key={asset.id}
                                                asset={asset}
                                                disabled={isSaving}
                                                onSave={saveMediaDetails}
                                                onRemove={removeMedia}
                                                onInsert={insertMediaAtCursor}
                                                onUseAsThumbnail={useAsThumbnail}
                                                isThumbnail={asset.publicUrl === draft.heroImageUrl}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </section>

                            <label className={`${labelClass} order-8 mt-6`}>
                                Intended publishing date and time
                                <input
                                    name="scheduled_for"
                                    type="datetime-local"
                                    value={draft.publishAt}
                                    onChange={(event) => updateDraft("publishAt", event.target.value)}
                                    className={inputClass}
                                />
                                <span className="mt-2 block text-[0.58rem] text-potomac-regolith">Scheduling is confirmed from the device preview after this draft is saved.</span>
                            </label>

                            <section className="order-4 mt-8">
                                <h2 className="sr-only">Story body</h2>
                                <div
                                    ref={bodyRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    aria-label="Story body"
                                    role="textbox"
                                    aria-multiline="true"
                                    data-placeholder="Start writing..."
                                    onInput={(event) => {
                                        const nextBody = event.currentTarget.innerHTML;
                                        bodyHtmlRef.current = nextBody;
                                        if (bodyInputRef.current) {
                                            bodyInputRef.current.value = nextBody;
                                        }
                                    }}
                                    onMouseUp={rememberEditorSelection}
                                    onKeyUp={rememberEditorSelection}
                                    onFocus={rememberEditorSelection}
                                    onDrop={handleEditorDrop}
                                    onDragOver={(event) => {
                                        if (event.dataTransfer.types.includes("application/x-cabeus-media")) {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect = "copy";
                                        }
                                    }}
                                    onPaste={handlePlainTextPaste}
                                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                                    className="studio-rich-editor min-h-[32rem] w-full border-0 bg-transparent py-3 text-lg leading-8 text-white outline-none"
                                />
                            </section>

                            <section className="order-5 mt-12 border-y border-white/10 py-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="font-serif text-2xl uppercase text-white">Public teaser</h2>
                                    <button type="button" onClick={draftTeaser} className="border border-potomac-gold/55 px-4 py-2 font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">Draft from opening</button>
                                </div>
                                <textarea required name="public_teaser_markdown" rows={5} value={draft.publicTeaser} onChange={(event) => updateDraft("publicTeaser", event.target.value)} className={inputClass} placeholder="Give non-members enough context to understand the news and why it matters" />
                                <p className="mt-2 text-right font-mono text-[0.58rem] uppercase text-potomac-regolith">{draft.publicTeaser.length} characters</p>
                            </section>

                            <details className="order-9 mt-6 border-b border-white/10 pb-6">
                                <summary className="cursor-pointer font-mono text-[0.66rem] font-bold uppercase text-potomac-gold">Search, answer engines, and URL</summary>
                                <div className="mt-5 grid gap-5 md:grid-cols-2">
                                    <label className={labelClass}>Story URL<input required name="slug" value={draft.slug} onChange={(event) => updateDraft("slug", slugify(event.target.value))} className={inputClass} /></label>
                                    <label className={labelClass}>Search headline<input name="seo_title" value={draft.seoTitle} onChange={(event) => updateDraft("seoTitle", event.target.value)} className={inputClass} /></label>
                                    <label className={`${labelClass} md:col-span-2`}>Search description<textarea name="seo_description" rows={3} value={draft.seoDescription} onChange={(event) => updateDraft("seoDescription", event.target.value)} className={inputClass} /></label>
                                    <label className={`${labelClass} md:col-span-2`}>Direct answer summary<textarea name="aeo_summary" rows={3} value={draft.aeoSummary} onChange={(event) => updateDraft("aeoSummary", event.target.value)} className={inputClass} /></label>
                                    <label className={`${labelClass} md:col-span-2`}>Opening context<textarea name="intro_markdown" rows={3} value={draft.intro} onChange={(event) => updateDraft("intro", event.target.value)} className={inputClass} /></label>
                                </div>
                            </details>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
