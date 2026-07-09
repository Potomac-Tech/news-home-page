import type { Metadata } from "next";
import Link from "next/link";
import {
    eventTeasers,
    fallbackStories,
    marketModules,
    type HomeStory,
} from "./_data/homepage";
import { loadPublicTickerItems } from "./_data/marketQuotes";
import { SponsorUnit } from "./_components/SponsorUnit";
import { EconomySummaryWidget } from "./_components/EconomySummaryWidget";
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

type ReadinessItem = {
    label: string;
    value: number;
    detail: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
});

const intelligenceStats = [
    { label: "Active projects", value: "142", detail: "8 this week" },
    { label: "Supply nodes", value: "87", detail: "5 this week" },
    { label: "Power capacity", value: "3.42 GW", detail: "120 MW watch" },
    { label: "Launches tracked", value: "26", detail: "2 this week" },
    { label: "Investment signals", value: "$9.6B", detail: "$138M this week" },
];

const readinessTrackers: ReadinessItem[] = [
    { label: "Infrastructure", value: 68, detail: "surface construction" },
    { label: "Power", value: 72, detail: "reactors and storage" },
    { label: "Logistics", value: 64, detail: "launch and transfer" },
    { label: "Manufacturing", value: 57, detail: "in-situ materials" },
    { label: "Robotics", value: 71, detail: "autonomy and handling" },
    { label: "Workforce", value: 62, detail: "mission operators" },
];

