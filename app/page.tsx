import type { Metadata } from "next";
import Link from "next/link";
import {
    eventTeasers,
    fallbackStories,
    type HomeStory,
} from "./_data/homepage";
import { loadPublicTickerItems } from "./_data/marketQuotes";
import { SponsorUnit } from "./_components/SponsorUnit";
import { EconomySummaryWidget } from "./_components/EconomySummaryWidget";
import { HomepageCarousel } from "./_components/HomepageCarousel";
import { LunarTimeClock } from "./_components/LunarTimeClock";
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
    slug: string;
    title: string;
    dek: string | null;
    public_summary: string | null;
    public_teaser_markdown: string | null;
    access_tier_required: string | null;
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
    if (value === "command") {
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
        return fallbackStories;
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("editorial_articles")
            .select(
                "slug,title,dek,public_summary,public_teaser_markdown,access_tier_required,published_at"
            )
            .eq("status", "published")
            .lte("published_at", new Date().toISOString())
            .order("published_at", { ascending: false })
            .limit(6);

        if (error || !data?.length) {
            return fallbackStories;
        }

        return ((data ?? []) as EditorialArticleRow[]).map((article) => {
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
            };
        });
    } catch {
        return fallbackStories;
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
            <span>{story.accessTier}+ full brief</span>
        </div>
    );
}

