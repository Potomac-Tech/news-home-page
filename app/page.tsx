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
                "id,slug,title,dek,public_summary,public_teaser_markdown,access_tier_required,hero_image_url,hero_image_alt,published_at"
            )
            .eq("status", "published")
            .lte("published_at", new Date().toISOString())
            .order("published_at", { ascending: false })
            .limit(6);

        if (error || !data?.length) {
            return [];
        }

        const articleRows = data as EditorialArticleRow[];
        const { data: media } = await supabase
            .from("editorial_media_assets")
            .select("article_id,public_url,alt_text,media_type,sort_order")
            .in("article_id", articleRows.map((article) => article.id))
            .eq("media_type", "image")
            .order("sort_order");
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
                sourceLabel: "Editorial desk",
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
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
                <p className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold">
                    {eyebrow}
                </p>
                <h2 className="mt-2 font-serif text-3xl uppercase leading-tight text-white md:text-4xl">
                    {title}
                </h2>
                <p className="mt-4 text-base leading-7 text-potomac-cream/68">
                    {description}
                </p>
            </div>
            {action ? (
                <Link
                    href={action.href}
                    className="shrink-0 self-start border border-potomac-regolith/40 px-4 py-2 font-mono text-[0.68rem] font-bold uppercase text-potomac-regolith transition hover:border-potomac-gold hover:text-potomac-gold md:self-end"
                >
                    {action.label}
                </Link>
            ) : null}
        </div>
    );
}

function StoryMeta({ story }: { story: HomeStory }) {
    return (
        <div className="flex flex-wrap items-center gap-3 font-mono text-[0.68rem] font-bold uppercase text-potomac-cream/48">
            <span className="text-potomac-gold">{story.sourceLabel}</span>
            <time dateTime={story.publishedAt}>{formatDate(story.publishedAt)}</time>
            <span>{story.accessTier}+ full story</span>
        </div>
    );
}

