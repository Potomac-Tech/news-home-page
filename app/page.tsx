import type { Metadata } from "next";
import Link from "next/link";
import {
    fallbackStories,
    type HomeStory,
} from "./_data/homepage";
import { allowLocalContentFallbacks } from "./_data/contentFallbacks";
import { loadPublicTickerItems } from "./_data/marketQuotes";
import { SponsorUnit } from "./_components/SponsorUnit";
import { EconomySummaryWidget } from "./_components/EconomySummaryWidget";
import { HomepageCarousel } from "./_components/HomepageCarousel";
import { LunarTimeClock } from "./_components/LunarTimeClock";
import { StockTicker } from "./_components/StockTicker";
import {
    loadSponsorUnits,
    sponsorPlacementKeys,
} from "./_data/sponsorAds";
import { loadPublicEconomySummary } from "./_data/economy";
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
import { loadHomepageLaunchSummary, type HomepageLaunchSummary } from "./_data/homepageLaunchSummary";

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
    hero_image_alt: string | null;
    published_at: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
});

const membershipTiers = [
    {
        tier: tierConfig.explorer.publicName,
        price: tierConfig.explorer.price,
        detail: "Free default membership for verified readers who complete their profile.",
        features: ["Public-story full bodies", "Community access", "Tracker previews"],
        href: "/request-access",
        cta: "Start free",
    },
    {
        tier: tierConfig.scout.publicName,
        price: `${tierConfig.scout.price}/user/year`,
        detail: "Paid professional intelligence for deeper lunar market workflows.",
        features: ["Everything in Explorer", "Exports and alerts", "Advanced dashboards"],
        href: "/upgrade?tier=scout&source=homepage&content=membership&object=scout&next=%2Fmember&campaign=homepage-tiers",
        cta: "Upgrade",
    },
    {
        tier: tierConfig.enterprise.publicName,
        price: tierConfig.enterprise.price,
        detail: "Organization-level intelligence through manual review and contract discussion.",
        features: ["Everything in Scout", "Private briefings", "Team access"],
        href: "/upgrade?tier=meridian&source=homepage&content=membership&object=meridian&next=%2Fmember&campaign=homepage-tiers",
        cta: "Discuss access",
    },
];

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
                "id,slug,title,primary_author_id,dek,public_summary,public_teaser_markdown,access_tier_required,hero_image_url,hero_image_alt,published_at"
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
                .select("article_id,public_url,alt_text,media_type,sort_order")
                .in("article_id", articleRows.map((article) => article.id))
                .eq("media_type", "image")
                .order("sort_order"),
            supabase
                .from("editorial_authors")
                .select("id,display_name")
                .in(
                    "id",
                    articleRows.map((article) => article.primary_author_id)
                ),
        ]);
        const authorById = new Map(
            (authors ?? []).map((author) => [author.id, author.display_name])
        );
        const firstImageByArticle = new Map<string, { url: string; alt: string }>();
        for (const asset of media ?? []) {
            if (!firstImageByArticle.has(asset.article_id)) {
                firstImageByArticle.set(asset.article_id, {
                    url: asset.public_url,
                    alt: asset.alt_text ?? "Article photograph",
                });
            }
        }

        return articleRows.map((article) => {
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
                sourceLabel:
                    authorById.get(article.primary_author_id) ?? "Cabeus Explorer",
                imageUrl: article.hero_image_url ?? firstImageByArticle.get(article.id)?.url,
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
            <span className="text-cabeus-bronze">{story.sourceLabel}</span>
            <time dateTime={story.publishedAt}>{formatDate(story.publishedAt)}</time>
            <span>{story.accessTier}+ full story</span>
        </div>
    );
}

function StoryCard({ story }: { story: HomeStory }) {
    return (
        <article className="flex min-w-0 flex-col border-t border-cabeus-line pt-5 md:border-l md:border-t-0 md:px-6 md:pt-0 md:first:border-l-0 md:first:pl-0">
            <StoryMeta story={story} />
            <h3 className="mt-4 font-serif text-3xl font-medium leading-[1.02] text-cabeus-ink">
                {story.title}
            </h3>
            <p className="mt-4 text-sm leading-6 text-cabeus-muted">
                {story.summary}
            </p>
            {story.imageUrl ? (
                <img
                    src={story.imageUrl}
                    alt={story.imageAlt ?? ""}
                    className="mt-6 aspect-[16/10] w-full bg-cabeus-smoke object-cover"
                />
            ) : null}
            <Link
                href={story.href}
                className="mt-6 inline-flex self-start border-b border-cabeus-gold pb-1 font-mono text-[0.64rem] font-bold uppercase text-cabeus-ink hover:text-cabeus-gold"
            >
                Full story →
            </Link>
        </article>
    );
}

