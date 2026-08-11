import type { Metadata } from "next";
import Link from "next/link";
import {
    fallbackStories,
    type HomeStory,
} from "./_data/homepage";
import { allowLocalContentFallbacks } from "./_data/contentFallbacks";
import { loadPublicTickerItems } from "./_data/marketQuotes";
import { HomepageCarousel } from "./_components/HomepageCarousel";
import { RealisticMoonBackdrop } from "./_components/RealisticMoonBackdrop";
import { LunarTimeClock } from "./_components/LunarTimeClock";
import { StockTicker } from "./_components/StockTicker";
import { potomacBrand } from "./_data/brand";
import {
    absoluteSiteUrl,
    jsonLdScript,
    organizationJsonLd,
    siteConfig,
} from "./_data/site";
import { tierConfig } from "./_data/tiers";
import { createClient } from "../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../lib/supabase/config";
import { getProfileGateContext } from "../lib/auth/profile-completion";
import {
    loadCarouselViewer,
    loadHomepageCarousel,
    type HomepageCarouselSlide,
} from "./_data/homepageCarousel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: siteConfig.name,
    description: siteConfig.description,
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: siteConfig.name,
        description: siteConfig.description,
        url: absoluteSiteUrl("/"),
        type: "website",
    },
};

type EditorialArticleRow = {
    id: string;
    slug: string;
    title: string;
    primary_author_id: string;
    dek: string | null;
    public_summary: string | null;
    public_teaser_markdown: string | null;
    access_tier_required: string | null;
    hero_image_url: string | null;
    hero_thumbnail_url: string | null;
    hero_image_alt: string | null;
    published_at: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
});

