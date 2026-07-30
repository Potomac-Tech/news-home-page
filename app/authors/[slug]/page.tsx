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
        <main className="min-h-screen bg-cabeus-paper text-cabeus-ink">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(authorJsonLd) }}
            />
            <header className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-12 md:grid-cols-[15rem_minmax(0,1fr)] md:items-start md:px-10 md:py-20 lg:gap-14">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={author.display_name}
                            className="aspect-square w-full max-w-[15rem] border border-cabeus-line bg-cabeus-smoke object-cover"
                        />
                    ) : null}
                    <div className="max-w-5xl">
                        <p className="brand-kicker">Cabeus Explorer author</p>
                        <h1 className="mt-4 font-serif text-6xl font-medium leading-[0.9] text-cabeus-ink md:text-7xl lg:text-8xl">
                            {author.display_name}
                        </h1>
                        <p className="mt-5 font-mono text-xs font-bold uppercase text-cabeus-bronze">
                            {[author.title, author.organization].filter(Boolean).join(" / ")}
                        </p>
                        {author.bio ? (
                            <div className="mt-7 grid max-w-4xl gap-5 border-t border-cabeus-line pt-7 font-serif text-xl leading-8 text-cabeus-muted md:text-2xl md:leading-9">
                                {author.bio.split(/\n{2,}/).map((paragraph: string) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        ) : null}
                        {socialLinks.length ? (
                            <div className="mt-7 flex flex-wrap gap-5 border-t border-cabeus-line pt-5">
                                {socialLinks.map(([label, url]) => (
                                    <a key={label} href={url} target="_blank" rel="noreferrer" className="border-b border-cabeus-gold pb-1 font-mono text-xs font-bold uppercase text-cabeus-ink hover:text-cabeus-bronze">
                                        {label}
                                    </a>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </header>
            <section className="mx-auto w-full max-w-[92rem] px-5 py-12 md:px-10 md:py-16">
                <p className="brand-kicker">Published reporting</p>
                <h2 className="mt-3 font-serif text-4xl font-medium text-cabeus-ink md:text-5xl">Articles by {author.display_name}</h2>
                <div className="mt-8 divide-y divide-cabeus-line border-y border-cabeus-line">
                    {articles.map((article) => (
                        <Link key={article.id} href={`/news/${article.slug}`} className="group grid gap-5 py-7 md:grid-cols-[minmax(0,1fr)_minmax(15rem,24rem)] md:items-center">
                            <div>
                                <time className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                    {new Date(article.published_at!).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                </time>
                                <h3 className="mt-3 max-w-3xl font-serif text-3xl font-medium leading-tight text-cabeus-ink transition group-hover:text-cabeus-bronze md:text-4xl">{article.title}</h3>
                                <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-6 text-cabeus-muted">{article.public_summary}</p>
                                <span className="mt-4 inline-block border-b border-cabeus-gold pb-1 font-mono text-xs font-bold uppercase text-cabeus-ink">Full story &#8594;</span>
                            </div>
                            {article.hero_image_url ? <img src={article.hero_image_url} alt="" className="aspect-video w-full border border-cabeus-line bg-cabeus-smoke object-cover object-top" /> : null}
                        </Link>
                    ))}
                </div>
                {!articles.length ? <p className="mt-7 border-y border-cabeus-line py-8 text-cabeus-muted">No published articles yet.</p> : null}
            </section>
        </main>
    );
}
