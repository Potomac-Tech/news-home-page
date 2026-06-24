import type { Metadata } from "next";
import { requireEditorialStaff } from "../../../lib/auth/editorial";
import {
    createArticleDraft,
    publishArticle,
    updateArticleDraft,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Editorial CMS",
};

type Article = {
    id: string;
    slug: string;
    status: string;
    access_tier_required: string;
    title: string;
    public_summary: string;
    public_teaser_markdown: string;
    intro_markdown: string | null;
    seo_title: string | null;
    seo_description: string | null;
    aeo_summary: string | null;
    published_at: string | null;
    updated_at: string;
};

type ArticleBody = {
    article_id: string;
    body_markdown: string;
    body_excerpt: string | null;
};

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString();
}

function statusLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function AccessTierSelect({
    defaultValue = "member",
}: {
    defaultValue?: string;
}) {
    return (
        <select
            name="access_tier_required"
            defaultValue={defaultValue}
            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
        >
            <option value="member">Member</option>
            <option value="scout">Scout</option>
            <option value="command">Command</option>
        </select>
    );
}

function FieldLabel({ children }: { children: string }) {
    return (
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
            {children}
        </label>
    );
}

const inputClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

const textareaClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

export default async function AdminEditorialPage() {
    const { supabase } = await requireEditorialStaff();
    const { data: articleData, error: articleError } = await supabase
        .from("editorial_articles")
        .select(
            "id,slug,status,access_tier_required,title,public_summary,public_teaser_markdown,intro_markdown,seo_title,seo_description,aeo_summary,published_at,updated_at"
        )
        .order("updated_at", { ascending: false });

    if (articleError) {
        throw new Error(articleError.message);
    }

    const articles = (articleData ?? []) as Article[];
    const articleIds = articles.map((article) => article.id);
    const { data: bodyData, error: bodyError } = articleIds.length
        ? await supabase
              .from("editorial_article_bodies")
              .select("article_id,body_markdown,body_excerpt")
              .in("article_id", articleIds)
        : { data: [], error: null };

    if (bodyError) {
        throw new Error(bodyError.message);
    }

    const bodiesByArticleId = new Map(
        ((bodyData ?? []) as ArticleBody[]).map((body) => [
            body.article_id,
            body,
        ])
    );

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Editorial workflow
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Editorial CMS
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Create drafts, preview public and gated story content,
                        update article metadata, and publish when ready.
                    </p>
                </div>

                <form action={createArticleDraft} className="glass-card mt-12 rounded p-6">
                    <h2 className="font-serif text-2xl text-white">
                        New Draft
                    </h2>
                    <div className="mt-6 grid gap-5 lg:grid-cols-2">
                        <div>
                            <FieldLabel>Title</FieldLabel>
                            <input required name="title" className={inputClass} />
                        </div>
                        <div>
                            <FieldLabel>Slug</FieldLabel>
                            <input required name="slug" className={inputClass} />
                        </div>
                        <div>
                            <FieldLabel>Access tier</FieldLabel>
                            <div className="mt-2">
                                <AccessTierSelect />
                            </div>
                        </div>
                        <div>
                            <FieldLabel>SEO title</FieldLabel>
                            <input name="seo_title" className={inputClass} />
                        </div>
                        <div className="lg:col-span-2">
                            <FieldLabel>Public summary</FieldLabel>
                            <textarea
                                required
                                name="public_summary"
                                rows={3}
                                className={textareaClass}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <FieldLabel>Public teaser</FieldLabel>
                            <textarea
                                required
                                name="public_teaser_markdown"
                                rows={5}
                                className={textareaClass}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <FieldLabel>Intro</FieldLabel>
                            <textarea
                                name="intro_markdown"
                                rows={4}
                                className={textareaClass}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <FieldLabel>Gated body</FieldLabel>
                            <textarea
                                required
                                name="body_markdown"
                                rows={8}
                                className={textareaClass}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <FieldLabel>Body excerpt</FieldLabel>
                            <textarea
                                name="body_excerpt"
                                rows={3}
                                className={textareaClass}
                            />
                        </div>
                        <div>
                            <FieldLabel>SEO description</FieldLabel>
                            <textarea
                                name="seo_description"
                                rows={3}
                                className={textareaClass}
                            />
                        </div>
                        <div>
                            <FieldLabel>AEO summary</FieldLabel>
                            <textarea
                                name="aeo_summary"
                                rows={3}
                                className={textareaClass}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Create draft
                    </button>
                </form>

                <div className="mt-10 space-y-6">
                    {articles.length === 0 ? (
                        <div className="glass-card rounded p-6 text-potomac-cream/80">
                            No editorial drafts yet.
                        </div>
                    ) : (
                        articles.map((article) => {
                            const body = bodiesByArticleId.get(article.id);

                            return (
                                <article key={article.id} className="glass-card rounded p-6">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="font-serif text-2xl text-white">
                                                    {article.title}
                                                </h2>
                                                <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                    {statusLabel(article.status)}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-potomac-cream/65">
                                                /news/{article.slug} | Updated{" "}
                                                {formatDate(article.updated_at)}
                                            </p>
                                        </div>
                                        <form action={publishArticle}>
                                            <input
                                                type="hidden"
                                                name="article_id"
                                                value={article.id}
                                            />
                                            <button
                                                type="submit"
                                                className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-45"
                                                disabled={
                                                    article.status === "published"
                                                }
                                            >
                                                Publish
                                            </button>
                                        </form>
                                    </div>

                                    <details className="mt-6 border-y border-white/10 py-5">
                                        <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                            Preview public and gated content
                                        </summary>
                                        <div className="mt-5 grid gap-6 lg:grid-cols-2">
                                            <section>
                                                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Public preview
                                                </h3>
                                                <p className="mt-3 text-lg font-semibold text-white">
                                                    {article.public_summary}
                                                </p>
                                                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/75">
                                                    {article.public_teaser_markdown}
                                                </p>
                                                {article.intro_markdown ? (
                                                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/65">
                                                        {article.intro_markdown}
                                                    </p>
                                                ) : null}
                                            </section>
                                            <section>
                                                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Gated preview
                                                </h3>
                                                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-potomac-cream/55">
                                                    {statusLabel(
                                                        article.access_tier_required
                                                    )}{" "}
                                                    access
                                                </p>
                                                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/75">
                                                    {body?.body_markdown ??
                                                        "No gated body has been saved."}
                                                </p>
                                            </section>
                                        </div>
                                    </details>

                                    <form action={updateArticleDraft} className="mt-6">
                                        <input
                                            type="hidden"
                                            name="article_id"
                                            value={article.id}
                                        />
                                        <div className="grid gap-5 lg:grid-cols-2">
                                            <div>
                                                <FieldLabel>Title</FieldLabel>
                                                <input
                                                    required
                                                    name="title"
                                                    defaultValue={article.title}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel>Slug</FieldLabel>
                                                <input
                                                    required
                                                    name="slug"
                                                    defaultValue={article.slug}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel>Access tier</FieldLabel>
                                                <div className="mt-2">
                                                    <AccessTierSelect
                                                        defaultValue={
                                                            article.access_tier_required
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <FieldLabel>SEO title</FieldLabel>
                                                <input
                                                    name="seo_title"
                                                    defaultValue={
                                                        article.seo_title ?? ""
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <FieldLabel>Public summary</FieldLabel>
                                                <textarea
                                                    required
                                                    name="public_summary"
                                                    rows={3}
                                                    defaultValue={
                                                        article.public_summary
                                                    }
                                                    className={textareaClass}
                                                />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <FieldLabel>Public teaser</FieldLabel>
                                                <textarea
                                                    required
                                                    name="public_teaser_markdown"
                                                    rows={5}
                                                    defaultValue={
                                                        article.public_teaser_markdown
                                                    }
                                                    className={textareaClass}
                                                />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <FieldLabel>Intro</FieldLabel>
                                                <textarea
                                                    name="intro_markdown"
                                                    rows={4}
                                                    defaultValue={
                                                        article.intro_markdown ??
                                                        ""
                                                    }
                                                    className={textareaClass}
                                                />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <FieldLabel>Gated body</FieldLabel>
                                                <textarea
                                                    required
                                                    name="body_markdown"
                                                    rows={8}
                                                    defaultValue={
                                                        body?.body_markdown ?? ""
                                                    }
                                                    className={textareaClass}
                                                />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <FieldLabel>Body excerpt</FieldLabel>
                                                <textarea
                                                    name="body_excerpt"
                                                    rows={3}
                                                    defaultValue={
                                                        body?.body_excerpt ?? ""
                                                    }
                                                    className={textareaClass}
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel>SEO description</FieldLabel>
                                                <textarea
                                                    name="seo_description"
                                                    rows={3}
                                                    defaultValue={
                                                        article.seo_description ??
                                                        ""
                                                    }
                                                    className={textareaClass}
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel>AEO summary</FieldLabel>
                                                <textarea
                                                    name="aeo_summary"
                                                    rows={3}
                                                    defaultValue={
                                                        article.aeo_summary ?? ""
                                                    }
                                                    className={textareaClass}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                        >
                                            Save version
                                        </button>
                                    </form>
                                </article>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