function cleanSnippet(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    return value.replace(/[#*_`>[\]()]/g, "").replace(/\s+/g, " ").trim();
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    return dateFormatter.format(date);
}

function normalizeAccessTier(value: string | null | undefined): HomeStory["accessTier"] {
    if (value === "meridian") {
        return tierConfig.enterprise.publicName;
    }

    if (value === "scout") {
        return "Scout";
    }

    return tierConfig.explorer.publicName;
}

function articleHref(slug: string) {
    return `/news/${slug}`;
}

async function getHomepageStories(): Promise<HomeStory[]> {
    if (!hasPotomacSupabasePublicConfig()) {
        return allowLocalContentFallbacks() ? fallbackStories : [];
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("editorial_articles")
            .select(
                "id,slug,title,primary_author_id,dek,public_summary,public_teaser_markdown,access_tier_required,hero_image_url,hero_thumbnail_url,hero_image_alt,published_at"
            )
            .eq("status", "published")
            .not("primary_author_id", "is", null)
            .lte("published_at", new Date().toISOString())
            .order("published_at", { ascending: false })
            .limit(6);

        if (error || !data?.length) {
            return [];
        }

        const articleRows = data as EditorialArticleRow[];
        const [{ data: media }, { data: authors }] = await Promise.all([
            supabase
                .from("editorial_media_assets")
                .select("article_id,public_url,thumbnail_url,alt_text,media_type,sort_order")
                .in("article_id", articleRows.map((article) => article.id))
                .eq("media_type", "image")
                .order("sort_order"),
            supabase
                .from("editorial_authors")
                .select("id,display_name,slug")
                .in(
                    "id",
                    articleRows.map((article) => article.primary_author_id)
                ),
        ]);
        const authorById = new Map(
            (authors ?? []).map((author) => [author.id, author])
        );
        const firstImageByArticle = new Map<string, { url: string; alt: string }>();
        for (const asset of media ?? []) {
            if (!firstImageByArticle.has(asset.article_id)) {
                firstImageByArticle.set(asset.article_id, {
                    url: asset.thumbnail_url ?? asset.public_url,
                    alt: asset.alt_text ?? "Article photograph",
                });
            }
        }

        return articleRows.map((article) => {
            const author = authorById.get(article.primary_author_id);
            const summary =
                cleanSnippet(article.public_summary) ||
                cleanSnippet(article.dek) ||
                "Published Cabeus Explorer intelligence brief.";
            const snippet =
                cleanSnippet(article.public_teaser_markdown) ||
                cleanSnippet(article.dek) ||
                summary;

            return {
                title: article.title,
                summary,
                snippet,
                href: articleHref(article.slug),
                publishedAt: article.published_at ?? new Date().toISOString(),
                accessTier: normalizeAccessTier(article.access_tier_required),
                sourceLabel: author?.display_name ?? "Cabeus Explorer",
                authorSlug: author?.slug,
                imageUrl: article.hero_thumbnail_url ?? article.hero_image_url ?? firstImageByArticle.get(article.id)?.url,
                imageAlt: article.hero_image_alt ?? firstImageByArticle.get(article.id)?.alt,
            };
        });
    } catch {
        return [];
    }
}

function SectionHeading({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow: string;
    title: string;
    description: string;
    action?: { href: string; label: string };
}) {
    return (
        <div className="flex flex-col gap-5 border-b border-cabeus-line pb-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
                <p className="brand-kicker">{eyebrow}</p>
                <h2 className="mt-3 max-w-[18ch] font-serif text-4xl font-medium leading-[0.98] text-cabeus-ink md:text-6xl">
                    {title}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-cabeus-muted">
                    {description}
                </p>
            </div>
            {action ? (
                <Link
                    href={action.href}
                    className="brand-button brand-button-outline inline-flex shrink-0 self-start md:self-end"
                >
                    {action.label}
                </Link>
            ) : null}
        </div>
    );
}

function StoryMeta({ story }: { story: HomeStory }) {
    return (
        <div className="flex flex-wrap items-center gap-3 font-mono text-[0.64rem] font-semibold uppercase text-cabeus-muted">
            {story.authorSlug ? (
                <Link
                    href={`/authors/${story.authorSlug}`}
                    className="text-cabeus-bronze underline decoration-cabeus-gold/60 underline-offset-4 hover:text-cabeus-ink"
                >
                    {story.sourceLabel}
                </Link>
            ) : (
                <span className="text-cabeus-bronze">{story.sourceLabel}</span>
            )}
            <time dateTime={story.publishedAt}>{formatDate(story.publishedAt)}</time>
            <span>{story.accessTier}+ full story</span>
        </div>
    );
}

function StoryCard({ story }: { story: HomeStory }) {
    return (
        <article className="flex min-w-0 flex-col border-t border-cabeus-line pt-5 md:border-l md:border-t-0 md:px-6 md:pt-0 md:first:border-l-0 md:first:pl-0">
            <StoryMeta story={story} />
            <Link
                href={story.href}
                className="group mt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cabeus-gold"
            >
                <h3 className="font-serif text-3xl font-medium leading-[1.02] text-cabeus-ink group-hover:underline">
                    {story.title}
                </h3>
            </Link>
            <Link
                href={story.href}
                aria-label={`Read ${story.title}`}
                className="mt-4 text-sm leading-6 text-cabeus-muted hover:text-cabeus-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cabeus-gold"
            >
                {story.summary}
            </Link>
            {story.imageUrl ? (
                <img
                    src={story.imageUrl}
                    alt={story.imageAlt ?? ""}
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="mt-6 aspect-[16/10] w-full bg-cabeus-smoke object-cover"
                />
            ) : null}
        </article>
    );
}

export default async function HomePage() {
    const [stories, tickerItems] = await Promise.all([
        getHomepageStories(),
        loadPublicTickerItems(10),
    ]);
    const featuredStory = stories[0];
    const latestStories = stories.slice(1);
    let carouselSlides: HomepageCarouselSlide[] = [];
    if (hasPotomacSupabasePublicConfig()) {
        try {
            const supabase = await createClient();
            const gate = await getProfileGateContext({ supabase, nextPath: "/" });
            const carouselViewer = await loadCarouselViewer(supabase, gate.state, gate.userId);
            carouselSlides = await loadHomepageCarousel(supabase, carouselViewer);
        } catch {
            carouselSlides = [];
        }
    }
    if (!carouselSlides.length && featuredStory) {
        carouselSlides = [{
            id: "homepage-editorial-record",
            articleId: null,
            slideType: "anonymous_teaser",
            title: featuredStory.title,
            summary: featuredStory.summary || siteConfig.description,
            visualAssetUrl: featuredStory.imageUrl ?? potomacBrand.assets.cabeusHero,
            visualAssetAlt: featuredStory.imageAlt ?? "Lunar industrial base under a crescent moon",
            ctaLabel: "Full story",
            ctaRoute: featuredStory.href,
            minimumTier: "public",
            isRequired: true,
            isPinned: true,
            displayRank: 0,
            sourceNote: "Current approved editorial record.",
            freshnessAt: featuredStory.publishedAt,
            expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        }];
    }
    const headlineItemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${siteConfig.name} public headline feed`,
        itemListElement: stories.slice(0, 6).map((story, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteSiteUrl(story.href),
            name: story.title,
            description: story.summary,
        })),
    };
    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: organizationJsonLd(),
    };

    return (
        <div className="bg-cabeus-paper text-cabeus-ink">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(websiteJsonLd),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(headlineItemListJsonLd),
                }}
            />
            <StockTicker items={tickerItems} />
            <section className="relative min-h-[34rem] overflow-hidden border-b border-cabeus-line bg-cabeus-paper md:min-h-[40rem]">
                <RealisticMoonBackdrop />
                <div className="relative mx-auto flex min-h-[34rem] w-full max-w-[92rem] items-center px-5 py-12 md:min-h-[40rem] md:px-10">
                    <div className="max-w-[62rem]">
                        <p className="brand-kicker">Cabeus Explorer</p>
                        <h1 className="mt-6 max-w-[16ch] text-balance font-serif text-[clamp(3.75rem,7.25vw,7.75rem)] font-medium leading-[0.9] text-cabeus-ink">
                            Clarity in the New Space Age.
                        </h1>
                        <p className="mt-8 max-w-3xl text-base leading-7 text-cabeus-muted md:text-lg md:leading-8">
                            Cabeus Explorer is the leading platform providing trusted intelligence and proprietary data for space industrialists securing, financing and building the lunar economy (and beyond).
                        </p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link href="/archives" className="brand-button inline-flex">
                                Start reading
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <LunarTimeClock initialUtcIso={new Date().toISOString()} />

            <section className="border-b border-cabeus-line">
                <div className="mx-auto w-full max-w-[92rem] px-5 py-10 md:px-10 md:py-14">
                    <div>
                        {carouselSlides.length ? (
                            <HomepageCarousel slides={carouselSlides} />
                        ) : (
                            <section className="flex min-h-[20rem] items-center border-b border-cabeus-line py-10">
                                <div>
                                    <p className="brand-kicker">Cabeus newsroom</p>
                                    <h3 className="mt-4 font-serif text-5xl text-cabeus-ink">
                                        News feed temporarily unavailable
                                    </h3>
                                    <p className="mt-4 max-w-xl text-cabeus-muted">
                                        Approved stories will return when the editorial feed is
                                        available.
                                    </p>
                                </div>
                            </section>
                        )}
                    </div>
                    <div className="mt-8 grid gap-0 md:grid-cols-3">
                        {latestStories.slice(0, 3).map((story) => (
                            <StoryCard key={`latest-${story.title}`} story={story} />
                        ))}
                    </div>
                    <Link href="/archives" className="brand-button brand-button-outline mt-8 inline-flex">
                        View archive
                    </Link>
                </div>
            </section>

            <section className="mx-auto w-full max-w-[92rem] px-5 py-10 md:px-10 md:py-14">
                <SectionHeading
                    eyebrow="The Cabeus Council"
                    title="Intelligence built for your advantage."
                    description="Choose the visibility and support that matches your operating tempo, from daily sector awareness to private briefings and team-level advisory access."
                    action={{ href: "/pricing", label: "Explore membership" }}
                />
            </section>
        </div>
    );
}
