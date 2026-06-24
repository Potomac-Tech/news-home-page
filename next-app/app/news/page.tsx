import type { Metadata } from "next";
import Link from "next/link";
import { fallbackArticles } from "./_data/articles";
import { absoluteSiteUrl, jsonLdScript, siteConfig } from "../_data/site";

export const metadata: Metadata = {
    title: "News",
    description:
        "Public Potomac news and article teasers for lunar intelligence readers.",
    alternates: {
        canonical: "/news",
    },
    openGraph: {
        title: "News | Potomac",
        description:
            "Public Potomac news and article teasers for lunar intelligence readers.",
        url: absoluteSiteUrl("/news"),
        siteName: siteConfig.name,
        type: "website",
    },
};

const articles = fallbackArticles.map((article) => ({
    href: `/news/${article.slug}`,
    title: article.title,
    summary: article.summary,
}));

export default function NewsPage() {
    const newsItemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Potomac public news feed",
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
                                Read brief
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
