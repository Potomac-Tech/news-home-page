import type { Metadata } from "next";
import Link from "next/link";
import { fallbackArticles } from "./_data/articles";
import { absoluteSiteUrl, jsonLdScript, siteConfig } from "../_data/site";
import { allowLocalContentFallbacks } from "../_data/contentFallbacks";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import {
    editorialSections,
    type EditorialSectionSlug,
} from "../../lib/editorial/section-tags";

export const dynamic = "force-dynamic";

type NewsTeaser = {
    href: string;
    title: string;
    summary: string;
};

const fallbackTeasers = fallbackArticles.map((article) => ({
    href: `/news/${article.slug}`,
    title: article.title,
    summary: article.summary,
}));

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
        ? "/news"
        : `/news?section=${section.slug}`;
    const description = `${section.label} articles and public teasers from Cabeus Explorer.`;

    return {
        title: section.label,
        description,
        alternates: { canonical: path },
        openGraph: {
            title: `${section.label} | Cabeus Explorer`,
            description,
            url: absoluteSiteUrl(path),
            siteName: siteConfig.name,
            type: "website",
        },
    };
}

async function loadArticles(
    sectionSlug: EditorialSectionSlug
): Promise<NewsTeaser[]> {
    if (!hasPotomacSupabasePublicConfig()) {
        return sectionSlug === "news" && allowLocalContentFallbacks()
            ? fallbackTeasers
            : [];
    }

    try {
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
            .select("slug,title,public_summary,dek,published_at")
            .in(
                "id",
                articleTags.map((articleTag) => articleTag.article_id)
            )
            .eq("status", "published")
            .not("primary_author_id", "is", null)
            .lte("published_at", new Date().toISOString())
            .order("published_at", { ascending: false })
            .limit(48);

        if (error || !data?.length) {
            return [];
        }

        return data.map((article) => ({
            href: `/news/${article.slug}`,
            title: article.title,
            summary:
                article.public_summary ??
                article.dek ??
                "Published Cabeus Explorer intelligence brief.",
        }));
    } catch {
        return [];
    }
}

export default async function NewsPage({
    searchParams,
}: {
    searchParams: Promise<{ section?: string }>;
}) {
    const section = selectedSection((await searchParams).section);
    const articles = await loadArticles(section.slug);
    const newsItemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Cabeus Explorer ${section.label} feed`,
        itemListElement: articles.map((article, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteSiteUrl(article.href),
            name: article.title,
            description: article.summary,
        })),
    };

    return (
        <section className="bg-grid-pattern">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(newsItemListJsonLd),
                }}
            />
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Public feed
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        {section.label}
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Reporting, analysis, and member-gated full stories from
                        the Cabeus Explorer newsroom.
                    </p>
                </div>
                <nav className="mt-8 flex flex-wrap gap-2" aria-label="Article sections">
                    {editorialSections.map((item) => (
                        <Link
                            key={item.slug}
                            href={item.slug === "news" ? "/news" : `/news?section=${item.slug}`}
                            className={`border px-4 py-2 font-mono text-xs font-bold uppercase ${
                                item.slug === section.slug
                                    ? "border-potomac-gold bg-potomac-gold text-potomac-primary"
                                    : "border-potomac-regolith/35 text-potomac-cream"
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="mt-12 grid gap-6 md:grid-cols-2">
                    {!articles.length ? (
                        <section className="border border-potomac-regolith/25 bg-potomac-primary/65 p-6 md:col-span-2">
                            <h2 className="font-serif text-2xl uppercase text-white">
                                News feed temporarily unavailable
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                Approved stories will return when the editorial feed
                                is available.
                            </p>
                        </section>
                    ) : null}
                    {articles.map((article) => (
                        <article key={article.href} className="glass-card rounded p-6">
                            <h2 className="font-serif text-2xl text-white">
                                {article.title}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                {article.summary}
                            </p>
                            <Link
                                href={article.href}
                                className="mt-6 inline-block text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold hover:text-potomac-cream"
                            >
                                Full story
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
