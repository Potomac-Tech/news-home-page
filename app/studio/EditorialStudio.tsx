"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    createArticleDraft,
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

type StorySection = { id: string; text: string };

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

function toSections(body: string): StorySection[] {
    const sections = body
        .split(/\n\s*\n/)
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text, index) => ({ id: `section-${index}`, text }));

    return sections.length
        ? sections
        : [{ id: "section-0", text: "" }];
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
    const [sections, setSections] = useState(() => toSections(selected.body));
    const [query, setQuery] = useState("");
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const [importStatus, setImportStatus] = useState<string>("");
    const [previewMode, setPreviewMode] = useState<"public" | "member">("public");
    const [saveStatus, setSaveStatus] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formId = "editorial-studio-story-form";

    const filteredArticles = articles.filter((article) =>
        `${article.title} ${article.authorName} ${article.status}`.toLowerCase().includes(query.toLowerCase())
    );
    const bodyMarkdown = sections.map((section) => section.text.trim()).filter(Boolean).join("\n\n");
    const action = draft.id === "new" ? createArticleDraft : updateArticleDraft;

    function chooseArticle(article: StudioArticle) {
        setSelectedId(article.id);
        setDraft(article);
        setSections(toSections(article.body));
        setImportStatus("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function startNewStory() {
        const next = emptyArticle();
        setSelectedId("new");
        setDraft(next);
        setSections(toSections(""));
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
            const nextSections = (bodySections.length ? bodySections : imported).map(
                (text) => ({ id: crypto.randomUUID(), text })
            );

            setSections(nextSections);
            setDraft((current) => {
                const headline = current.title || (probableHeadline.length <= 180 ? probableHeadline : "");
                const firstBody = nextSections[0]?.text ?? "";
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

    function moveSection(targetId: string) {
        if (!draggedSectionId || draggedSectionId === targetId) return;
        setSections((current) => {
            const from = current.findIndex((item) => item.id === draggedSectionId);
            const to = current.findIndex((item) => item.id === targetId);
            if (from < 0 || to < 0) return current;
            const next = [...current];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        setDraggedSectionId(null);
    }

    function draftTeaser() {
        const source = draft.publicSummary || sections.find((section) => section.text.trim())?.text || "";
        const normalized = source.replace(/\s+/g, " ").trim();
        updateDraft("publicTeaser", normalized.length > 320 ? `${normalized.slice(0, 317).trimEnd()}...` : normalized);
    }

    return (
        <div className="min-h-screen bg-potomac-secondary text-potomac-cream">
            <header className="border-b border-potomac-regolith/25 bg-potomac-primary">
                <div className="mx-auto flex w-full max-w-[100rem] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
                    <div>
                        <p className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">Cabeus newsroom</p>
                        <h1 className="mt-1 font-serif text-2xl uppercase text-white">Editorial studio</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/studio/dashboard" className="border border-potomac-regolith/35 px-4 py-2 font-mono text-[0.64rem] font-bold uppercase text-potomac-cream hover:border-potomac-gold">Article dashboard</a>
                        <a href="/" target="_blank" className="border border-potomac-regolith/35 px-4 py-2 font-mono text-[0.64rem] font-bold uppercase text-potomac-cream hover:border-potomac-gold">View site</a>
                        {saveStatus ? <p role="status" className="font-mono text-[0.62rem] uppercase text-potomac-regolith">{saveStatus}</p> : null}
                        <button disabled={isSaving} type="submit" form={formId} className="bg-potomac-gold px-5 py-2 font-mono text-[0.64rem] font-bold uppercase text-potomac-primary disabled:cursor-wait disabled:opacity-55">Save draft</button>
                        {draft.id !== "new" ? (
                            <a href={`/studio/preview/${draft.id}`} className="border border-potomac-gold px-5 py-2 font-mono text-[0.64rem] font-bold uppercase text-potomac-gold">Preview to publish</a>
                        ) : null}
                    </div>
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-[100rem] lg:grid-cols-[17rem_minmax(0,1fr)_22rem]">
                <aside className="border-b border-potomac-regolith/20 bg-potomac-primary/45 p-4 lg:min-h-[calc(100vh-5rem)] lg:border-b-0 lg:border-r">
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
                                <span className="mt-2 block font-serif text-base uppercase leading-5 text-white">{article.title}</span>
                                <span className="mt-2 block text-xs text-potomac-cream/65">{article.authorName ? `By ${article.authorName}` : "Byline not set"}</span>
                                <span className="mt-2 block font-mono text-[0.56rem] uppercase text-potomac-regolith">{new Date(article.updatedAt).toLocaleDateString()}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="min-w-0 border-potomac-regolith/20 px-4 py-6 md:px-6 lg:border-r">
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

                        <div className="mt-6 space-y-6">
                            <label className={labelClass}>
                                Headline
                                <textarea
                                    required
                                    name="title"
                                    rows={2}
                                    value={draft.title}
                                    onChange={(event) => {
                                        const title = event.target.value;
                                        setDraft((current) => ({
                                            ...current,
                                            title,
                                            slug: current.id === "new" ? slugify(title) : current.slug,
                                        }));
                                    }}
                                    className={`${inputClass} resize-y font-serif text-3xl uppercase leading-tight`}
                                    placeholder="Write the clearest version of the story"
                                />
                            </label>

                            <label className={labelClass}>
                                Byline
                                <input
                                    required
                                    name="author_name"
                                    value={draft.authorName}
                                    onChange={(event) => updateDraft("authorName", event.target.value)}
                                    className={inputClass}
                                    placeholder="Author's published name"
                                    autoComplete="name"
                                />
                            </label>

                            <label className={labelClass}>
                                Standfirst
                                <textarea required name="public_summary" rows={3} value={draft.publicSummary} onChange={(event) => updateDraft("publicSummary", event.target.value)} className={inputClass} placeholder="One sentence that explains why this matters" />
                                <span className="mt-2 block text-right text-[0.58rem] text-potomac-regolith">{draft.publicSummary.length} characters</span>
                            </label>

                            <section className="border-y border-potomac-regolith/20 py-6">
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

                            <section className="border-y border-potomac-regolith/20 py-6">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <label className={`${labelClass} md:col-span-2`}>
                                        Story images and video
                                        <input
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
                                            </figure>
                                        ))}
                                    </div>
                                ) : null}
                            </section>

                            <label className={labelClass}>
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

                            <section>
                                <div className="flex items-center justify-between gap-4">
                                    <h2 className="font-serif text-2xl uppercase text-white">Story body</h2>
                                    <button type="button" onClick={() => setSections((current) => [...current, { id: crypto.randomUUID(), text: "" }])} className="border border-potomac-regolith/35 px-4 py-2 font-mono text-[0.62rem] font-bold uppercase text-potomac-cream hover:border-potomac-gold">Add section</button>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {sections.map((section, index) => (
                                        <article
                                            key={section.id}
                                            draggable
                                            onDragStart={() => setDraggedSectionId(section.id)}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={() => moveSection(section.id)}
                                            className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] border border-potomac-regolith/25 bg-potomac-primary/40"
                                        >
                                            <button type="button" aria-label={`Move section ${index + 1}`} className="cursor-grab border-r border-potomac-regolith/20 font-mono text-lg text-potomac-gold">≡</button>
                                            <textarea
                                                aria-label={`Story section ${index + 1}`}
                                                rows={Math.max(4, Math.min(12, Math.ceil(section.text.length / 90)))}
                                                value={section.text}
                                                onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, text: event.target.value } : item))}
                                                className="min-w-0 resize-y bg-transparent px-4 py-4 text-base leading-7 text-potomac-cream outline-none"
                                                placeholder="Write or paste this section"
                                            />
                                            <button type="button" aria-label={`Remove section ${index + 1}`} onClick={() => setSections((current) => current.length === 1 ? [{ ...current[0], text: "" }] : current.filter((item) => item.id !== section.id))} className="border-l border-potomac-regolith/20 font-mono text-xl text-potomac-regolith hover:text-red-300">×</button>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="border-y border-potomac-regolith/20 py-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="font-serif text-2xl uppercase text-white">Public teaser</h2>
                                    <button type="button" onClick={draftTeaser} className="border border-potomac-gold/55 px-4 py-2 font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">Draft from opening</button>
                                </div>
                                <textarea required name="public_teaser_markdown" rows={5} value={draft.publicTeaser} onChange={(event) => updateDraft("publicTeaser", event.target.value)} className={inputClass} placeholder="Give non-members enough context to understand the news and why it matters" />
                                <p className="mt-2 text-right font-mono text-[0.58rem] uppercase text-potomac-regolith">{draft.publicTeaser.length} characters</p>
                            </section>

                            <details className="border-b border-potomac-regolith/20 pb-6">
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

                <aside className="bg-potomac-primary/35 p-4 lg:min-h-[calc(100vh-5rem)] lg:p-5">
                    <div className="flex border border-potomac-regolith/25 p-1" role="tablist" aria-label="Story preview">
                        {(["public", "member"] as const).map((mode) => (
                            <button key={mode} type="button" role="tab" aria-selected={previewMode === mode} onClick={() => setPreviewMode(mode)} className={`min-h-10 flex-1 font-mono text-[0.62rem] font-bold uppercase ${previewMode === mode ? "bg-potomac-gold text-potomac-primary" : "text-potomac-regolith"}`}>{mode === "public" ? "Homepage" : "Full story"}</button>
                        ))}
                    </div>
                    <div className="mt-4 border border-potomac-regolith/25 bg-potomac-primary p-5">
                        <p className="font-mono text-[0.58rem] font-bold uppercase text-potomac-gold">{previewMode === "public" ? "Public preview" : `${draft.accessTier} access`}</p>
                        <h2 className="mt-4 font-serif text-3xl uppercase leading-tight text-white">{draft.title || "Story headline"}</h2>
                        <p className="mt-3 text-xs font-bold uppercase text-potomac-cream/55">By {draft.authorName || "Author name"}</p>
                        <div className="industrial-divider mt-5 h-px w-24" />
                        <p className="mt-5 text-base leading-6 text-potomac-cream/80">{draft.publicSummary || "The standfirst will appear here."}</p>
                        {previewMode === "public" ? (
                            <>
                                <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/65">{draft.publicTeaser || "The public teaser will appear here."}</p>
                                <div className="mt-6 border-t border-potomac-regolith/20 pt-5">
                                    <span className="inline-flex bg-potomac-gold px-4 py-2 font-mono text-[0.62rem] font-bold uppercase text-potomac-primary">Read full story</span>
                                </div>
                            </>
                        ) : (
                            <div className="mt-6 space-y-4 border-t border-potomac-regolith/20 pt-5">
                                {sections.filter((section) => section.text.trim()).map((section) => (
                                    <p key={section.id} className="whitespace-pre-wrap text-sm leading-6 text-potomac-cream/72">{section.text}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
