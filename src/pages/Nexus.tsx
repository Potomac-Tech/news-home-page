import React from "react";

const Nexus: React.FC = () => {
    return (
        <>
            <div className="pt-32 pb-6 px-4 md:px-8 relative bg-potomac-primary">
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
                <div className="relative z-10 text-center space-y-6 max-w-5xl mx-auto">
                    <h2 className="text-5xl sm:text-6xl md:text-8xl font-serif text-white tracking-widest text-glow leading-tight">
                        NEXUS
                    </h2>
                    <p className="text-lg sm:text-2xl text-potomac-gold font-light tracking-[0.3em] uppercase">
                        The Lunar Data Command Center
                    </p>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto pt-4 leading-relaxed border-t border-white/10">
                        The front door to lunar research. Access, analyze, and
                        collaborate on the most cutting-edge data coming from
                        the Moon.
                    </p>
                </div>
            </div>

            <main className="flex-1 px-4 md:px-8 py-2 relative z-10 bg-potomac-secondary">
                <div className="max-w-7xl mx-auto space-y-2">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px bg-potomac-gold/30 flex-1"></div>
                        <h3 className="text-xl md:text-2xl font-serif text-potomac-cream tracking-widest">
                            PLATFORM CAPABILITIES
                        </h3>
                        <div className="h-px bg-potomac-gold/30 flex-1"></div>
                    </div>

                    <div className="relative w-full rounded-lg overflow-hidden border border-potomac-gold/20 shadow-2xl mb-16 group">
                        <img
                            src="/Nexus Screenshot.png"
                            alt="Potomac Nexus Interface"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-auto object-cover transition transform duration-700 group-hover:scale-[1.01]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-potomac-secondary via-transparent to-transparent opacity-20"></div>
                        <div className="absolute bottom-8 left-8">
                            <p className="text-potomac-gold text-xs font-bold uppercase tracking-widest mb-1">
                                Live Environment
                            </p>
                            <h4 className="text-2xl text-white font-serif tracking-wider">
                                South Pole Stereographic Terminal
                            </h4>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature Cards */}
                        <FeatureCard
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                ></path>
                            }
                            title="Science, Not Setup"
                            desc="A purely web-based viewer eliminates the need for complex local software stacks. Our interactive interface handles the heavy lifting of data layers, allowing lunar scientists to focus entirely on the science."
                        />
                        <FeatureCard
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                ></path>
                            }
                            title="GIS Compatible"
                            desc="Built for the modern workflow. Our proprietary data format ensures seamless drag-and-drop compatibility with industry-standard GIS software like ArcGIS and QGIS."
                        />
                        <FeatureCard
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                                ></path>
                            }
                            title="Persistent Workspaces"
                            desc="Never lose context. Save your layers, annotations, and analysis into dedicated Project files that can be loaded instantly, allowing you to pick up exactly where you left off."
                        />

                        <div className="glass-card p-8 rounded-lg group md:col-span-2 lg:col-span-2 bg-gradient-to-r from-potomac-gold/5 to-transparent">
                            <div className="w-12 h-12 mb-6 text-potomac-gold border border-potomac-gold/30 rounded-full flex items-center justify-center bg-white/5">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    ></path>
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-3">
                                Seamless Collaboration
                            </h4>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                End the era of "screenshotting to PowerPoint."
                                Nexus enables real-time collaboration on
                                proposals and papers. Share live, interactive
                                map views and datasets directly with colleagues.
                            </p>
                        </div>

                        <div className="glass-card p-8 rounded-lg group border-potomac-gold/30 bg-potomac-gold/5">
                            <div className="flex items-center gap-4 mb-4">
                                <svg
                                    className="w-8 h-8 text-potomac-gold"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    ></path>
                                </svg>
                                <h4 className="text-lg font-bold text-white uppercase tracking-wider">
                                    The Cutting Edge
                                </h4>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                Access the most current, high-fidelity data
                                streaming from the lunar surface. Nexus isn't
                                just an archive; it's the live feed of lunar
                                exploration.
                            </p>
                        </div>
                    </div>

                    <div className="text-center pt-10 pb-10 border-t border-white/5">
                        <p className="text-potomac-gold uppercase tracking-[0.2em] text-sm mb-6">
                            Ready to Explore?
                        </p>
                        <h3 className="text-3xl font-serif text-white mb-8">
                            Nexus: Coming Spring 2026
                        </h3>
                        <a
                            href="https://nexus-explore.potomacdb.com/"
                            className="px-8 py-4 bg-potomac-gold text-potomac-primary font-bold uppercase tracking-widest hover:bg-white transition duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                        >
                            Register for Beta Access
                        </a>
                    </div>
                </div>
            </main>
        </>
    );
};

const FeatureCard = ({
    icon,
    title,
    desc,
}: {
    icon: any;
    title: string;
    desc: string;
}) => (
    <div className="glass-card p-8 rounded-lg group">
        <div className="w-12 h-12 mb-6 text-potomac-gold border border-potomac-gold/30 rounded-full flex items-center justify-center bg-white/5">
            <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                {icon}
            </svg>
        </div>
        <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-3">
            {title}
        </h4>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

export default Nexus;
