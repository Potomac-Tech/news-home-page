import React from "react";

const announcements = [
    {
        type: "Grant Award",
        date: "2026",
        title: "Potomac selected as VIPC Launch Grant winner",
        summary:
            "Potomac is a VIPC Grant Winner applying for pre-seed follow-on funding to advance low-cost lunar data infrastructure.",
        href: "/news/vipc-grant-winner",
        cta: "Read update",
    },
    {
        type: "Press Coverage",
        date: "May 18, 2026",
        title: "Potomac Database Systems Unveils Plans to Amass Lunar Data",
        summary:
            "Payload covered Potomac's plan to collect sellable lunar data through Compass, Pathfinder, and Source.",
        href: "https://payloadspace.com/potomac-database-systems-unveils-plans-to-amass-lunar-data/",
        cta: "Read on Payload",
    },
    {
        type: "Press Release",
        date: "May 18, 2026",
        title: "Potomac advances low-cost data infrastructure for the lunar economy",
        summary:
            "Potomac announced its roadmap for the lunar data layer, including Compass, Pathfinder, Source, Nexus, and the RHU provider RFI.",
        href: "/potomac-lunar-economy-press-release-05182026.pdf",
        cta: "View press release",
    },
];

const currentConditions = [
    {
        title: "Compass reconnaissance",
        body: "A low-cost impact-plume product designed to identify abundant sources of lunar water before larger deployments.",
    },
    {
        title: "Pathfinder surface node",
        body: "An impact-emplaced sensor that survives hard landing independent of a lander and returns localized ground-truth data.",
    },
    {
        title: "Source persistence",
        body: "A lunar garage and rover architecture designed to operate for at least one year and characterize sites for construction.",
    },
    {
        title: "Nexus distribution",
        body: "A web-based platform for delivering proprietary lunar datasets and collaborative proposal intelligence.",
    },
];

