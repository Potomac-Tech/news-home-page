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
    "mt-2 w-full border border-cabeus-line bg-white px-4 py-3 text-base text-cabeus-ink outline-none transition placeholder:text-cabeus-muted/55 focus:border-cabeus-gold";
const labelClass =
    "block font-mono text-[0.64rem] font-bold uppercase text-cabeus-bronze";

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
    onPlace,
    onUseAsThumbnail,
    isThumbnail,
}: {
    asset: StudioArticle["mediaAssets"][number];
    disabled: boolean;
    onSave: (assetId: string, altText: string, caption: string) => Promise<void>;
    onRemove: (assetId: string) => Promise<void>;
    onPlace: (
        asset: StudioArticle["mediaAssets"][number],
        placement: "start" | "cursor" | "end"
    ) => void;
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
            className="border border-cabeus-line bg-white/35 p-2"
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
                    className="mt-2 inline-block font-mono text-[0.58rem] font-bold uppercase text-cabeus-bronze underline"
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
            <fieldset className="mt-3 border border-cabeus-line p-2">
                <legend className="px-1 font-mono text-[0.56rem] font-bold uppercase text-cabeus-bronze">
                    Place in story
                </legend>
                <div className="grid grid-cols-3 gap-1">
                    {([
                        ["start", "Beginning"],
                        ["cursor", "Cursor"],
                        ["end", "End"],
                    ] as const).map(([placement, label]) => (
                        <button
                            key={placement}
                            type="button"
                            disabled={disabled}
                            onClick={() => onPlace({
                                ...asset,
                                altText,
                                caption,
                            }, placement)}
                            className={`px-2 py-2 font-mono text-[0.52rem] font-bold uppercase disabled:opacity-40 ${
                                placement === "cursor"
                                    ? "bg-cabeus-ink text-cabeus-paper"
                                    : "border border-cabeus-line text-cabeus-ink hover:border-cabeus-gold"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <p className="mt-2 text-[0.62rem] leading-4 text-cabeus-muted">
                    Repositioning moves the existing media. You can also drag it to an exact paragraph.
                </p>
            </fieldset>
            {asset.mediaType === "image" ? (
                <button
                    type="button"
                    disabled={disabled || isThumbnail}
                    onClick={() => void onUseAsThumbnail(asset.id)}
                    className="mt-2 w-full border border-cabeus-gold px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-cabeus-bronze disabled:opacity-55"
                >
                    {isThumbnail ? "Main-page thumbnail" : "Use as thumbnail"}
                </button>
            ) : null}
            <button
                type="button"
                disabled={disabled}
                onClick={() => void onSave(asset.id, altText, caption)}
                className="mt-3 w-full border border-cabeus-ink px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-cabeus-ink hover:bg-cabeus-ink hover:text-cabeus-paper disabled:opacity-40"
            >
                Save media details
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => void onRemove(asset.id)}
                className="mt-2 w-full border border-red-800/35 px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-red-800 hover:border-red-800 disabled:opacity-40"
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
    const formRef = useRef<HTMLFormElement>(null);
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

    function commitBodyFromEditor() {
        syncBodyFromEditor();
        setBodyHtml(bodyHtmlRef.current);
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

    function removeExistingMediaEmbed(assetId: string) {
        const editor = bodyRef.current;
        if (!editor) return;
        const existing = Array.from(
            editor.querySelectorAll<HTMLElement>("[data-media-id]")
        ).find((element) => element.dataset.mediaId === assetId);
        if (!existing) return;

        const spacer = existing.nextElementSibling;
        existing.remove();
        if (
            spacer?.tagName === "P"
            && !(spacer.textContent ?? "").trim()
            && !spacer.querySelector("img,video,iframe")
        ) {
            spacer.remove();
        }
    }

    function placeMediaAssets(
        assets: StudioArticle["mediaAssets"],
        placement: "start" | "cursor" | "end"
    ) {
        const editor = bodyRef.current;
        if (!editor || !assets.length) return;

        const range = savedSelectionRef.current?.cloneRange() ?? null;
        assets.forEach((asset) => removeExistingMediaEmbed(asset.id));
        const markup = assets.map(mediaMarkup).join("");
        editor.focus();

        if (placement === "start") {
            editor.insertAdjacentHTML("afterbegin", markup);
        } else if (placement === "end") {
            editor.insertAdjacentHTML("beforeend", markup);
        } else {
            const selection = window.getSelection();
            if (selection && range && editor.contains(range.commonAncestorContainer)) {
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand("insertHTML", false, markup);
            } else {
                editor.insertAdjacentHTML("beforeend", markup);
            }
        }

        commitBodyFromEditor();
        rememberEditorSelection();
        const placementLabel = placement === "start"
            ? "at the beginning"
            : placement === "end"
              ? "at the end"
              : "at the selected paragraph";
        setSaveStatus(`Media placed ${placementLabel}. Save the draft to keep its position.`);
    }

    function placeMedia(
        asset: StudioArticle["mediaAssets"][number],
        placement: "start" | "cursor" | "end"
    ) {
        placeMediaAssets([asset], placement);
    }

    function insertMediaAtCursor(asset: StudioArticle["mediaAssets"][number]) {
        placeMedia(asset, "cursor");
    }

    async function handleEditorDrop(event: DragEvent<HTMLDivElement>) {
        const assetId = event.dataTransfer.getData("application/x-cabeus-media");
        const droppedFiles = Array.from(event.dataTransfer.files).filter(
            (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
        );
        if (!assetId && !droppedFiles.length) return;
        event.preventDefault();
        const caretRange = document.caretRangeFromPoint?.(
            event.clientX,
            event.clientY
        );
        if (caretRange && bodyRef.current?.contains(caretRange.commonAncestorContainer)) {
            savedSelectionRef.current = caretRange.cloneRange();
        }

        if (droppedFiles.length) {
            await uploadMediaImmediately(droppedFiles, true);
            return;
        }

        const asset = draft.mediaAssets.find((item) => item.id === assetId);
        if (asset) insertMediaAtCursor(asset);
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

    async function saveStory(formData: FormData, previewAfterSave = false) {
        setIsSaving(true);
        setSaveStatus("Saving...");
        try {
            syncBodyFromEditor();
            formData.set("body_markdown", bodyHtmlRef.current);
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
            if (previewAfterSave) {
                router.push(`/studio/preview/${result.articleId}`);
            } else {
                router.refresh();
            }
        } catch (error) {
            setSaveStatus(error instanceof Error ? error.message : "Draft could not be saved.");
        } finally {
            setIsSaving(false);
        }
    }

    async function saveAndPreview() {
        const form = formRef.current;
        if (!form || !form.reportValidity()) return;
        await saveStory(new FormData(form), true);
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

    async function uploadMediaImmediately(
        files: FileList | File[] | null,
        insertAtSelection = insertUploadedMediaRef.current
    ) {
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
            if (insertAtSelection && result.uploadedMedia.length) {
                placeMediaAssets(result.uploadedMedia, "cursor");
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
        <div className="min-h-screen bg-cabeus-paper text-cabeus-ink">
            <header className="sticky top-0 z-40 border-b border-cabeus-line bg-cabeus-paper/95 backdrop-blur">
                <div className="flex min-h-16 w-full flex-wrap items-center justify-between gap-3 px-3 md:px-6">
                    <div className="flex items-center gap-3">
                        <a href="/studio/dashboard" aria-label="Back to article dashboard" title="Article dashboard" className="grid h-10 w-10 place-items-center border border-cabeus-line text-xl text-cabeus-ink hover:border-cabeus-gold">←</a>
                        <span className="h-5 w-px bg-cabeus-line" />
                        <p role="status" className="font-mono text-[0.62rem] uppercase text-cabeus-muted">
                            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${isSaving ? "bg-cabeus-gold" : "bg-cabeus-bronze"}`} />
                            {saveStatus || (draft.id === "new" ? "Unsaved draft" : "Saved")}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/studio?new=1" className="border border-cabeus-line px-4 py-2.5 font-mono text-[0.64rem] font-bold uppercase text-cabeus-ink hover:border-cabeus-gold">New story</a>
                        {draft.id !== "new" ? (
                            <button disabled={isSaving} type="button" onClick={() => void saveAndPreview()} className="border border-cabeus-line px-4 py-2.5 font-mono text-[0.64rem] font-bold uppercase text-cabeus-ink hover:border-cabeus-gold disabled:cursor-wait disabled:opacity-55">Preview</button>
                        ) : null}
                        <button disabled={isSaving} type="submit" form={formId} className="bg-cabeus-ink px-4 py-2.5 font-mono text-[0.64rem] font-bold uppercase text-cabeus-paper disabled:cursor-wait disabled:opacity-55">{draft.id === "new" ? "Save draft" : "Continue"}</button>
                    </div>
                </div>
                <div className="overflow-x-auto border-t border-cabeus-line bg-cabeus-smoke/70">
                    <div className="mx-auto flex min-w-max items-center justify-center gap-1 px-4 py-2 text-cabeus-ink">
                        <select
                            aria-label="Text style"
                            defaultValue=""
                            onChange={(event) => {
                                if (event.target.value) {
                                    runEditorCommand("formatBlock", event.target.value);
                                }
                                event.target.value = "";
                            }}
                            className="h-9 border-0 bg-transparent px-2 text-sm text-cabeus-ink outline-none"
                        >
                            <option value="" className="bg-cabeus-paper">Style</option>
                            <option value="p" className="bg-cabeus-paper">Body</option>
                            <option value="h2" className="bg-cabeus-paper">Heading 2</option>
                            <option value="h3" className="bg-cabeus-paper">Heading 3</option>
                            <option value="blockquote" className="bg-cabeus-paper">Quote</option>
                        </select>
                        <select
                            aria-label="Font family"
                            defaultValue=""
                            onChange={(event) => {
                                if (event.target.value) runEditorCommand("fontName", event.target.value);
                                event.target.value = "";
                            }}
                            className="h-9 border-0 bg-transparent px-2 text-sm text-cabeus-ink outline-none"
                        >
                            <option value="" className="bg-cabeus-paper">Font</option>
                            <option value="Arial" className="bg-cabeus-paper">Sans</option>
                            <option value="Georgia" className="bg-cabeus-paper">Serif</option>
                            <option value="Courier New" className="bg-cabeus-paper">Mono</option>
                        </select>
                        <select
                            aria-label="Font size"
                            defaultValue=""
                            onChange={(event) => {
                                if (event.target.value) runEditorCommand("fontSize", event.target.value);
                                event.target.value = "";
                            }}
                            className="h-9 border-0 bg-transparent px-2 text-sm text-cabeus-ink outline-none"
                        >
                            <option value="" className="bg-cabeus-paper">Size</option>
                            <option value="2" className="bg-cabeus-paper">Small</option>
                            <option value="3" className="bg-cabeus-paper">Body</option>
                            <option value="4" className="bg-cabeus-paper">Large</option>
                            <option value="5" className="bg-cabeus-paper">Display</option>
                        </select>
                        <button
                            type="button"
                            title="Clear formatting"
                            aria-label="Clear formatting"
                            onClick={() => runEditorCommand("removeFormat")}
                            className="h-9 px-2 font-mono text-xs font-bold text-cabeus-ink hover:bg-cabeus-line/60"
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
                            className="h-9 px-2 font-mono text-xs font-bold text-cabeus-ink hover:bg-cabeus-line/60"
                        >
                            Media
                        </button>
                        <span className="mx-2 h-5 w-px bg-cabeus-line" />
                        <button type="button" title="Bold" aria-label="Bold" onClick={() => runEditorCommand("bold")} className="h-9 w-9 text-lg font-bold text-cabeus-ink hover:bg-cabeus-line/60">B</button>
                        <button type="button" title="Italic" aria-label="Italic" onClick={() => runEditorCommand("italic")} className="h-9 w-9 font-serif text-lg italic text-cabeus-ink hover:bg-cabeus-line/60">I</button>
                        <button type="button" title="Underline" aria-label="Underline" onClick={() => runEditorCommand("underline")} className="h-9 w-9 text-lg text-cabeus-ink underline hover:bg-cabeus-line/60">U</button>
                        <button type="button" title="Heading" aria-label="Heading" onClick={() => runEditorCommand("formatBlock", "h2")} className="h-9 w-9 text-lg font-bold text-cabeus-ink hover:bg-cabeus-line/60">T</button>
                        <button type="button" title="Insert link" aria-label="Insert link" onClick={addLink} className="h-9 w-9 text-lg text-cabeus-ink hover:bg-cabeus-line/60">↗</button>
                        <span className="mx-2 h-5 w-px bg-cabeus-line" />
                        <button type="button" title="Upload image or video" aria-label="Upload image or video" onClick={() => mediaInputRef.current?.click()} className="h-9 w-9 text-lg text-cabeus-ink hover:bg-cabeus-line/60">▧</button>
                        <button type="button" title="Import Word document" aria-label="Import Word document" onClick={() => fileInputRef.current?.click()} className="h-9 px-3 font-mono text-xs font-bold text-cabeus-ink hover:bg-cabeus-line/60">DOC</button>
                        <span className="mx-2 h-5 w-px bg-cabeus-line" />
                        <button type="button" title="Bulleted list" aria-label="Bulleted list" onClick={() => runEditorCommand("insertUnorderedList")} className="h-9 w-9 text-lg text-cabeus-ink hover:bg-cabeus-line/60">•</button>
                        <button type="button" title="Quote" aria-label="Quote" onClick={() => runEditorCommand("formatBlock", "blockquote")} className="h-9 w-9 text-lg text-cabeus-ink hover:bg-cabeus-line/60">”</button>
                    </div>
                </div>
            </header>

            <div className="mx-auto w-full">
                <aside className="hidden">
                    <button onClick={startNewStory} className="w-full bg-cabeus-ink px-4 py-3 font-mono text-[0.68rem] font-bold uppercase text-cabeus-paper">New story</button>
                    <label className={`${labelClass} mt-5`}>
                        Find a story
                        <input value={query} onChange={(event) => setQuery(event.target.value)} className={inputClass} type="search" placeholder="Headline or status" />
                    </label>
                    <div className="mt-5 max-h-[34rem] space-y-px overflow-y-auto border-y border-cabeus-line">
                        {filteredArticles.map((article) => (
                            <button
                                key={article.id}
                                onClick={() => chooseArticle(article)}
                                className={`w-full border-b border-cabeus-line px-3 py-4 text-left transition ${selectedId === article.id ? "bg-cabeus-smoke" : "hover:bg-white/50"}`}
                            >
                                <span className="block font-mono text-[0.58rem] font-bold uppercase text-cabeus-bronze">{article.status} · {article.accessTier}</span>
                                <span className="mt-2 block font-serif text-base leading-5 text-cabeus-ink">{article.title}</span>
                                <span className="mt-2 block text-xs text-cabeus-muted">{article.authorName ? `By ${article.authorName}` : "Byline not set"}</span>
                                <span className="mt-2 block font-mono text-[0.56rem] uppercase text-cabeus-muted">{formatUpdatedDate(article.updatedAt)}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="mx-auto min-w-0 max-w-[52rem] px-5 pb-24 pt-14 md:px-10">
                    <form ref={formRef} id={formId} action={saveStory}>
                        <input type="hidden" name="studio_context" value="studio" />
                        {draft.id !== "new" ? <input type="hidden" name="article_id" value={draft.id} /> : null}
                        <input
                            ref={bodyInputRef}
                            type="hidden"
                            name="body_markdown"
                            defaultValue={bodyHtml.trim()}
                        />
                        <input type="hidden" name="body_excerpt" value={draft.bodyExcerpt || draft.publicTeaser} />

                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cabeus-line pb-4">
                            <div>
                                <p className="font-mono text-[0.6rem] font-bold uppercase text-cabeus-bronze">{draft.id === "new" ? "New assignment" : draft.status}</p>
                                <p className="mt-1 text-sm text-cabeus-muted">{draft.id === "new" ? "Unsaved story" : `/news/${draft.slug}`}</p>
                            </div>
                            <label className="font-mono text-[0.62rem] font-bold uppercase text-cabeus-bronze">
                                Reader access
                                <select name="access_tier_required" value={draft.accessTier} onChange={(event) => updateDraft("accessTier", event.target.value)} className="ml-3 border border-cabeus-line bg-white px-3 py-2 text-cabeus-ink">
                                    <option value="explorer">Explorer</option>
                                    <option value="scout">Scout</option>
                                    <option value="meridian">Cabeus Council</option>
                                </select>
                            </label>
                        </div>

                        <fieldset className="mt-5 border-b border-cabeus-line pb-5">
                            <legend className="font-mono text-[0.62rem] font-bold uppercase text-cabeus-bronze">
                                Article sections
                            </legend>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                                {editorialSections.map((section) => (
                                    <label
                                        key={section.slug}
                                        className="flex items-center gap-2 text-sm text-cabeus-ink"
                                    >
                                        <input
                                            type="checkbox"
                                            name="section_tags"
                                            value={section.slug}
                                            checked={draft.sectionTags.includes(section.slug)}
                                            onChange={() => toggleSectionTag(section.slug)}
                                            disabled={isSaving}
                                            className="h-4 w-4 accent-cabeus-bronze"
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
                                    className="mt-6 w-full resize-none overflow-hidden border-0 bg-transparent font-serif text-5xl font-medium leading-[1.02] text-cabeus-ink outline-none [field-sizing:content] placeholder:text-cabeus-muted/35 md:text-6xl"
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
                                    className="min-w-48 border border-cabeus-line bg-white px-4 py-2 text-sm text-cabeus-ink outline-none focus:border-cabeus-gold"
                                    placeholder="Author name"
                                    autoComplete="name"
                                />
                            </label>

                            <label className="order-2 block">
                                <span className="sr-only">Standfirst</span>
                                <textarea required name="public_summary" rows={1} value={draft.publicSummary} onChange={(event) => updateDraft("publicSummary", event.target.value)} className="mt-4 w-full resize-none overflow-hidden border-0 bg-transparent text-xl leading-8 text-cabeus-muted outline-none [field-sizing:content] placeholder:text-cabeus-muted/50" placeholder="Add a subtitle..." />
                            </label>

                            <section className="order-6 mt-10 border-y border-cabeus-line py-6">
                                <div
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        const file = event.dataTransfer.files[0];
                                        if (file) void importWordDocument(file);
                                    }}
                                    className="border border-dashed border-cabeus-gold bg-white/40 p-6 text-center transition hover:bg-cabeus-smoke/70"
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
                                        <span className="block font-serif text-xl text-cabeus-ink">Drop Word story here</span>
                                        <span className="mt-2 block text-sm text-cabeus-muted">or select a .docx file · 10 MB maximum</span>
                                    </label>
                                    {importStatus ? <p role="status" className="mt-3 text-sm text-cabeus-bronze">{importStatus}</p> : null}
                                </div>
                                {draft.sourceDocuments.length ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {draft.sourceDocuments.map((document) => (
                                            <span key={document.id} className="border border-cabeus-line px-3 py-2 text-xs text-cabeus-muted">{document.fileName} · {formatFileSize(document.sizeBytes)}</span>
                                        ))}
                                    </div>
                                ) : null}
                            </section>

                            <section className="order-7 border-b border-cabeus-line py-6">
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
                                        <span className="mt-2 block text-[0.58rem] text-cabeus-muted">JPG, PNG, WebP, GIF, MP4, WebM, MOV, or M4V. 50 MB maximum per file.</span>
                                        <span className="mt-1 block text-[0.58rem] text-cabeus-muted">After upload, drag media into the story, use Insert at cursor, and choose one image as the main-page thumbnail.</span>
                                        {selectedMediaNames.length ? (
                                            <span className="mt-2 block normal-case text-cabeus-ink">
                                                Ready to upload: {selectedMediaNames.join(", ")}
                                            </span>
                                        ) : null}
                                    </label>
                                    <div className="border border-cabeus-line bg-white/35 p-4 md:col-span-2">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className={labelClass}>YouTube Unlisted video</p>
                                                <p className="mt-2 max-w-2xl text-xs leading-5 text-cabeus-muted">
                                                    Upload the video to the Cabeus channel with visibility set to Unlisted, then paste its YouTube watch or share URL. Anyone with access to the published article can play the video.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <a
                                                    href={CABEUS_YOUTUBE_CHANNEL_URL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border border-cabeus-line px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-cabeus-ink hover:bg-cabeus-smoke"
                                                >
                                                    Cabeus channel
                                                </a>
                                                <a
                                                    href={YOUTUBE_UPLOAD_URL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border border-cabeus-gold px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-cabeus-bronze hover:bg-cabeus-smoke"
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
                                                className="bg-cabeus-ink px-5 py-3 font-mono text-[0.62rem] font-bold uppercase text-cabeus-paper disabled:opacity-40"
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
                                                onPlace={placeMedia}
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
                                <span className="mt-2 block text-[0.58rem] text-cabeus-muted">Scheduling is confirmed from the device preview after this draft is saved.</span>
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
                                    onDrop={(event) => void handleEditorDrop(event)}
                                    onDragOver={(event) => {
                                        if (
                                            event.dataTransfer.types.includes("application/x-cabeus-media")
                                            || event.dataTransfer.types.includes("Files")
                                        ) {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect = "copy";
                                        }
                                    }}
                                    onPaste={handlePlainTextPaste}
                                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                                    className="studio-rich-editor min-h-[32rem] w-full border-0 bg-transparent py-3 text-lg leading-8 text-cabeus-ink outline-none"
                                />
                            </section>

                            <section className="order-5 mt-12 border-y border-cabeus-line py-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="font-serif text-2xl text-cabeus-ink">Public teaser</h2>
                                    <button type="button" onClick={draftTeaser} className="border border-cabeus-gold px-4 py-2 font-mono text-[0.62rem] font-bold uppercase text-cabeus-bronze hover:bg-cabeus-smoke">Draft from opening</button>
                                </div>
                                <textarea required name="public_teaser_markdown" rows={5} value={draft.publicTeaser} onChange={(event) => updateDraft("publicTeaser", event.target.value)} className={inputClass} placeholder="Give non-members enough context to understand the news and why it matters" />
                                <p className="mt-2 text-right font-mono text-[0.58rem] uppercase text-cabeus-muted">{draft.publicTeaser.length} characters</p>
                            </section>

                            <details className="order-9 mt-6 border-b border-cabeus-line pb-6">
                                <summary className="cursor-pointer font-mono text-[0.66rem] font-bold uppercase text-cabeus-bronze">Search, answer engines, and URL</summary>
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
