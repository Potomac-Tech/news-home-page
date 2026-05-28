import React from "react";

const News: React.FC = () => {
    return (
        <>
            {/* HERO SECTION */}
            <div className="pt-32 pb-6 px-8 relative bg-potomac-primary">
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
                <div className="relative z-10 text-center space-y-6 max-w-5xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-serif text-white tracking-widest text-glow leading-tight">
                        THE CYGNUS NEWSLETTER
                    </h2>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto pt-4 leading-relaxed border-t border-white/10">
                        A monthly briefing for Potomac insiders — tracking our
                        progress bridging government exploration and commercial
                        markets by relentlessly lowering the cost of lunar
                        access.
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="flex-1 px-8 py-2 relative z-10 bg-potomac-secondary">
                <div className="max-w-6xl mx-auto space-y-8">
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
                                    alt="Cygnus Newsletter — May 2026"
                                    className="w-full h-auto object-cover group-hover:scale-105 transition duration-500"
                                />
                            </div>
                            <div className="flex-1 space-y-4">
                                <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em]">
                                    Cygnus · May 14, 2026
                                </p>
                                <h4 className="text-3xl md:text-4xl font-serif text-white tracking-wider leading-tight">
                                    Turning Lunar Night Survival Into a Market
                                </h4>
                                <p className="text-gray-300 leading-relaxed">
                                    Potomac released what we believe is the
                                    first commercial RFI for purchasing a
                                    radioisotope power system — a major step
                                    toward making persistent lunar
                                    infrastructure a commercial reality. In the
                                    same month, we expanded our architecture
                                    with{" "}
                                    <span className="text-potomac-cream font-semibold">
                                        Pathfinder
                                    </span>
                                    , a lower-cost, impact-emplaced surface node
                                    designed to return ground-truth data before
                                    Source deployment.
                                </p>
                                <span className="inline-block mt-2 px-5 py-2 border border-potomac-gold text-potomac-gold text-xs font-bold tracking-[0.2em] uppercase rounded group-hover:bg-potomac-gold group-hover:text-potomac-primary transition duration-300">
                                    Read on Substack →
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
                            <div className="glass-card p-6 rounded-lg">
                                <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
                                    Commercial RPS RFI Released
                                </p>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Issued to select providers capable of
                                    supporting survive-the-lunar-night systems
                                    with clarity on schedule, cost, regulatory
                                    pathway, transportation, and integration.
                                </p>
                            </div>
                            <div className="glass-card p-6 rounded-lg">
                                <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
                                    Public Announcement at ASCEND
                                </p>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    The RFI will be announced publicly with a
                                    press release timed to the opening day of
                                    ASCEND in Washington, DC.
                                </p>
                            </div>
                            <div className="glass-card p-6 rounded-lg">
                                <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
                                    Pathfinder Product Launch
                                </p>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    An impact-emplaced lunar dart that survives
                                    hard landing independent of a lander,
                                    anchors into a high-value site, and returns
                                    localized ground-truth data before Source
                                    deployment.
                                </p>
                            </div>
                            <div className="glass-card p-6 rounded-lg">
                                <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
                                    Lower-Cost Data Architecture
                                </p>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Pathfinder complements Source by collecting
                                    the most valuable site data for an estimated
                                    order of magnitude less cost than a
                                    persistent soft-landed system.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* DEEP SOUNDING — THE THESIS */}
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
                                LEO's Playbook Is Coming to the Moon
                            </h4>
                            <p className="text-gray-300 leading-relaxed">
                                The commercialization of low Earth orbit showed
                                the pattern: government exploration creates the
                                first demand signal, commercial providers reduce
                                cost, lower cost expands use cases, and expanded
                                use cases create markets government could never
                                fully predict. The lunar surface is entering
                                that same phase — and data is the first
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
                                taking lunar data from one-off government-funded
                                campaigns to repeatable, lower-cost, commercial
                                infrastructure.
                            </p>
                        </div>
                    </section>

                    {/* TRIBUTARIES — GET INVOLVED */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                            <h3 className="text-2xl font-serif text-potomac-cream tracking-widest">
                                TRIBUTARIES
                            </h3>
                            <div className="h-px bg-potomac-gold/30 flex-1"></div>
                        </div>

                        <div className="glass-card p-8 rounded-lg text-center space-y-4">
                            <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em]">
                                This Month's Ask — Brand Partnerships
                            </p>
                            <p className="text-gray-300 leading-relaxed max-w-3xl mx-auto">
                                We're exploring advertising partners for Potomac
                                products and missions. Introductions to extreme
                                exploration brands — Rolex, Omega, GoPro, Red
                                Bull, or similar companies aligned with lunar
                                exploration, endurance, and frontier
                                infrastructure — would be greatly appreciated.
                            </p>
                            <a
                                href="https://cygnus61.substack.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-4 px-6 py-3 border border-potomac-gold text-potomac-gold text-xs font-bold tracking-[0.2em] uppercase rounded hover:bg-potomac-gold hover:text-potomac-primary transition duration-300"
                            >
                                Subscribe to Cygnus →
                            </a>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
};

export default News;
