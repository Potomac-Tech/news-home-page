import React from "react";
import { Link } from "react-router-dom";

const VipcGrantWinner: React.FC = () => {
    return (
        <>
            <div className="pt-32 pb-6 px-4 md:px-8 relative bg-potomac-primary">
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
                <div className="relative z-10 text-center space-y-6 max-w-5xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif text-white tracking-widest text-glow leading-tight">
                        VIPC GRANT WINNER
                    </h2>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto pt-4 leading-relaxed border-t border-white/10">
                        Potomac is applying for pre-seed follow-on funding to
                        advance low-cost lunar data infrastructure.
                    </p>
                </div>
            </div>

            <main className="flex-1 px-4 md:px-8 py-2 relative z-10 bg-potomac-secondary">
                <article className="max-w-4xl mx-auto glass-card p-8 md:p-10 rounded-lg space-y-6">
                    <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em]">
                        Grant Award - 2026
                    </p>
                    <h3 className="text-3xl md:text-4xl font-serif text-white tracking-wider leading-tight">
                        Potomac selected as VIPC Launch Grant winner
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        Potomac Database Systems was selected as a VIPC Grant
                        Winner and is applying for pre-seed follow-on funding.
                        The support advances Potomac's roadmap for proprietary
                        lunar site intelligence, including Compass, Pathfinder,
                        Source, and Nexus.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Potomac is building the data layer for the lunar
                        economy. Our systems are designed to reduce the risk,
                        cost, and complexity of lunar surface data collection so
                        proposal teams can buy the intelligence they need to win
                        major programs and land safely.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-potomac-gold/20">
                        <Link
                            to="/news"
                            className="inline-block px-6 py-3 border border-potomac-gold text-potomac-gold text-xs font-bold tracking-[0.2em] uppercase rounded hover:bg-potomac-gold hover:text-potomac-primary transition duration-300 text-center"
                        >
                            Back to News
                        </Link>
                        <a
                            href="https://www.linkedin.com/feed/update/urn:li:activity:7443340367858425877"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-6 py-3 bg-potomac-gold text-potomac-primary text-xs font-bold tracking-[0.2em] uppercase rounded hover:bg-white transition duration-300 text-center"
                        >
                            View LinkedIn Update
                        </a>
                    </div>
                </article>
            </main>
        </>
    );
};

export default VipcGrantWinner;
