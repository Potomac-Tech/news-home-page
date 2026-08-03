import type { Metadata } from "next";
import Link from "next/link";
import { requireEditorialStaff } from "../../../lib/auth/editorial";
import { editorialSections } from "../../../lib/editorial/section-tags";
import { CarouselPositionControl } from "./CarouselPositionControl";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Article dashboard", robots: { index: false, follow: false } };

const pageSize = 50;
const statuses = ["all", "draft", "in_review", "scheduled", "published", "archived"] as const;
const statusLabels: Record<(typeof statuses)[number], string> = {
    all: "all",
    draft: "draft",
    in_review: "in review",
    scheduled: "scheduled",
    published: "published",
    archived: "withdrawn",
};

export default async function ArticleDashboard({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
    const params = await searchParams;
    const activeStatus = statuses.includes(params.status as (typeof statuses)[number]) ? params.status! : "all";
    const query = (params.q ?? "").trim();
    const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
    const { supabase } = await requireEditorialStaff("/studio/dashboard");

    let articleQuery = supabase
        .from("editorial_articles")
        .select("id,title,slug,status,primary_author_id,scheduled_for,published_at,updated_at,carousel_position", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
    if (activeStatus !== "all") articleQuery = articleQuery.eq("status", activeStatus);
    if (query) articleQuery = articleQuery.or(`title.ilike.%${query}%,slug.ilike.%${query}%`);

    const [articlesResult, countResults] = await Promise.all([
        articleQuery,
        Promise.all(["draft", "scheduled", "published"].map(async (status) => {
            const { count } = await supabase.from("editorial_articles").select("id", { count: "exact", head: true }).eq("status", status);
            return [status, count ?? 0] as const;
        })),
    ]);
    if (articlesResult.error) throw new Error(articlesResult.error.message);

    const rows = articlesResult.data ?? [];
    const articleIds = rows.map((row) => row.id);
    const authorIds = Array.from(new Set(rows.map((row) => row.primary_author_id).filter(Boolean))) as string[];
    const [authorsResult, articleTagsResult, sectionTagsResult] = await Promise.all([
        authorIds.length
            ? supabase.from("editorial_authors").select("id,display_name").in("id", authorIds)
            : Promise.resolve({ data: [], error: null }),
        articleIds.length
            ? supabase.from("editorial_article_tags").select("article_id,tag_id").in("article_id", articleIds)
            : Promise.resolve({ data: [], error: null }),
        supabase.from("editorial_tags").select("id,slug").in(
            "slug",
            editorialSections.map((section) => section.slug)
        ),
    ]);
    if (authorsResult.error) throw new Error(authorsResult.error.message);
    if (articleTagsResult.error) throw new Error(articleTagsResult.error.message);
    if (sectionTagsResult.error) throw new Error(sectionTagsResult.error.message);
    const authors = authorsResult.data ?? [];
    const authorById = new Map((authors ?? []).map((author) => [author.id, author.display_name]));
    const sectionById = new Map(
        (sectionTagsResult.data ?? []).map((tag) => [tag.id, tag.slug])
    );
    const sectionsByArticle = new Map<string, string[]>();
    for (const articleTag of articleTagsResult.data ?? []) {
        const slug = sectionById.get(articleTag.tag_id);
        if (!slug) continue;
        const sections = sectionsByArticle.get(articleTag.article_id) ?? [];
        sections.push(slug);
        sectionsByArticle.set(articleTag.article_id, sections);
    }
    const sectionLabelBySlug = new Map<string, string>(
        editorialSections.map((section) => [section.slug, section.label])
    );
    const counts = new Map(countResults);
    const totalPages = Math.max(1, Math.ceil((articlesResult.count ?? 0) / pageSize));

    return (
        <main className="min-h-screen bg-cabeus-paper px-4 py-10 text-cabeus-ink md:px-8 md:py-14">
            <div className="mx-auto max-w-[92rem]">
                <header className="flex flex-wrap items-end justify-between gap-5 border-b border-cabeus-line pb-8">
                    <div>
                        <p className="brand-kicker">Cabeus Explorer editorial studio</p>
                        <h1 className="mt-3 font-serif text-5xl font-medium leading-none text-cabeus-ink md:text-6xl">Article dashboard</h1>
                        <p className="mt-3 font-mono text-xs uppercase text-cabeus-bronze">{articlesResult.count ?? 0} matching articles · 50 per page</p>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-cabeus-muted">
                            Published stories remain in the public Archives after their
                            carousel position is set to N/A. Archived status withdraws
                            a story from the public site.
                        </p>
                    </div>
                    <Link href="/studio?new=1" className="brand-button inline-flex">New story</Link>
                </header>

                <section className="mt-6 grid gap-3 sm:grid-cols-3">
                    {["draft", "scheduled", "published"].map((status) => (
                        <Link key={status} href={`/studio/dashboard?status=${status}`} className="border border-cabeus-line bg-white/35 p-5 transition hover:border-cabeus-gold">
                            <span className="font-mono text-xs font-bold uppercase text-cabeus-bronze">{status}</span>
                            <strong className="mt-2 block font-serif text-4xl font-medium text-cabeus-ink">{counts.get(status) ?? 0}</strong>
                        </Link>
                    ))}
                </section>

                <form className="mt-6 flex flex-wrap gap-3">
                    <input name="q" defaultValue={query} type="search" placeholder="Search headline or URL" className="min-w-64 flex-1 border border-cabeus-line bg-white px-4 py-3 text-cabeus-ink outline-none placeholder:text-cabeus-muted/60 focus:border-cabeus-gold" />
                    <select name="status" defaultValue={activeStatus} className="border border-cabeus-line bg-white px-4 py-3 text-cabeus-ink outline-none focus:border-cabeus-gold">
                        {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                    <button className="brand-button brand-button-outline">Filter</button>
                </form>

                <div className="mt-6 overflow-x-auto border border-cabeus-line bg-white/25">
                    <table className="w-full min-w-[76rem] border-collapse text-left">
                        <thead className="bg-cabeus-smoke font-mono text-[0.68rem] uppercase text-cabeus-bronze">
                            <tr><th className="p-4">Headline</th><th className="p-4">Author</th><th className="p-4">Sections</th><th className="p-4">Status</th><th className="p-4">Publishing date</th><th className="p-4">Carousel</th><th className="p-4">Updated</th><th className="p-4">Actions</th></tr>
                        </thead>
                        <tbody>
                            {rows.map((article) => {
                                const publishDate = article.scheduled_for ?? article.published_at;
                                return (
                                    <tr key={article.id} className="border-t border-cabeus-line transition hover:bg-white/50">
                                        <td className="p-4"><strong className="block font-serif text-xl font-medium leading-tight text-cabeus-ink">{article.title}</strong><span className="mt-1 block font-mono text-xs text-cabeus-muted">/news/{article.slug}</span></td>
                                        <td className="p-4 text-sm">{article.primary_author_id ? authorById.get(article.primary_author_id) ?? "Unknown" : "Byline not set"}</td>
                                        <td className="p-4 text-sm">
                                            {(sectionsByArticle.get(article.id) ?? ["news"])
                                                .map((slug) => sectionLabelBySlug.get(slug) ?? slug)
                                                .join(", ")}
                                        </td>
                                        <td className="p-4 font-mono text-xs uppercase text-cabeus-bronze">
                                            {article.status === "archived" ? "withdrawn" : article.status.replace("_", " ")}
                                        </td>
                                        <td className="p-4 text-sm">{publishDate ? new Date(publishDate).toLocaleString() : "Not set"}</td>
                                        <td className="p-4">
                                            <CarouselPositionControl
                                                articleId={article.id}
                                                articleTitle={article.title}
                                                articleStatus={article.status}
                                                initialPosition={article.carousel_position}
                                            />
                                        </td>
                                        <td className="p-4 text-sm">{new Date(article.updated_at).toLocaleString()}</td>
                                        <td className="p-4"><div className="flex gap-3"><Link href={`/studio?article=${article.id}`} className="border-b border-cabeus-gold font-mono text-xs font-bold uppercase text-cabeus-ink">Edit</Link><Link href={`/studio/preview/${article.id}`} className="border-b border-cabeus-gold font-mono text-xs font-bold uppercase text-cabeus-bronze">Preview</Link></div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <nav className="mt-5 flex items-center justify-between font-mono text-xs uppercase">
                    {page > 1 ? <Link href={`/studio/dashboard?status=${activeStatus}&q=${encodeURIComponent(query)}&page=${page - 1}`}>Previous</Link> : <span />}
                    <span>Page {page} of {totalPages}</span>
                    {page < totalPages ? <Link href={`/studio/dashboard?status=${activeStatus}&q=${encodeURIComponent(query)}&page=${page + 1}`}>Next</Link> : <span />}
                </nav>
            </div>
        </main>
    );
}
