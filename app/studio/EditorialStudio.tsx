"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    createArticleDraft,
    removeArticleMedia,
    updateArticleDraft,
} from "../admin/editorial/actions";

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
    publishAt: string;
    updatedAt: string;
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
        publishAt: "",
        updatedAt: new Date().toISOString(),
        sourceDocuments: [],
        mediaAssets: [],
    };
}

function formatFileSize(bytes: number) {
    return bytes < 1_000_000
        ? `${Math.max(1, Math.round(bytes / 1_000))} KB`
        : `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function EditorialStudio({ articles }: { articles: StudioArticle[] }) {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState(articles[0]?.id ?? "new");
    const selected = useMemo(
        () => articles.find((article) => article.id === selectedId) ?? emptyArticle(),
        [articles, selectedId]
    );
    const [draft, setDraft] = useState(selected);
    const [bodyText, setBodyText] = useState(selected.body);
    const [query, setQuery] = useState("");
    const [importStatus, setImportStatus] = useState<string>("");
    const [saveStatus, setSaveStatus] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const formId = "editorial-studio-story-form";

    const filteredArticles = articles.filter((article) =>
        `${article.title} ${article.authorName} ${article.status}`.toLowerCase().includes(query.toLowerCase())
    );
    const bodyMarkdown = bodyText.trim();
    const action = draft.id === "new" ? createArticleDraft : updateArticleDraft;

    function chooseArticle(article: StudioArticle) {
        setSelectedId(article.id);
        setDraft(article);
        setBodyText(article.body);
        setImportStatus("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function startNewStory() {
        const next = emptyArticle();
        setSelectedId("new");
        setDraft(next);
        setBodyText("");
        setImportStatus("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    async function saveStory(formData: FormData) {
        setIsSaving(true);
        setSaveStatus("Saving...");
        try {
            const articleId = await action(formData);
            setSelectedId(articleId);
            setDraft((current) => ({ ...current, id: articleId }));
            if (fileInputRef.current) fileInputRef.current.value = "";
            setSaveStatus("Draft saved.");
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

    function updateDraft(field: keyof StudioArticle, value: string) {
        setDraft((current) => ({ ...current, [field]: value }));
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
            const nextBody = nextBodyParagraphs.join("\n\n");

            setBodyText(nextBody);
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
        const source = draft.publicSummary || bodyText.split(/\n\s*\n/).find((paragraph) => paragraph.trim()) || "";
        const normalized = source.replace(/\s+/g, " ").trim();
        updateDraft("publicTeaser", normalized.length > 320 ? `${normalized.slice(0, 317).trimEnd()}...` : normalized);
    }

    function formatBody(prefix: string, suffix = prefix, fallback = "text") {
        const textarea = bodyRef.current;
        const start = textarea?.selectionStart ?? bodyText.length;
        const end = textarea?.selectionEnd ?? start;
        const selectedText = bodyText.slice(start, end) || fallback;
        const nextText =
            bodyText.slice(0, start) +
            prefix +
            selectedText +
            suffix +
            bodyText.slice(end);
        setBodyText(nextText);
        window.setTimeout(() => {
            const nextTextarea = bodyRef.current;
            if (!nextTextarea) return;
            nextTextarea.focus();
            nextTextarea.setSelectionRange(
                start + prefix.length,
                start + prefix.length + selectedText.length
            );
        });
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
                                if (event.target.value === "heading") {
                                    formatBody("## ", "", "Heading");
                                }
                                event.target.value = "";
                            }}
                            className="h-9 border-0 bg-transparent px-2 text-sm text-potomac-cream outline-none"
                        >
                            <option value="" className="bg-potomac-primary">Style</option>
                            <option value="heading" className="bg-potomac-primary">Heading</option>
                        </select>
                        <span className="mx-2 h-5 w-px bg-white/15" />
                        <button type="button" title="Bold" aria-label="Bold" onClick={() => formatBody("**")} className="h-9 w-9 text-lg font-bold hover:bg-white/5">B</button>
                        <button type="button" title="Italic" aria-label="Italic" onClick={() => formatBody("_")} className="h-9 w-9 font-serif text-lg italic hover:bg-white/5">I</button>
                        <button type="button" title="Heading" aria-label="Heading" onClick={() => formatBody("## ", "", "Heading")} className="h-9 w-9 text-lg font-bold hover:bg-white/5">T</button>
                        <button type="button" title="Insert link" aria-label="Insert link" onClick={() => formatBody("[", "](https://)", "link text")} className="h-9 w-9 text-lg hover:bg-white/5">↗</button>
                        <span className="mx-2 h-5 w-px bg-white/15" />
                        <button type="button" title="Upload image or video" aria-label="Upload image or video" onClick={() => mediaInputRef.current?.click()} className="h-9 w-9 text-lg hover:bg-white/5">▧</button>
                        <button type="button" title="Import Word document" aria-label="Import Word document" onClick={() => fileInputRef.current?.click()} className="h-9 px-3 font-mono text-xs font-bold hover:bg-white/5">DOC</button>
                        <span className="mx-2 h-5 w-px bg-white/15" />
                        <button type="button" title="Bulleted list" aria-label="Bulleted list" onClick={() => formatBody("- ", "", "List item")} className="h-9 w-9 text-lg hover:bg-white/5">•</button>
                        <button type="button" title="Quote" aria-label="Quote" onClick={() => formatBody("> ", "", "Quote")} className="h-9 w-9 text-lg hover:bg-white/5">”</button>
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
                                <span className="mt-2 block font-mono text-[0.56rem] uppercase text-potomac-regolith">{new Date(article.updatedAt).toLocaleDateString()}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="mx-auto min-w-0 max-w-[52rem] px-5 pb-24 pt-14 md:px-10">
                    <form id={formId} action={saveStory}>
                        <input type="hidden" name="studio_context" value="studio" />
                        {draft.id !== "new" ? <input type="hidden" name="article_id" value={draft.id} /> : null}
                        <input type="hidden" name="body_markdown" value={bodyMarkdown} />
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
                                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                                            className={inputClass}
                                        />
                                        <span className="mt-2 block text-[0.58rem] text-potomac-regolith">JPG, PNG, WebP, GIF, MP4, or WebM. 50 MB maximum per file.</span>
                                    </label>
                                    <label className={labelClass}>
                                        Media description
                                        <input name="media_alt_text" className={inputClass} placeholder="Describe the image for readers using assistive technology" />
                                    </label>
                                    <label className={labelClass}>
                                        Media caption
                                        <input name="media_caption" className={inputClass} placeholder="Optional caption or credit" />
                                    </label>
                                </div>
                                {draft.mediaAssets.length ? (
                                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                                        {draft.mediaAssets.map((asset) => (
                                            <figure key={asset.id} className="border border-potomac-regolith/25 p-2">
                                                {asset.mediaType === "video" ? (
                                                    <video src={asset.publicUrl} className="aspect-video w-full object-cover" controls preload="metadata" />
                                                ) : (
                                                    <img src={asset.publicUrl} alt={asset.altText} className="aspect-video w-full object-cover" />
                                                )}
                                                <figcaption className="mt-2 text-xs text-potomac-regolith">{asset.caption || asset.altText || "Story media"}</figcaption>
                                                <button
                                                    type="button"
                                                    disabled={isSaving}
                                                    onClick={() => void removeMedia(asset.id)}
                                                    className="mt-3 w-full border border-red-300/45 px-3 py-2 font-mono text-[0.58rem] font-bold uppercase text-red-200 hover:border-red-200 disabled:opacity-40"
                                                >
                                                    Remove media
                                                </button>
                                            </figure>
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
                                <textarea
                                    ref={bodyRef}
                                    aria-label="Story body"
                                    rows={1}
                                    value={bodyText}
                                    onChange={(event) => setBodyText(event.target.value)}
                                    className="min-h-[32rem] w-full resize-none overflow-hidden border-0 bg-transparent py-3 text-lg leading-8 text-potomac-cream/90 outline-none [field-sizing:content] placeholder:text-potomac-regolith/45"
                                    placeholder="Start writing..."
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
