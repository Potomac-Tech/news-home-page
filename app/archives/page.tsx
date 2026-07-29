import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { absoluteSiteUrl, jsonLdScript, siteConfig } from "../_data/site";
import { potomacBrand } from "../_data/brand";
import {
    editorialSections,
    type EditorialSectionSlug,
} from "../../lib/editorial/section-tags";

export const dynamic = "force-dynamic";

type ArchiveArticle = {
    id: string;
    href: string;
    title: string;
    summary: string;
    imageUrl: string | null;
    imageAlt: string;
    publishedAt: string;
    isFeatured: boolean;
};

function selectedSection(value?: string) {
    return editorialSections.find((section) => section.slug === value)
        ?? editorialSections[0];
}

export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<{ section?: string }>;
}): Promise<Metadata> {
    const section = selectedSection((await searchParams).section);
    const path = section.slug === "news"
        ? "/archives"
        : `/archives?section=${section.slug}`;
    const description = `Published ${section.label.toLowerCase()} reporting and analysis from Cabeus Explorer.`;
    return {
        title: `${section.label} archives`,
        description,
        alternates: { canonical: path },
        openGraph: {
            title: `${section.label} archives | Cabeus Explorer`,
            description,
            url: absoluteSiteUrl(path),
            siteName: siteConfig.name,
            type: "website",
        },
    };
}

async function loadArchive(
    sectionSlug: EditorialSectionSlug
): Promise<ArchiveArticle[]> {
    if (!hasPotomacSupabasePublicConfig()) return [];
    const supabase = await createClient();
    const { data: tag, error: tagError } = await supabase
        .from("editorial_tags")
        .select("id")
        .eq("slug", sectionSlug)
        .maybeSingle();
    if (tagError || !tag) return [];

    const { data: articleTags, error: articleTagError } = await supabase
        .from("editorial_article_tags")
        .select("article_id")
        .eq("tag_id", tag.id);
    if (articleTagError || !articleTags?.length) return [];

    const { data, error } = await supabase
        .from("editorial_articles")
        .select("id,slug,title,public_summary,dek,hero_image_url,hero_image_alt,published_at,carousel_position")
        .in("id", articleTags.map((articleTag) => articleTag.article_id))
        .eq("status", "published")
        .not("primary_author_id", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(250);
    if (error) throw new Error(error.message);

    return (data ?? []).map((article) => ({
        id: article.id,
        href: `/news/${article.slug}`,
        title: article.title,
        summary:
            article.public_summary
            ?? article.dek
            ?? "Published Cabeus Explorer intelligence.",
        imageUrl: article.hero_image_url,
        imageAlt: article.hero_image_alt ?? "",
        publishedAt: article.published_at,
        isFeatured: article.carousel_position !== null,
    }));
}

export default async function ArchivesPage({
    searchParams,
}: {
    searchParams: Promise<{ section?: string }>;
}) {
    const section = selectedSection((await searchParams).section);
    const articles = await loadArchive(section.slug);
    const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Cabeus Explorer ${section.label} archives`,
        itemListElement: articles.map((article, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteSiteUrl(article.href),
            name: article.title,
            description: article.summary,
        })),
    };

    return (
        <div className="min-h-screen bg-cabeus-paper text-cabeus-ink">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(itemList) }}
            />
            <header className="relative min-h-[28rem] overflow-hidden border-b border-cabeus-line">
                <img
                    src={potomacBrand.assets.editorialMoonHero}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="relative mx-auto flex min-h-[28rem] w-full max-w-[92rem] flex-col justify-end px-5 pb-12 pt-16 md:px-10">
                    <p className="brand-kicker">
                        Lunar intelligence record / {articles.length} published
                    </p>
                    <h1 className="mt-4 max-w-4xl font-serif text-6xl font-medium leading-[0.9] text-cabeus-ink md:text-8xl">
                        {section.label} Archives
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-cabeus-muted">
                        The permanent record of Cabeus Explorer reporting. Stories
                        remain here after leaving the homepage carousel.
                    </p>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[92rem] px-5 py-12 md:px-10 md:py-16">
                <nav className="flex flex-wrap border-y border-cabeus-line" aria-label="Archive sections">
                    {editorialSections.map((item) => (
                        <Link
                            key={item.slug}
                            href={item.slug === "news" ? "/archives" : `/archives?section=${item.slug}`}
                            className={`px-4 py-3 font-mono text-[0.68rem] font-bold uppercase ${
                                item.slug === section.slug
                                    ? "bg-cabeus-ink text-cabeus-paper"
                                    : "bg-transparent text-cabeus-muted hover:text-cabeus-bronze"
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {!articles.length ? (
                    <section className="mt-8 border-y border-cabeus-line py-12">
                        <p className="brand-kicker">No published records</p>
                        <h2 className="mt-3 font-serif text-4xl text-cabeus-ink">Archive awaiting reports</h2>
                    </section>
                ) : (
                    <div className="mt-8 divide-y divide-cabeus-line border-y border-cabeus-line">
                        {articles.map((article, index) => (
                            <article
                                key={article.id}
                                className="grid gap-5 py-7 md:grid-cols-[5rem_minmax(0,1fr)_minmax(15rem,24rem)] md:items-center"
                            >
                                <div className="font-mono">
                                    <span className="block text-3xl text-cabeus-bronze">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <time className="mt-2 block text-[0.62rem] uppercase text-cabeus-muted">
                                        {new Date(article.publishedAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "2-digit",
                                            year: "numeric",
                                        })}
                                    </time>
                                </div>
                                <div>
                                    <div className="flex flex-wrap gap-2 font-mono text-[0.6rem] font-bold uppercase">
                                        <span className="text-cabeus-bronze">{section.label}</span>
                                        {article.isFeatured ? <span className="text-cabeus-muted">Homepage featured</span> : null}
                                    </div>
                                    <h2 className="mt-3 max-w-3xl font-serif text-3xl font-medium leading-tight text-cabeus-ink md:text-4xl">
                                        <Link href={article.href} className="hover:text-cabeus-bronze">
                                            {article.title}
                                        </Link>
                                    </h2>
                                    <p className="mt-3 max-w-3xl text-sm leading-6 text-cabeus-muted">
                                        {article.summary}
                                    </p>
                                    <Link href={article.href} className="mt-4 inline-block border-b border-cabeus-gold pb-1 font-mono text-xs font-bold uppercase text-cabeus-ink">
                                        Full story &#8594;
                                    </Link>
                                </div>
                                {article.imageUrl ? (
                                    <img
                                        src={article.imageUrl}
                                        alt={article.imageAlt}
                                        className="aspect-video w-full border border-cabeus-line bg-cabeus-smoke object-cover object-top"
                                    />
                                ) : (
                                    <div className="aspect-video border border-cabeus-line bg-cabeus-smoke" aria-hidden="true" />
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
