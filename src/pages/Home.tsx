import React from "react";
import { Link } from "react-router-dom";
import SponsorUnit from "../components/SponsorUnit";
import {
    accessHref,
    eventTeasers,
    marketModules,
    sponsorUnits,
    stories,
    tickerItems,
    type HomeStory,
} from "../data/newsIntelligence";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
});

const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    return dateFormatter.format(date);
};

const StoryMeta = ({ story }: { story: HomeStory }) => (
    <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
        <span className="text-potomac-gold">{story.sourceLabel}</span>
        <time dateTime={story.publishedAt}>{formatDate(story.publishedAt)}</time>
        <span>{story.accessTier}+ full brief</span>
    </div>
);

const StoryCard = ({ story }: { story: HomeStory }) => (
    <article className="glass-card rounded p-5">
        <StoryMeta story={story} />
        <h3 className="mt-4 font-serif text-2xl leading-snug text-white">
            {story.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-potomac-cream/75">
            {story.summary}
        </p>
        <p className="mt-4 border-l border-potomac-gold/40 pl-4 text-sm leading-6 text-potomac-cream/60">
            {story.snippet}
        </p>
        <Link
            to={story.href}
            className="mt-6 inline-flex rounded border border-potomac-gold/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
        >
            Read brief
        </Link>
    </article>
);

const SectionHeading = ({
    title,
    description,
}: {
    title: string;
    description: string;
}) => (
    <div className="max-w-3xl">
        <h2 className="font-serif text-3xl leading-tight text-white md:text-4xl">
            {title}
        </h2>
        <p className="mt-4 text-base leading-7 text-potomac-cream/75">
            {description}
        </p>
    </div>
);

const Home: React.FC = () => {
    const featuredStory = stories[0];
    const latestStories = stories.slice(1);

    return (
        <div className="bg-grid-pattern pt-20">
            <section className="border-b border-white/10">
                <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1.18fr_0.82fr] lg:py-16">
                    <div>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Potomac News & Intelligence
                        </h1>
                        <p className="mt-5 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Public lunar market reporting, member-only analysis,
                            and command-level intelligence for organizations
                            working across the cislunar economy.
                        </p>

                        <article className="mt-9 border-l border-potomac-gold pl-5">
                            <StoryMeta story={featuredStory} />
                            <h2 className="mt-4 max-w-4xl font-serif text-3xl leading-tight text-white md:text-5xl">
                                {featuredStory.title}
                            </h2>
                            <p className="mt-5 max-w-3xl text-base leading-7 text-potomac-cream/75 md:text-lg">
                                {featuredStory.summary}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link
                                    to={featuredStory.href}
                                    className="rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                                >
                                    Lead brief
                                </Link>
                                <a
                                    href={accessHref}
                                    className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                >
                                    Apply for access
                                </a>
                            </div>
                        </article>
                    </div>

                    <aside className="glass-card rounded p-5">
                        <img
                            src="/Source Rendering.png"
                            alt="Potomac lunar source rendering"
                            className="h-48 w-full rounded object-cover"
                        />
                        <div className="mt-6 border-b border-white/10 pb-4">
                            <h2 className="font-serif text-2xl text-white">
                                Briefing ticker
                            </h2>
                            <p className="mt-1 text-sm text-potomac-cream/60">
                                Public signals feeding the member desk.
                            </p>
                        </div>
                        <div className="mt-5 space-y-3">
                            {tickerItems.map((item) => (
                                <div
                                    key={item.symbol}
                                    className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0"
                                >
                                    <span className="font-mono text-sm font-bold text-potomac-gold">
                                        {item.symbol}
                                    </span>
                                    <span className="text-sm text-potomac-cream/75">
                                        {item.label}
                                    </span>
                                    <span className="text-right text-xs font-bold uppercase tracking-[0.12em] text-white">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </section>

            <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 md:px-8 lg:grid-cols-[1fr_22rem]">
                <div>
                    <SectionHeading
                        title="Latest Intelligence"
                        description="Public snippets keep the market surface visible while approved members unlock full bodies, citations, source tables, and analyst notes."
                    />
                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        {latestStories.map((story) => (
                            <StoryCard key={story.title} story={story} />
                        ))}
                    </div>
                </div>

                <aside>
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="font-serif text-2xl text-white">
                            Event Teasers
                        </h2>
                        <Link
                            to="/events"
                            className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold hover:text-potomac-cream"
                        >
                            Calendar
                        </Link>
                    </div>
                    <div className="mt-5 space-y-4">
                        {eventTeasers.map((event) => (
                            <article key={event.name} className="glass-card rounded p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="font-semibold leading-6 text-white">
                                        {event.name}
                                    </h3>
                                    <span className="rounded border border-potomac-gold/35 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-potomac-gold">
                                        {event.date}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-potomac-cream/45">
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

            <section className="border-y border-white/10 bg-potomac-primary/70">
                <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
                    <SectionHeading
                        title="Markets And Models"
                        description="The public surface shows which intelligence modules are active without exposing paid methodology, model assumptions, or member-only source detail."
                    />
                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                        {marketModules.map((module) => (
                            <article key={module.label} className="glass-card rounded p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                    {module.cadence}
                                </p>
                                <h3 className="mt-4 font-serif text-2xl text-white">
                                    {module.value}
                                </h3>
                                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-potomac-cream/55">
                                    {module.label}
                                </p>
                                <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                                    {module.detail}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 md:px-8 lg:grid-cols-[0.78fr_1.22fr]">
                <div>
                    <SectionHeading
                        title="Member Access"
                        description="Free Members read full public-story bodies after approval. Scout users unlock deeper dashboards. Command organizations receive manual sales-led access and analyst support."
                    />
                    <div className="mt-8 flex flex-wrap gap-4">
                        <a
                            href={accessHref}
                            className="rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Member application
                        </a>
                        <a
                            href={accessHref}
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Command interest
                        </a>
                    </div>
                </div>

                <div>
                    <h2 className="font-serif text-2xl text-white">Sponsor Slots</h2>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <SponsorUnit unit={sponsorUnits.homepageLeadRail} />
                        <SponsorUnit unit={sponsorUnits.marketModuleBand} />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
