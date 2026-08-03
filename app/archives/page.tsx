import type { Metadata } from "next";
import Link from "next/link";
import { absoluteSiteUrl, jsonLdScript, siteConfig } from "../_data/site";
import { ApolloMoonBackdrop } from "../_components/ApolloMoonBackdrop";
import { EditorialArchiveList } from "../_components/EditorialArchiveList";
import { loadEditorialArchive } from "../_data/editorialArchive";
import {
    editorialSections,
} from "../../lib/editorial/section-tags";

export const dynamic = "force-dynamic";

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

export default async function ArchivesPage({
    searchParams,
}: {
    searchParams: Promise<{ section?: string }>;
}) {
    const section = selectedSection((await searchParams).section);
    const articles = await loadEditorialArchive(section.slug);
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
                <ApolloMoonBackdrop />
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

                <EditorialArchiveList articles={articles} sectionLabel={section.label} />
            </main>
        </div>
    );
}
