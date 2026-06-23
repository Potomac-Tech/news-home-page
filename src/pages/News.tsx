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
                        Company announcements and press coverage on Potomac's
                        work building the data layer for the lunar economy.
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