export default async function HomePage() {
    const [stories, sponsorUnits, tickerItems, economySummary] = await Promise.all([
        getHomepageStories(),
        loadSponsorUnits([
            sponsorPlacementKeys.homepageLeadRail,
            sponsorPlacementKeys.marketModuleBand,
        ]),
        loadPublicTickerItems(10),
        loadPublicEconomySummary(),
    ]);
    const featuredStory = stories[0];
    const latestStories = stories.slice(1);
    let carouselSlides: HomepageCarouselSlide[] = [];
    let launchSummary: HomepageLaunchSummary = { reviewedCount: 0, lunarCount: 0, freshnessAt: null, weekStart: "", timeZone: "UTC" };
    let launchHref = "/request-access?next=%2Ftracker%2Flaunches";
    let launchCta = "Request access";
    if (hasPotomacSupabasePublicConfig()) {
        try {
            const supabase = await createClient();
            const gate = await getProfileGateContext({ supabase, nextPath: "/" });
            const carouselViewer = await loadCarouselViewer(supabase, gate.state, gate.userId);
            carouselSlides = await loadHomepageCarousel(supabase, carouselViewer);
            const timeZone = gate.state === "ready" ? gate.profile.timezone : "UTC";
            launchSummary = await loadHomepageLaunchSummary(supabase, timeZone);
            const trackerContext = `week=${encodeURIComponent(launchSummary.weekStart)}&timezone=${encodeURIComponent(timeZone)}`;
            if (gate.state === "ready") { launchHref = `/tracker/launches?${trackerContext}`; launchCta = "Open tracker"; }
            else if (gate.state === "email_unverified") { launchHref = `/account/verify?next=${encodeURIComponent(`/tracker/launches?${trackerContext}`)}`; launchCta = "Verify email"; }
            else if (gate.state === "profile_incomplete") { launchHref = `/account/profile/complete?next=${encodeURIComponent(`/tracker/launches?${trackerContext}`)}`; launchCta = "Complete profile"; }
            else { launchHref = `/request-access?next=${encodeURIComponent(`/tracker/launches?${trackerContext}`)}`; }
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
    const homepageSponsorUnits = [
        sponsorUnits.get(sponsorPlacementKeys.homepageLeadRail)!,
        sponsorUnits.get(sponsorPlacementKeys.marketModuleBand)!,
    ];
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
            <section className="relative min-h-[38rem] overflow-hidden border-b border-cabeus-line md:min-h-[45rem]">
                <img
                    src={potomacBrand.assets.editorialMoonHero}
                    alt="Detailed Moon emerging from a warm ivory field"
                    className="absolute inset-0 h-full w-full object-cover object-[62%_center] opacity-45 sm:object-center sm:opacity-100"
                    fetchPriority="high"
                />
                <div className="relative mx-auto flex min-h-[38rem] w-full max-w-[92rem] items-center px-5 py-16 md:min-h-[45rem] md:px-10">
                    <div className="max-w-[42rem]">
                        <p className="brand-kicker">Independent intelligence</p>
                        <h1 className="mt-6 max-w-[11ch] font-serif text-[clamp(4.25rem,8vw,8.75rem)] font-medium leading-[0.79] text-cabeus-ink">
                            Clarity in the New Space Age.
                        </h1>
                        <p className="mt-8 max-w-xl text-base leading-7 text-cabeus-muted md:text-lg md:leading-8">
                            Trusted intelligence, proprietary data, and strategic context
                            for the leaders shaping what comes next.
                        </p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link href="/archives" className="brand-button inline-flex">
                                Start reading
                            </Link>
                            <Link href="/terminal" className="brand-button brand-button-outline inline-flex">
                                Our intelligence
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <StockTicker items={tickerItems} />
            <LunarTimeClock initialUtcIso={new Date().toISOString()} />

            <section className="border-b border-cabeus-line">
                <div className="mx-auto w-full max-w-[92rem] px-5 py-16 md:px-10 md:py-24">
                    <div className="flex items-end justify-between border-b border-cabeus-line pb-5">
                        <div>
                            <p className="brand-kicker">Latest reporting</p>
                            <h2 className="mt-3 font-serif text-5xl font-medium leading-none md:text-7xl">
                                Latest Intelligence
                            </h2>
                        </div>
                        <Link href="/archives" className="brand-button brand-button-outline hidden sm:inline-flex">
                            View archive
                        </Link>
                    </div>
                    <div className="mt-4">
                        {carouselSlides.length ? (
                            <HomepageCarousel slides={carouselSlides} />
                        ) : (
                            <section className="flex min-h-[26rem] items-center border-b border-cabeus-line py-16">
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
                    <Link href="/archives" className="brand-button brand-button-outline mt-8 sm:hidden">
                        View archive
                    </Link>
                </div>
            </section>

            <section aria-label="Lunar economy activity" className="border-b border-cabeus-line bg-cabeus-ink text-cabeus-paper">
                <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-5 py-5 md:px-10 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="font-mono text-[0.62rem] font-bold uppercase text-cabeus-gold">Mission pulse</span>
                        <span className="font-serif text-2xl text-cabeus-paper">{launchSummary.reviewedCount} reviewed</span>
                        <span className="font-mono text-[0.62rem] uppercase text-cabeus-paper/75">{launchSummary.lunarCount} lunar / cislunar</span>
                        <span className="font-mono text-[0.58rem] uppercase text-cabeus-paper/70">
                            {launchSummary.freshnessAt
                                ? `Updated ${new Date(launchSummary.freshnessAt).toLocaleString()}`
                                : "No reviewed records in the current window"}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <Link prefetch={false} href={launchHref} className="font-mono text-[0.62rem] font-bold uppercase text-cabeus-gold">{launchCta}</Link>
                        <Link prefetch={false} href="/upgrade?tier=scout&source=homepage&content=launch-tools&next=%2Ftracker%2Flaunches" className="font-mono text-[0.62rem] font-bold uppercase text-cabeus-paper/60">Values & exports</Link>
                    </div>
                </div>
            </section>

            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-[92rem] gap-12 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
                    <div>
                        <p className="brand-kicker">Cabeus intelligence</p>
                        <h2 className="mt-4 max-w-[12ch] font-serif text-5xl font-medium leading-[0.94] md:text-7xl">
                            Proprietary Data. Independent Analysis. Strategic Advantage.
                        </h2>
                        <p className="mt-6 max-w-xl text-base leading-7 text-cabeus-muted">
                            A disciplined operating picture for the lunar economy, built
                            from reviewed sources, transparent assumptions, and analyst
                            judgment.
                        </p>
                        <img
                            src={potomacBrand.assets.cabeusHero}
                            alt="Lunar industrial infrastructure under a crescent Moon"
                            className="mt-10 aspect-[16/11] w-full object-cover"
                        />
                    </div>
                    <div className="border-t border-cabeus-line pt-6">
                        <p className="brand-kicker">Daily market model</p>
                        <h3 className="mt-3 font-serif text-5xl font-medium">
                            The Lunar Economy
                        </h3>
                        <EconomySummaryWidget summary={economySummary} />
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-[92rem] px-5 py-16 md:px-10 md:py-24">
                <SectionHeading
                    eyebrow="The Cabeus Council"
                    title="Intelligence built for your advantage."
                    description="Choose the visibility and support that matches your operating tempo, from daily sector awareness to private briefings and team-level advisory access."
                    action={{ href: "/pricing", label: "Explore membership" }}
                />
                <div className="mt-10 grid border-y border-cabeus-line lg:grid-cols-3">
                    {membershipTiers.map((tier) => (
                        <article
                            key={tier.tier}
                            className="border-b border-cabeus-line py-8 lg:border-b-0 lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0"
                        >
                            <div className="flex items-baseline justify-between gap-4">
                                <h3 className="font-serif text-4xl text-cabeus-ink">
                                    {tier.tier}
                                </h3>
                                <p className="font-mono text-xs font-bold uppercase text-cabeus-muted">
                                    {tier.price}
                                </p>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-cabeus-muted">
                                {tier.detail}
                            </p>
                            <ul className="mt-6 space-y-2 text-sm leading-5 text-cabeus-ink/75">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex gap-2">
                                        <span className="mt-2 h-1 w-1 bg-cabeus-gold" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={tier.href}
                                className="brand-button brand-button-outline mt-7 inline-flex"
                            >
                                {tier.cta}
                            </Link>
                        </article>
                    ))}
                </div>
                <div className="mt-12 grid gap-5 md:grid-cols-2">
                    {homepageSponsorUnits.map((unit) => (
                        <SponsorUnit key={unit.placementKey} unit={unit} />
                    ))}
                </div>
            </section>
        </div>
    );
}