function StoryCard({ story }: { story: HomeStory }) {
    return (
        <article className="border border-potomac-regolith/20 bg-potomac-primary/72 p-5">
            <StoryMeta story={story} />
            <h3 className="mt-4 font-serif text-2xl uppercase leading-snug text-white">
                {story.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/72">
                {story.summary}
            </p>
            <p className="mt-4 border-l border-potomac-gold/45 pl-4 text-sm leading-6 text-potomac-cream/56">
                {story.snippet}
            </p>
            <Link
                href={story.href}
                className="mt-6 inline-flex border border-potomac-gold/45 px-4 py-2 font-mono text-[0.68rem] font-bold uppercase text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
            >
                Read brief
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
        loadPublicTickerItems(4),
        loadPublicEconomySummary(),
    ]);
    const featuredStory = stories[0] ?? fallbackStories[0];
    const latestStories = stories.slice(1).length ? stories.slice(1) : fallbackStories.slice(1);
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
    if (!carouselSlides.length) {
        carouselSlides = [{
            id: "homepage-static-fallback",
            articleId: null,
            slideType: "anonymous_teaser",
            title: potomacBrand.identity.name,
            summary: featuredStory.summary || siteConfig.description,
            visualAssetUrl: potomacBrand.assets.cabeusHero,
            visualAssetAlt: "Lunar industrial base under a crescent moon",
            ctaLabel: "Read the brief",
            ctaRoute: featuredStory.href,
            minimumTier: "public",
            isRequired: true,
            isPinned: true,
            displayRank: 0,
            sourceNote: "Static homepage fallback.",
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
            <HomepageCarousel slides={carouselSlides} />
            <LunarTimeClock initialUtcIso={new Date().toISOString()} />

            <section aria-label="Lunar economy activity" className="border-b border-potomac-regolith/20 bg-potomac-primary/90">
                <div className="mx-auto w-full max-w-[92rem] px-4 py-4 md:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 border border-potomac-regolith/20 bg-potomac-secondary/45 p-4">
                        <div>
                            <p className="font-mono text-[0.62rem] font-bold uppercase text-potomac-regolith">Reviewed launches tracked</p>
                            <p className="mt-2 font-serif text-2xl uppercase text-white md:text-3xl">{launchSummary.reviewedCount}</p>
                            <p className="mt-1 font-mono text-[0.64rem] uppercase text-emerald-200/70">{launchSummary.lunarCount} lunar / cislunar</p>
                            <p className="mt-1 font-mono text-[0.58rem] uppercase text-potomac-regolith">Freshness: {launchSummary.freshnessAt ? new Date(launchSummary.freshnessAt).toLocaleString() : "No reviewed launch records in the current window"}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link prefetch={false} href={launchHref} className="font-mono text-[0.62rem] font-bold uppercase text-potomac-gold hover:text-potomac-cream">{launchCta}</Link>
                            <Link prefetch={false} href="/upgrade?tier=scout&source=homepage&content=launch-tools&next=%2Ftracker%2Flaunches" className="font-mono text-[0.62rem] font-bold uppercase text-potomac-cream/60 hover:text-potomac-gold">Values & exports</Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-potomac-regolith/20 bg-potomac-primary/82">
                <div className="mx-auto w-full max-w-[92rem] px-4 py-10 md:px-8">
                    <div>
                        <SectionHeading
                            eyebrow="Top stories"
                            title="Industrial signals moving now"
                            description="A concise public surface for the program, infrastructure, supply-chain, and capital movements that shape the lunar economy."
                            action={{ href: "/news", label: "View all stories" }}
                        />
                        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
                            <article className="border border-potomac-regolith/20 bg-potomac-secondary/72">
                                <img
                                    src={featuredStory.imageUrl ?? potomacBrand.assets.cabeusHero}
                                    alt={featuredStory.imageAlt ?? "Lunar surface construction site"}
                                    className={`h-72 w-full bg-potomac-primary ${
                                        featuredStory.imageUrl
                                            ? "object-contain"
                                            : "object-cover object-[68%_55%]"
                                    }`}
                                />
                                <div className="p-5">
                                    <StoryMeta story={featuredStory} />
                                    <h3 className="mt-4 font-serif text-3xl uppercase leading-tight text-white">
                                        {featuredStory.title}
                                    </h3>
                                    <p className="mt-4 text-sm leading-6 text-potomac-cream/72">
                                        {featuredStory.summary}
                                    </p>
                                    <Link
                                        href={featuredStory.href}
                                        className="mt-6 inline-flex bg-potomac-gold px-4 py-2 font-mono text-[0.68rem] font-bold uppercase text-potomac-primary transition hover:bg-potomac-cream"
                                    >
                                        Lead brief
                                    </Link>
                                </div>
                            </article>

                            <div className="grid gap-4">
                                {tickerItems.length ? <div className="border border-potomac-regolith/20 bg-potomac-primary/72 p-4">
                                    <p className="font-mono text-[0.65rem] font-bold uppercase text-potomac-gold">
                                        Briefing ticker
                                    </p>
                                    <div className="mt-3 space-y-3">
                                        {tickerItems.map((item) => (
                                            <div
                                                key={item.symbol}
                                                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-t border-potomac-regolith/15 pt-3"
                                            >
                                                <span className="font-mono text-xs font-bold text-potomac-gold">
                                                    {item.symbol}
                                                </span>
                                                <span className="text-sm text-potomac-cream/70">
                                                    {item.label}
                                                </span>
                                                <span className="text-right font-mono text-xs font-bold text-white">
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div> : null}
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <section className="mx-auto grid w-full max-w-[92rem] gap-8 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
                <div>
                    <SectionHeading
                        eyebrow="Latest intelligence"
                        title="Full briefs for approved members"
                        description="Public snippets keep the market surface visible while members unlock full bodies, citations, source tables, and analyst notes."
                    />
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        {latestStories.map((story) => (
                            <StoryCard key={`${story.title}-${story.publishedAt}`} story={story} />
                        ))}
                    </div>
                </div>

                <aside>
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="font-serif text-2xl uppercase text-white">
                            Event signals
                        </h2>
                        <Link
                            href="/events"
                            className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold hover:text-potomac-cream"
                        >
                            Calendar
                        </Link>
                    </div>
                    <div className="mt-5 space-y-4">
                        {eventTeasers.map((event) => (
                            <article
                                key={event.name}
                                className="border border-potomac-regolith/20 bg-potomac-primary/64 p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="font-serif text-xl uppercase leading-6 text-white">
                                        {event.name}
                                    </h3>
                                    <span className="border border-potomac-gold/35 px-3 py-1 font-mono text-[0.65rem] font-bold uppercase text-potomac-gold">
                                        {event.date}
                                    </span>
                                </div>
                                <p className="mt-2 font-mono text-[0.65rem] uppercase text-potomac-cream/45">
                                    {event.location}
                                </p>
                                <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                                    {event.publicNote}
                                </p>
                                <p className="mt-3 border-l border-white/15 pl-3 text-sm leading-6 text-potomac-cream/55">
                                    {event.memberNote}
                                </p>
                            </article>
                        ))}
                    </div>
                </aside>
            </section>

            <section className="border-y border-potomac-regolith/20 bg-potomac-primary/78">
                <div className="mx-auto w-full max-w-[92rem] px-4 py-10 md:px-8">
                    <SectionHeading
                        eyebrow="Markets and models"
                        title="Commercial advantage with model discipline"
                        description="The public surface shows which intelligence modules are active without exposing paid methodology, model assumptions, or member-only source detail."
                    />
                    <div className="mt-6">
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
