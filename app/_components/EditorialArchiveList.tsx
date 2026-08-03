import Link from "next/link";
import type { ArchiveArticle } from "../_data/editorialArchive";

export function EditorialArchiveList({
    articles,
    sectionLabel,
    emptyTitle = "Archive awaiting reports",
}: {
    articles: ArchiveArticle[];
    sectionLabel: string;
    emptyTitle?: string;
}) {
    if (!articles.length) {
        return (
            <section className="mt-8 border-y border-cabeus-line py-12">
                <p className="brand-kicker">No published records</p>
                <h2 className="mt-3 font-serif text-4xl text-cabeus-ink">
                    {emptyTitle}
                </h2>
            </section>
        );
    }

    return (
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
                            <span className="text-cabeus-bronze">{sectionLabel}</span>
                            {article.isFeatured ? (
                                <span className="text-cabeus-muted">Homepage featured</span>
                            ) : null}
                        </div>
                        <h2 className="mt-3 max-w-3xl font-serif text-3xl font-medium leading-tight text-cabeus-ink md:text-4xl">
                            <Link href={article.href} className="hover:text-cabeus-bronze">
                                {article.title}
                            </Link>
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-cabeus-muted">
                            {article.summary}
                        </p>
                        <Link
                            href={article.href}
                            className="mt-4 inline-block border-b border-cabeus-gold pb-1 font-mono text-xs font-bold uppercase text-cabeus-ink"
                        >
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
                        <div
                            className="aspect-video border border-cabeus-line bg-cabeus-smoke"
                            aria-hidden="true"
                        />
                    )}
                </article>
            ))}
        </div>
    );
}
