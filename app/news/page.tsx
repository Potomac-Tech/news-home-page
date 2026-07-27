import type { Metadata } from "next";
import Link from "next/link";
import { fallbackArticles } from "./_data/articles";
import { absoluteSiteUrl, jsonLdScript, siteConfig } from "../_data/site";
import { allowLocalContentFallbacks } from "../_data/contentFallbacks";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "News",
    description:
        "Public Cabeus Explorer news and article teasers for lunar intelligence readers.",
    alternates: {
        canonical: "/news",
    },
    openGraph: {
        title: "News | Cabeus Explorer",
        description:
            "Public Cabeus Explorer news and article teasers for lunar intelligence readers.",
        url: absoluteSiteUrl("/news"),
        siteName: siteConfig.name,
        type: "website",
    },
};

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

async function loadArticles(): Promise<NewsTeaser[]> {
    if (!hasPotomacSupabasePublicConfig()) {
        return allowLocalContentFallbacks() ? fallbackTeasers : [];
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("editorial_articles")
            .select("slug,title,public_summary,dek,published_at")
            .eq("status", "published")
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

export default async function NewsPage() {
    const articles = await loadArticles();
    const newsItemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Cabeus Explorer public news feed",
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
                        News
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        This route is ready for the editorial CMS feed, public
                        article teasers, citations, and member-gated full
                        stories.
                    </p>
                </div>
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