const supplyNodes = [
    {
        label: "L2 microreactor program",
        status: "Power",
        detail: "Milestone and supplier review active",
    },
    {
        label: "Cislunar propellant depots",
        status: "Logistics",
        detail: "Capacity assumptions under analyst watch",
    },
    {
        label: "Regolith-to-metal pilots",
        status: "Manufacturing",
        detail: "Scale-up status mapped by readiness",
    },
];

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
        href: "/upgrade?tier=scout",
        cta: "Upgrade",
    },
    {
        tier: tierConfig.enterprise.publicName,
        price: tierConfig.enterprise.price,
        detail: "Organization-level intelligence through manual review and contract discussion.",
        features: ["Everything in Scout", "Private briefings", "Team access"],
        href: "/upgrade?tier=meridian",
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
    return slug === "vipc-grant-winner" ? `/news/${slug}` : "/news";
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

function ReadinessCard({ item }: { item: ReadinessItem }) {
    return (
        <article className="border border-potomac-regolith/20 bg-potomac-primary/64 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-mono text-[0.68rem] font-bold uppercase text-potomac-regolith">
                        {item.label}
                    </p>
                    <p className="mt-1 text-xs uppercase text-potomac-cream/45">
                        {item.detail}
                    </p>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                    {item.value}%
                </span>
            </div>
            <div className="mt-4 h-2 bg-potomac-secondary">
                <div
                    className="h-full bg-potomac-gold"
                    style={{ width: `${item.value}%` }}
                />
            </div>
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
            <section className="relative overflow-hidden border-b border-potomac-regolith/20 bg-potomac-primary">
                <img
                    src={potomacBrand.assets.cabeusHero}
                    alt="Lunar industrial base under a crescent moon"
                    className="absolute inset-0 h-full w-full object-cover object-[68%_44%]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,17,20,0.98)_0%,rgba(13,17,20,0.88)_34%,rgba(13,17,20,0.48)_62%,rgba(13,17,20,0.12)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,17,20,0.2)_0%,rgba(13,17,20,0.28)_58%,rgba(13,17,20,0.96)_100%)]" />

                <div className="relative mx-auto flex min-h-[560px] w-full max-w-[92rem] flex-col justify-between px-4 py-12 md:px-8 lg:py-16">
                    <div className="max-w-3xl">
                        <p className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold">
                            {potomacBrand.identity.name} / Brand system active
                        </p>
                        <h1 className="mt-5 font-serif text-5xl uppercase leading-[0.95] text-white md:text-7xl">
                            {potomacBrand.identity.essence}
                        </h1>
                        <div className="industrial-divider mt-7" />
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/76">
                            Actionable intelligence. Operational context.
                            Commercial advantage for teams building, investing,
                            and operating in cislunar markets.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/news"
                                className="bg-potomac-gold px-5 py-3 font-mono text-[0.68rem] font-bold uppercase text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Explore intelligence
                            </Link>
                            <Link
                                href="/request-access?next=/member/economy"
                                className="border border-potomac-regolith/45 px-5 py-3 font-mono text-[0.68rem] font-bold uppercase text-potomac-cream transition hover:border-potomac-gold hover:text-potomac-gold"
                            >
                                View readiness tracker
                            </Link>
                        </div>
                    </div>

                    <div className="mt-12 grid border border-potomac-regolith/20 bg-potomac-primary/78 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-5">
                        {intelligenceStats.map((item) => (
                            <div
                                key={item.label}
                                className="border-b border-r border-potomac-regolith/20 p-4 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(5)]:border-r-0"
                            >
                                <p className="font-mono text-[0.62rem] font-bold uppercase text-potomac-regolith">
                                    {item.label}
                                </p>
                                <p className="mt-2 font-serif text-3xl uppercase text-white">
                                    {item.value}
                                </p>
                                <p className="mt-1 font-mono text-[0.64rem] uppercase text-emerald-200/70">
                                    + {item.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-b border-potomac-regolith/20 bg-potomac-primary/82">
                <div className="mx-auto grid w-full max-w-[92rem] gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1.18fr_0.82fr]">
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
                                    src={potomacBrand.assets.cabeusHero}
                                    alt="Lunar surface construction site"
                                    className="h-56 w-full object-cover object-[68%_55%]"
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
                                {supplyNodes.map((node) => (
                                    <article
                                        key={node.label}
                                        className="border border-potomac-regolith/20 bg-potomac-primary/72 p-4"
                                    >
                                        <p className="font-mono text-[0.65rem] font-bold uppercase text-potomac-gold">
                                            {node.status}
                                        </p>
                                        <h3 className="mt-2 font-serif text-xl uppercase leading-snug text-white">
                                            {node.label}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-potomac-cream/60">
                                            {node.detail}
                                        </p>
                                    </article>
                                ))}
                                <div className="border border-potomac-regolith/20 bg-potomac-primary/72 p-4">
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
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="border border-potomac-regolith/20 bg-potomac-secondary/64 p-5">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="font-serif text-2xl uppercase text-white">
                                Supply chain map
                            </h2>
                            <Link
                                href="/companies"
                                className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold hover:text-potomac-cream"
                            >
                                View map
                            </Link>
                        </div>
                        <div className="relative mt-5 h-72 overflow-hidden border border-potomac-regolith/20 bg-potomac-primary">
                            <img
                                src={potomacBrand.assets.cabeusHero}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover object-[74%_48%] opacity-25"
                            />
                            <div className="absolute left-8 top-16 h-32 w-32 rounded-full border border-potomac-regolith/35 bg-potomac-primary/60" />
                            <div className="absolute right-10 top-10 h-44 w-44 rounded-full border border-potomac-gold/35" />
                            <div className="absolute right-24 top-24 h-16 w-16 rounded-full border border-potomac-regolith/60 bg-potomac-cream/15" />
                            <div className="absolute left-[39%] top-[42%] h-px w-44 -rotate-12 bg-potomac-gold/45" />
                            <div className="absolute left-[48%] top-[30%] h-px w-32 rotate-12 bg-potomac-regolith/35" />
                            <span className="absolute left-[33%] top-[43%] h-3 w-3 border border-potomac-gold bg-potomac-primary" />
                            <span className="absolute right-[24%] top-[28%] h-3 w-3 border border-potomac-gold bg-potomac-primary" />
                            <span className="absolute right-[14%] top-[47%] h-3 w-3 border border-potomac-gold bg-potomac-primary" />
                            <span className="absolute right-[32%] bottom-[24%] h-3 w-3 border border-potomac-regolith bg-potomac-primary" />
                            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2 font-mono text-[0.62rem] uppercase text-potomac-cream/56">
                                <span>Supply node</span>
                                <span>In transit</span>
                                <span>High priority</span>
                                <span>Disruption risk</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <section className="border-b border-potomac-regolith/20 bg-potomac-secondary/70">
                <div className="mx-auto w-full max-w-[92rem] px-4 py-10 md:px-8">
                    <SectionHeading
                        eyebrow="Readiness tracker"
                        title="Operational context by sector"
                        description="Compact progress signals help members compare infrastructure, logistics, power, manufacturing, robotics, and workforce maturity without losing sight of source confidence."
                        action={{ href: "/request-access?next=/member/economy", label: "Open tracker" }}
                    />
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                        {readinessTrackers.map((item) => (
                            <ReadinessCard key={item.label} item={item} />
                        ))}
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
                    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
                        <EconomySummaryWidget summary={economySummary} />
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                            {marketModules.map((module) => (
                                <article
                                    key={module.label}
                                    className="border border-potomac-regolith/20 bg-potomac-secondary/60 p-5"
                                >
                                    <p className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold">
                                        {module.cadence}
                                    </p>
                                    <h3 className="mt-4 font-serif text-2xl uppercase text-white">
                                        {module.value}
                                    </h3>
                                    <p className="mt-2 font-mono text-[0.68rem] font-semibold uppercase text-potomac-cream/55">
                                        {module.label}
                                    </p>
                                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                                        {module.detail}
                                    </p>
                                </article>
                            ))}
                        </div>
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
