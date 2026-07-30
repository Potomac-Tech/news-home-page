import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { absoluteSiteUrl, jsonLdScript, organizationJsonLd } from "../../_data/site";

export const dynamic = "force-dynamic";

async function loadAuthor(slug: string) {
    const supabase = await createClient();
    const { data: author, error } = await supabase
        .from("editorial_authors")
        .select("id,display_name,slug,title,organization,bio,avatar_url,social_links")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!author) return null;
    const { data: articles, error: articlesError } = await supabase
        .from("editorial_articles")
        .select("id,title,slug,public_summary,published_at,hero_image_url")
        .eq("primary_author_id", author.id)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });
    if (articlesError) throw new Error(articlesError.message);
    return { author, articles: articles ?? [] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const loaded = await loadAuthor(slug);
    return {
        title: loaded?.author.display_name ?? "Author",
        description: loaded?.author.bio ?? `Articles by ${loaded?.author.display_name ?? "Cabeus Explorer"}.`,
    };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const loaded = await loadAuthor(slug);
    if (!loaded) notFound();
    const { author, articles } = loaded;
    const socialLinks = author.social_links && typeof author.social_links === "object"
        ? Object.entries(author.social_links as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string")
        : [];
    const avatarUrl = author.avatar_url
        ? author.avatar_url.startsWith("http")
            ? author.avatar_url
            : absoluteSiteUrl(author.avatar_url)
        : null;
    const { "@context": _organizationContext, ...worksFor } = organizationJsonLd();
    const authorJsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: author.display_name,
        url: absoluteSiteUrl(`/authors/${author.slug}`),
        jobTitle: author.title ?? undefined,
        description: author.bio ?? undefined,
        image: avatarUrl ?? undefined,
        worksFor,
        sameAs: socialLinks.map(([, url]) => url),
    };

    return (
        <main className="bg-grid-pattern min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(authorJsonLd) }}
            />
            <header className="border-b border-white/10">
                <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:px-8">
                    {avatarUrl ? <img src={avatarUrl} alt={author.display_name} className="h-32 w-32 border border-potomac-gold/40 object-cover" /> : null}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">Cabeus Explorer author</p>
                        <h1 className="mt-3 font-serif text-5xl text-white">{author.display_name}</h1>
                        <p className="mt-3 text-lg text-potomac-cream/70">{[author.title, author.organization].filter(Boolean).join(" · ")}</p>
                        {author.bio ? (
                            <div className="mt-5 grid max-w-3xl gap-4 text-base leading-7 text-potomac-cream/75">
                                {author.bio.split(/\n{2,}/).map((paragraph: string) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        ) : null}
                        {socialLinks.length ? <div className="mt-4 flex gap-4">{socialLinks.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase text-potomac-gold">{label}</a>)}</div> : null}
                    </div>
                </div>
            </header>
            <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
                <h2 className="font-serif text-3xl text-white">Articles by {author.display_name}</h2>
                <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article) => (
                        <Link key={article.id} href={`/news/${article.slug}`} className="glass-card rounded p-5">
                            {article.hero_image_url ? <img src={article.hero_image_url} alt="" className="aspect-video w-full rounded object-cover" /> : null}
                            <time className="mt-4 block text-xs font-bold uppercase text-potomac-gold">{new Date(article.published_at!).toLocaleDateString()}</time>
                            <h3 className="mt-3 font-serif text-2xl text-white">{article.title}</h3>
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-potomac-cream/70">{article.public_summary}</p>
                        </Link>
                    ))}
                </div>
                {!articles.length ? <p className="mt-7 text-potomac-regolith">No published articles yet.</p> : null}
            </section>
        </main>
    );
}
