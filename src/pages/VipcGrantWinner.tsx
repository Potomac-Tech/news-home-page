import React from "react";
import { Link } from "react-router-dom";
import SponsorUnit from "../components/SponsorUnit";
import { accessHref, sponsorUnits } from "../data/newsIntelligence";

const keyPoints = [
    "VIPC support advances Potomac's low-cost lunar data infrastructure roadmap.",
    "The public milestone supports member-ready intelligence products.",
    "Members will receive fuller context, source notes, and analyst assumptions.",
];

const citations = [
    {
        label: "Company source",
        title: "Potomac VIPC Launch Grant update",
        publisher: "Potomac",
        href: "https://www.linkedin.com/feed/update/urn:li:activity:7443340367858425877",
        summary:
            "Public company update announcing the VIPC Launch Grant milestone.",
    },
    {
        label: "Press coverage",
        title: "Potomac Database Systems Unveils Plans to Amass Lunar Data",
        publisher: "Payload",
        href: "https://payloadspace.com/potomac-database-systems-unveils-plans-to-amass-lunar-data/",
        summary:
            "External coverage of Potomac's lunar data collection roadmap.",
    },
];

const VipcGrantWinner: React.FC = () => {
    return (
        <article className="bg-grid-pattern pt-20">
            <header className="border-b border-white/10">
                <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
                    <div>
                        <Link
                            to="/news"
                            className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold hover:text-potomac-cream"
                        >
                            Back to news
                        </Link>
                        <h1 className="mt-6 font-serif text-4xl leading-tight text-white md:text-6xl">
                            Potomac selected as VIPC Launch Grant winner
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            The award supports Potomac's low-cost lunar data
                            infrastructure roadmap and its transition toward
                            member-ready intelligence products.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                            <time dateTime="2026-05-18">May 18, 2026</time>
                            <span>Member+ full story</span>
                        </div>
                    </div>
                    <figure className="glass-card rounded p-5">
                        <img
                            src="/Source Rendering.png"
                            alt="Potomac lunar intelligence rendering"
                            className="h-72 w-full rounded object-cover"
                        />
                        <figcaption className="mt-4 text-sm leading-6 text-potomac-cream/60">
                            Potomac Database Systems was selected as a VIPC
                            Grant Winner and is applying for pre-seed follow-on
                            funding.
                        </figcaption>
                    </figure>
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <main className="space-y-8">
                    <section className="glass-card rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Public summary
                        </p>
                        <p className="mt-4 text-xl leading-8 text-white">
                            Potomac is building a news and intelligence layer
                            for lunar markets, mission data, and member-only
                            analysis.
                        </p>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {keyPoints.map((point) => (
                                <div
                                    key={point}
                                    className="border-l border-potomac-gold/45 pl-4"
                                >
                                    <p className="text-sm leading-6 text-potomac-cream/75">
                                        {point}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="glass-card rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Public intro
                        </p>
                        <div className="mt-4 space-y-4 text-base leading-7 text-potomac-cream/75">
                            <p>
                                Potomac Database Systems is using the VIPC Launch
                                Grant milestone to accelerate its roadmap for
                                low-cost lunar data infrastructure.
                            </p>
                            <p>
                                Public readers can review the company milestone,
                                public context, and citations. Approved members
                                unlock the fuller analysis, assumptions, and
                                source notes.
                            </p>
                        </div>
                    </section>

                    <section className="member-gated-content glass-card rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Member full story
                        </p>
                        <h2 className="mt-4 font-serif text-3xl leading-tight text-white">
                            Full analysis is reserved for approved members.
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                            The preview keeps SEO-visible context public while
                            reserving full bodies, model assumptions, and
                            member-only source notes for approved access.
                        </p>
                        <a
                            href={accessHref}
                            className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Apply for access
                        </a>
                    </section>
                </main>

                <aside className="space-y-6">
                    <SponsorUnit unit={sponsorUnits.articleSidebar} />
                    <section className="glass-card rounded p-6">
                        <h2 className="font-serif text-2xl text-white">
                            Source Citations
                        </h2>
                        <div className="mt-5 space-y-5">
                            {citations.map((citation) => (
                                <div
                                    key={citation.title}
                                    className="border-b border-white/10 pb-5 last:border-0 last:pb-0"
                                >
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        {citation.label}
                                    </p>
                                    <a
                                        href={citation.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 block font-semibold leading-6 text-white transition hover:text-potomac-gold"
                                    >
                                        {citation.title}
                                    </a>
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {citation.publisher}
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                        {citation.summary}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </article>
    );
};

export default VipcGrantWinner;
