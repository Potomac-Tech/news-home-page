import type { Metadata } from "next";
import Link from "next/link";
import { requireEditorialStaff } from "../../../lib/auth/editorial";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Article dashboard", robots: { index: false, follow: false } };

const pageSize = 50;
const statuses = ["all", "draft", "in_review", "scheduled", "published", "archived"] as const;

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
        .select("id,title,slug,status,primary_author_id,scheduled_for,published_at,updated_at", { count: "exact" })
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
    const authorIds = Array.from(new Set(rows.map((row) => row.primary_author_id).filter(Boolean))) as string[];
    const { data: authors, error: authorError } = authorIds.length
        ? await supabase.from("editorial_authors").select("id,display_name").in("id", authorIds)
        : { data: [], error: null };
    if (authorError) throw new Error(authorError.message);
    const authorById = new Map((authors ?? []).map((author) => [author.id, author.display_name]));
    const counts = new Map(countResults);
    const totalPages = Math.max(1, Math.ceil((articlesResult.count ?? 0) / pageSize));

    return (
        <main className="min-h-screen bg-potomac-primary px-4 py-8 text-potomac-cream md:px-8">
            <div className="mx-auto max-w-[92rem]">
                <header className="flex flex-wrap items-end justify-between gap-5 border-b border-potomac-regolith/25 pb-6">
                    <div>
                        <p className="font-mono text-xs font-bold uppercase text-potomac-gold">Cabeus newsroom</p>
                        <h1 className="mt-2 font-serif text-4xl uppercase text-white">Article dashboard</h1>
                        <p className="mt-2 text-sm text-potomac-regolith">{articlesResult.count ?? 0} matching articles · 50 per page</p>
                    </div>
                    <Link href="/studio?new=1" className="bg-potomac-gold px-5 py-3 font-mono text-xs font-bold uppercase text-potomac-primary">New story</Link>
                </header>

                <section className="mt-6 grid gap-3 sm:grid-cols-3">
                    {["draft", "scheduled", "published"].map((status) => (
                        <Link key={status} href={`/studio/dashboard?status=${status}`} className="border border-potomac-regolith/25 p-5">
                            <span className="font-mono text-xs font-bold uppercase text-potomac-gold">{status}</span>
                            <strong className="mt-2 block font-serif text-4xl text-white">{counts.get(status) ?? 0}</strong>
                        </Link>
                    ))}
                </section>

                <form className="mt-6 flex flex-wrap gap-3">
                    <input name="q" defaultValue={query} type="search" placeholder="Search headline or URL" className="min-w-64 flex-1 border border-potomac-regolith/30 bg-potomac-primary px-4 py-3 text-white" />
                    <select name="status" defaultValue={activeStatus} className="border border-potomac-regolith/30 bg-potomac-primary px-4 py-3 text-white">
                        {statuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                    </select>
                    <button className="border border-potomac-gold px-5 py-3 font-mono text-xs font-bold uppercase text-potomac-gold">Filter</button>
                </form>

                <div className="mt-6 overflow-x-auto border border-potomac-regolith/25">
                    <table className="w-full min-w-[58rem] border-collapse text-left">
                        <thead className="bg-black/30 font-mono text-[0.68rem] uppercase text-potomac-gold">
                            <tr><th className="p-4">Headline</th><th className="p-4">Author</th><th className="p-4">Status</th><th className="p-4">Publishing date</th><th className="p-4">Updated</th><th className="p-4">Actions</th></tr>
                        </thead>
                        <tbody>
                            {rows.map((article) => {
                                const publishDate = article.scheduled_for ?? article.published_at;
                                return (
                                    <tr key={article.id} className="border-t border-potomac-regolith/20">
                                        <td className="p-4"><strong className="block text-white">{article.title}</strong><span className="mt-1 block font-mono text-xs text-potomac-regolith">/news/{article.slug}</span></td>
                                        <td className="p-4 text-sm">{article.primary_author_id ? authorById.get(article.primary_author_id) ?? "Unknown" : "Byline not set"}</td>
                                        <td className="p-4 font-mono text-xs uppercase text-potomac-gold">{article.status}</td>
                                        <td className="p-4 text-sm">{publishDate ? new Date(publishDate).toLocaleString() : "Not set"}</td>
                                        <td className="p-4 text-sm">{new Date(article.updated_at).toLocaleString()}</td>
                                        <td className="p-4"><div className="flex gap-3"><Link href={`/studio?article=${article.id}`} className="font-mono text-xs font-bold uppercase text-potomac-cream">Edit</Link><Link href={`/studio/preview/${article.id}`} className="font-mono text-xs font-bold uppercase text-potomac-gold">Preview</Link></div></td>
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
