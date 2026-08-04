import type { Metadata } from "next";
import { absoluteSiteUrl, jsonLdScript, siteConfig } from "../_data/site";
import { ApolloMoonBackdrop } from "../_components/ApolloMoonBackdrop";
import { EditorialArchiveList } from "../_components/EditorialArchiveList";
import { loadEditorialArchive } from "../_data/editorialArchive";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
    const path = "/archives";
    const description = "Cabeus Explorer is the permanent record of the Moon (and beyond).";
    return {
        title: "News",
        description,
        alternates: { canonical: path },
        openGraph: {
            title: "News | Cabeus Explorer",
            description,
            url: absoluteSiteUrl(path),
            siteName: siteConfig.name,
            type: "website",
        },
    };
}

export default async function ArchivesPage() {
    const articles = await loadEditorialArchive("news");
    const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Cabeus Explorer news",
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
                <ApolloMoonBackdrop />
                <div className="relative mx-auto flex min-h-[28rem] w-full max-w-[92rem] flex-col justify-end px-5 pb-12 pt-16 md:px-10">
                    <p className="brand-kicker">
                        Lunar intelligence record / {articles.length} published
                    </p>
                    <h1 className="mt-4 max-w-4xl font-serif text-6xl font-medium leading-[0.9] text-cabeus-ink md:text-8xl">
                        News
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-cabeus-muted">
                        Cabeus Explorer is the permanent record of the Moon (and beyond).
                    </p>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[92rem] px-5 py-12 md:px-10 md:py-16">
                <EditorialArchiveList articles={articles} sectionLabel="News" displayMode="news" />
            </main>
        </div>
    );
}
