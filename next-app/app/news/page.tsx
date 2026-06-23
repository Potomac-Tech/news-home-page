import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "News",
};

const articles = [
    {
        href: "/news/vipc-grant-winner",
        title: "Potomac named VIPC grant winner",
        summary:
            "Existing static story route reserved for CMS-backed article migration.",
    },
];

export default function NewsPage() {
    return (
        <section className="bg-grid-pattern">
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