function StoryCard({ story }: { story: HomeStory }) {
    return (
        <article className="flex min-w-0 flex-col border-l border-potomac-regolith/25 px-5 first:border-l-0 first:pl-0">
            <StoryMeta story={story} />
            <h3 className="mt-3 font-serif text-2xl uppercase leading-snug text-white">
                {story.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/72">
                {story.summary}
            </p>
            {story.imageUrl ? (
                <img
                    src={story.imageUrl}
                    alt={story.imageAlt ?? ""}
                    className="mt-5 h-44 w-full bg-potomac-primary object-cover"
                />
            ) : null}
            <Link
                href={story.href}
                className="mt-5 inline-flex self-start font-mono text-[0.68rem] font-bold uppercase text-potomac-gold hover:text-potomac-cream"
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
    } else if (featuredStory) {
        const editorialLead: HomepageCarouselSlide = {
            id: "homepage-editorial-lead",
            articleId: null,
            slideType: "morning_read",
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
            sourceNote: "Current homepage editorial lead.",
            freshnessAt: featuredStory.publishedAt,
            expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        };
        carouselSlides = [
            editorialLead,
            ...carouselSlides.filter((slide) => slide.ctaRoute !== editorialLead.ctaRoute),
        ].slice(0, 5);
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
        <div className="bg-grid-pattern">
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
            <LunarTimeClock initialUtcIso={new Date().toISOString()} />
            <StockTicker items={tickerItems} />

            <section className="border-b border-potomac-regolith/20 bg-potomac-secondary text-potomac-cream">
                <div className="mx-auto grid w-full max-w-[92rem] lg:grid-cols-[17rem_minmax(0,1fr)_19rem]">
                    <aside className="order-2 border-potomac-regolith/20 px-5 py-8 lg:order-1 lg:border-r lg:py-10">
                        <div className="flex items-center justify-between border-b border-potomac-regolith/25 pb-4">
                            <h2 className="font-serif text-2xl uppercase text-white">Recent stories</h2>
                            <Link href="/news" className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">All</Link>
                        </div>
                        <div>
                            {latestStories.slice(0, 4).map((story) => (
                                <article key={`recent-${story.title}`} className="border-b border-potomac-regolith/20 py-5">
                                    <p className="font-mono text-[0.6rem] font-bold uppercase text-potomac-gold">{story.sourceLabel}</p>
                                    <Link href={story.href} className="mt-2 block font-serif text-lg uppercase leading-5 text-potomac-cream hover:text-potomac-gold">{story.title}</Link>
                                    <time dateTime={story.publishedAt} className="mt-3 block font-mono text-[0.6rem] uppercase text-potomac-regolith">{formatDate(story.publishedAt)}</time>
                                </article>
                            ))}
                        </div>
                    </aside>

                    <div className="order-1 bg-potomac-primary lg:order-2">
                        {carouselSlides.length ? (
                            <HomepageCarousel slides={carouselSlides} />
                        ) : (
                            <section className="flex min-h-[500px] items-center px-8 py-16">
                                <div>
                                    <p className="font-mono text-xs font-bold uppercase text-potomac-gold">
                                        Editorial desk
                                    </p>
                                    <h1 className="mt-4 font-serif text-4xl uppercase text-white">
                                        News feed temporarily unavailable
                                    </h1>
                                    <p className="mt-4 max-w-xl text-potomac-cream/70">
                                        Approved stories will return when the editorial
                                        feed is available.
                                    </p>
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="order-3 space-y-4 border-potomac-regolith/20 px-5 py-8 lg:border-l lg:py-10">
                        <section className="border border-potomac-regolith/25 bg-potomac-primary/55 p-5">
                            <p className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">Cabeus in your inbox</p>
                            <h2 className="mt-3 font-serif text-2xl uppercase text-white">The lunar brief</h2>
                            <p className="mt-3 text-sm leading-5 text-potomac-cream/70">Headlines, program movement, and lunar market intelligence for approved members.</p>
                            <Link href="/request-access" className="mt-5 inline-flex bg-potomac-gold px-4 py-2 font-mono text-[0.64rem] font-bold uppercase text-potomac-primary">Join Explorer</Link>
                        </section>
                        <section className="border border-potomac-gold/55 bg-potomac-primary/70 p-5">
                            <p className="font-serif text-2xl uppercase text-white">Cabeus Scout</p>
                            <p className="mt-3 text-sm leading-5 text-potomac-cream/70">Research, proprietary datasets, alerts, exports, and advanced lunar dashboards.</p>
                            <Link href="/pricing" className="mt-5 inline-flex font-mono text-[0.64rem] font-bold uppercase text-potomac-gold">Get access →</Link>
                        </section>
                    </aside>
                </div>
            </section>

            <section aria-label="Lunar economy activity" className="border-b border-potomac-regolith/20 bg-potomac-primary">
                <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-4 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">Mission pulse</span>
                        <span className="font-serif text-xl uppercase text-white">{launchSummary.reviewedCount} reviewed</span>
                        <span className="font-mono text-[0.62rem] uppercase text-emerald-200/70">{launchSummary.lunarCount} lunar / cislunar</span>
                        <span className="font-mono text-[0.58rem] uppercase text-potomac-regolith">
                            {launchSummary.freshnessAt
                                ? `Updated ${new Date(launchSummary.freshnessAt).toLocaleString()}`
                                : "No reviewed records in the current window"}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <Link prefetch={false} href={launchHref} className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">{launchCta}</Link>
                        <Link prefetch={false} href="/upgrade?tier=scout&source=homepage&content=launch-tools&next=%2Ftracker%2Flaunches" className="font-mono text-[0.62rem] font-bold uppercase text-potomac-cream/60">Values & exports</Link>
                    </div>
                </div>
            </section>

            <section className="border-b border-potomac-regolith/20 bg-potomac-secondary">
                <div className="mx-auto w-full max-w-[92rem] px-4 py-10 md:px-8">
                    <div className="flex items-end justify-between border-b border-potomac-regolith/25 pb-4">
                        <h2 className="font-serif text-3xl uppercase text-white">Top reads</h2>
                        <Link href="/news" className="font-mono text-[0.64rem] font-bold uppercase text-potomac-gold">Latest intelligence →</Link>
                    </div>
                    <div className="mt-6 grid gap-y-8 md:grid-cols-3">
                        {latestStories.slice(0, 3).map((story) => (
                            <StoryCard key={`top-${story.title}`} story={story} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-b border-potomac-regolith/20 bg-potomac-primary/78">
                <div className="mx-auto w-full max-w-[92rem] px-4 py-10 md:px-8">
                    <div className="flex items-end justify-between border-b border-potomac-regolith/25 pb-4">
                        <div>
                            <p className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold">Market model</p>
                            <h2 className="mt-2 font-serif text-3xl uppercase text-white">Lunar economy</h2>
                        </div>
                    </div>
                    <div className="mt-6 max-w-3xl">
                        <EconomySummaryWidget summary={economySummary} />
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-[92rem] px-4 py-10 md:px-8">
                <SectionHeading
                    eyebrow="Membership intelligence"
                    title="Built for your advantage"
                    description="Choose the visibility level that matches your operating tempo, from daily sector awareness to private briefings and team-level advisory access."
                    action={{ href: "/pricing", label: "Compare tiers" }}
                />
                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                    {membershipTiers.map((tier) => (
                        <article
                            key={tier.tier}
                            className="border border-potomac-regolith/20 bg-potomac-primary/72 p-5"
                        >
                            <div className="flex items-baseline justify-between gap-4">
                                <h3 className="font-serif text-2xl uppercase text-white">
                                    {tier.tier}
                                </h3>
                                <p className="font-mono text-sm font-bold text-potomac-cream">
                                    {tier.price}
                                </p>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                {tier.detail}
                            </p>
                            <ul className="mt-5 space-y-2 text-sm leading-5 text-potomac-cream/68">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex gap-2">
                                        <span className="mt-2 h-1 w-1 bg-potomac-gold" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={tier.href}
                                className="mt-6 inline-flex w-full justify-center border border-potomac-gold/55 px-4 py-2 font-mono text-[0.68rem] font-bold uppercase text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                {tier.cta}
                            </Link>
                        </article>
                    ))}
                </div>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                    {homepageSponsorUnits.map((unit) => (
                        <SponsorUnit key={unit.placementKey} unit={unit} />
                    ))}
                </div>
            </section>
        </div>
    );
}