const News: React.FC = () => {
    return (
        <>
            {/* HERO SECTION */}
            <div className="pt-32 pb-6 px-4 md:px-8 relative bg-potomac-primary">
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
                <div className="relative z-10 text-center space-y-6 max-w-5xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif text-white tracking-widest text-glow leading-tight">
                        NEWS & PRESS
                    </h2>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto pt-4 leading-relaxed border-t border-white/10">
                        Company announcements, press coverage, and the Cygnus
                        briefing on Potomac's work building the data layer for
                        the lunar economy.
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="flex-1 px-4 md:px-8 py-2 relative z-10 bg-potomac-secondary">
                <div className="max-w-6xl mx-auto space-y-10">
                    {/* MAJOR ANNOUNCEMENTS */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                            <h3 className="text-2xl font-serif text-potomac-cream tracking-widest">
                                MAJOR ANNOUNCEMENTS
                            </h3>
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {announcements.map((announcement) => (
                                <AnnouncementCard
                                    key={announcement.title}
                                    {...announcement}
                                />
                            ))}
                        </div>
                    </section>

                    {/* LATEST EDITION */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                            <h3 className="text-2xl font-serif text-potomac-cream tracking-widest">
                                LATEST EDITION
                            </h3>
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                        </div>

                        <a
                            href="https://cygnus61.substack.com/p/potomacs-cygnus-newsletter-may-2026"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-card p-8 md:p-10 rounded-lg flex flex-col md:flex-row gap-10 group hover:border-potomac-gold transition"
                        >
                            <div className="w-full md:w-2/5 flex-shrink-0 overflow-hidden rounded-lg border border-potomac-gold/30 group-hover:border-potomac-gold transition self-start">
                                <img
                                    src="/News_Logo.png"
                                    alt="Cygnus Newsletter May 2026"
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-auto object-cover group-hover:scale-105 transition duration-500"
                                />
                            </div>
                            <div className="flex-1 space-y-4">
                                <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em]">
                                    Cygnus - May 14, 2026
                                </p>
                                <h4 className="text-3xl md:text-4xl font-serif text-white tracking-wider leading-tight">
                                    Turning Lunar Night Survival Into a Market
                                </h4>
                                <p className="text-gray-300 leading-relaxed">
                                    Potomac's May briefing covers commercial
                                    lunar night survival, the Source roadmap,
                                    and Pathfinder as a lower-cost path to
                                    localized ground truth before persistent
                                    deployment.
                                </p>
                                <span className="inline-block mt-2 px-5 py-2 border border-potomac-gold text-potomac-gold text-xs font-bold tracking-[0.2em] uppercase rounded group-hover:bg-potomac-gold group-hover:text-potomac-primary transition duration-300">
                                    Read on Substack
                                </span>
                            </div>
                        </a>
                    </section>

                    {/* CURRENT CONDITIONS */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                            <h3 className="text-2xl font-serif text-potomac-cream tracking-widest">
                                CURRENT CONDITIONS
                            </h3>
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentConditions.map((item) => (
                                <div
                                    key={item.title}
                                    className="glass-card p-6 rounded-lg"
                                >
                                    <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
                                        {item.title}
                                    </p>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {item.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* DEEP SOUNDING */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                            <h3 className="text-2xl font-serif text-potomac-cream tracking-widest">
                                DEEP SOUNDING
                            </h3>
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                        </div>

                        <div className="glass-card p-8 md:p-10 rounded-lg space-y-6">
                            <h4 className="text-2xl md:text-3xl font-serif text-white tracking-wider">
                                LEO's playbook is coming to the Moon
                            </h4>
                            <p className="text-gray-300 leading-relaxed">
                                The commercialization of low Earth orbit showed
                                the pattern: government exploration creates the
                                first demand signal, commercial providers reduce
                                cost, lower cost expands use cases, and expanded
                                use cases create markets government could never
                                fully predict. The lunar surface is entering
                                that same phase, and data is the first
                                commercial product hiding in plain sight.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-potomac-gold/20">
                                <div className="text-center">
                                    <p className="text-4xl font-serif text-potomac-gold mb-2">
                                        $2M+
                                    </p>
                                    <p className="text-gray-400 text-xs uppercase tracking-widest">
                                        Per GB of lunar surface data, implied by
                                        Blue Ghost Mission 1
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-serif text-potomac-gold mb-2">
                                        18
                                    </p>
                                    <p className="text-gray-400 text-xs uppercase tracking-widest">
                                        NASA-published lunar data gaps awaiting
                                        commercial closure
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-serif text-potomac-gold mb-2">
                                        ~$1.9B
                                    </p>
                                    <p className="text-gray-400 text-xs uppercase tracking-widest">
                                        Implied cost to close those gaps at
                                        today's prices
                                    </p>
                                </div>
                            </div>

                            <p className="text-gray-300 leading-relaxed pt-2">
                                This is the opportunity Potomac is built around:
                                taking lunar data from one-off
                                government-funded campaigns to repeatable,
                                lower-cost commercial infrastructure.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
};

const AnnouncementCard = ({
    type,
    date,
    title,
    summary,
    href,
    cta,
}: {
    type: string;
    date: string;
    title: string;
    summary: string;
    href: string;
    cta: string;
}) => {
    const isExternal = href.startsWith("http");

    return (
        <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="glass-card p-6 rounded-lg flex flex-col group hover:border-potomac-gold transition"
        >
            <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
                {type} - {date}
            </p>
            <h4 className="text-xl font-serif text-white tracking-wider leading-tight mb-4 group-hover:text-potomac-gold transition">
                {title}
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed flex-1">
                {summary}
            </p>
            <span className="inline-block mt-6 text-xs font-bold text-potomac-gold uppercase tracking-widest border-b border-potomac-gold/30 pb-1 self-start group-hover:border-potomac-gold transition">
                {cta}
            </span>
        </a>
    );
};

export default News;
