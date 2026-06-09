import React from "react";
import { Link } from "react-router-dom";

const offerings = [
    {
        title: "Exclusive Buy",
        body: "Customers choose where and what data they want. Potomac handles collection, operations, and delivery of proprietary lunar site intelligence.",
    },
    {
        title: "Nexus Subscription",
        body: "Teams access lunar datasets, analysis-ready layers, and collaborative proposal workflows through the Nexus web platform.",
    },
];

const Home: React.FC = () => {
    return (
        <>
            {/* HERO SECTION */}
            <div className="pt-32 pb-8 px-4 md:px-8 relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
                <div className="max-w-6xl mx-auto text-center space-y-6">
                    <h2 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white tracking-wide sm:tracking-widest text-glow leading-tight whitespace-nowrap">
                        POTOMAC{" "}
                        <span className="text-potomac-gold italic">
                            DATABASE SYSTEMS
                        </span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
                        Billion-dollar lunar proposal teams are competing with
                        commodity data.{" "}
                        <span className="text-potomac-gold italic">
                            Potomac gives them the proprietary intelligence
                            needed to win, land, and build.
                        </span>
                    </p>
                    <p className="text-xl text-gray-300 font-light max-w-4xl mx-auto uppercase tracking-widest border-t border-b border-white/10 py-3 inline-block">
                        Proposal Intelligence for the Moon
                    </p>
                    <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
                        We allow customers to buy existing data instantly,
                        eliminating the risk and complexity of end-to-end
                        mission design.
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="px-4 md:px-8 pb-8 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* VALUE PROPOSITION */}
                    <div className="glass-card p-6 md:p-10 rounded-lg md:col-span-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition">
                            <svg
                                className="w-32 h-32 text-potomac-gold"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1"
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                            </svg>
                        </div>
                        <h3 className="text-2xl font-serif text-potomac-gold tracking-widest mb-6">
                            PROPRIETARY SITE INTELLIGENCE
                        </h3>
                        <div className="space-y-4 text-gray-300 leading-relaxed font-light text-lg">
                            <p>
                                Potomac gives lunar proposal teams proprietary
                                site intelligence to identify the highest-value
                                places, win billion-dollar proposals, and stick
                                the landing.
                            </p>
                            <p className="border-l-2 border-potomac-gold pl-4 italic text-white/90">
                                Instead of designing a dedicated end-to-end
                                mission for every dataset, customers can buy
                                the data they need and receive it through a
                                web-based delivery platform.
                            </p>
                        </div>
                    </div>

                    {/* BUSINESS MODEL */}
                    {offerings.map((offering) => (
                        <div
                            key={offering.title}
                            className="glass-card p-6 md:p-8 rounded-lg"
                        >
                            <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
                                Business Model
                            </p>
                            <h3 className="text-2xl font-serif text-white tracking-widest mb-4">
                                {offering.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                {offering.body}
                            </p>
                        </div>
                    ))}

                    {/* HARDWARE */}
                    <Link
                        to="/hardware"
                        className="glass-card p-0 rounded-lg flex flex-col relative group overflow-hidden cursor-pointer"
                    >
                        <div className="absolute inset-0 z-0">
                            <img
                                src="/hardware-compass-05122026.png"
                                alt="Compass lunar plume reconnaissance system"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-potomac-secondary via-potomac-secondary/80 to-transparent"></div>
                        </div>

                        <div className="p-6 md:p-10 relative z-10 flex flex-col h-full">
                            <div className="absolute top-6 right-6 p-2 bg-potomac-gold/10 rounded-full">
                                <svg
                                    className="w-6 h-6 text-potomac-gold"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                    ></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-serif text-white tracking-widest mb-4 group-hover:text-potomac-gold transition">
                                HARDWARE
                            </h3>
                            <p className="text-gray-400 leading-relaxed flex-1">
                                Compass, Pathfinder, and Source form a
                                progressive data collection roadmap from
                                low-cost reconnaissance to persistent lunar
                                surface intelligence.
                            </p>
                            <span className="mt-6 text-xs font-bold text-potomac-gold uppercase tracking-widest border-b border-potomac-gold/30 pb-1 self-start hover:border-potomac-gold transition">
                                View Hardware Systems
                            </span>
                        </div>
                    </Link>

                    {/* NEXUS */}
                    <Link
                        to="/nexus"
                        className="glass-card p-0 rounded-lg flex flex-col relative group overflow-hidden cursor-pointer"
                    >
                        <div className="absolute inset-0 z-0">
                            <img
                                src="/Nexus Screenshot.png"
                                alt="Nexus platform interface"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-potomac-secondary via-potomac-secondary/80 to-transparent"></div>
                        </div>

                        <div className="p-6 md:p-10 relative z-10 flex flex-col h-full">
                            <div className="absolute top-6 right-6 p-2 bg-potomac-gold/10 rounded-full">
                                <svg
                                    className="w-6 h-6 text-potomac-gold"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                    ></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-serif text-white tracking-widest mb-4 group-hover:text-potomac-gold transition">
                                NEXUS
                            </h3>
                            <p className="text-gray-400 leading-relaxed flex-1">
                                A unified analytics platform for proposal
                                teams to access, analyze, and collaborate on
                                lunar datasets.
                            </p>
                            <span className="mt-6 text-xs font-bold text-potomac-gold uppercase tracking-widest border-b border-potomac-gold/30 pb-1 self-start hover:border-potomac-gold transition">
                                Explore Nexus
                            </span>
                        </div>
                    </Link>

                    {/* IMPACT */}
                    <div className="glass-card p-6 md:p-10 rounded-lg md:col-span-2 bg-gradient-to-r from-potomac-gold/5 to-transparent border-potomac-gold/20">
                        <h3 className="text-2xl font-serif text-potomac-gold tracking-widest mb-4">
                            IMPACT
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            Potomac sells decision advantage. By turning scarce
                            lunar surface observations into repeatable,
                            commercial data products, we help teams de-risk
                            landing reliability, mobility planning, power
                            siting, resource prospecting, and long-duration
                            operations.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Home;
