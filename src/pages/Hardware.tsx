import React, { useState } from "react";
import Modal from "../components/Modal";

const hardwareSystems = [
    {
        title: "Compass",
        kicker: "Find the resources",
        image: "/hardware-compass-05122026.png",
        alt: "Compass CubeSat observing a deliberate lunar impact plume",
        body: "A low-cost plume reconnaissance product that uses a deliberate lunar impact and a companion CubeSat to find abundant sources of water.",
    },
    {
        title: "Pathfinder",
        kicker: "Find the landing site",
        image: "/hardware-pathfinder-05122026.png",
        alt: "Pathfinder impact-emplaced lunar sensor on the surface",
        body: "An impact-emplaced lunar sensor that survives hard landing independent of a lander and finds the best landing sites.",
    },
    {
        title: "Source",
        kicker: "Deliver data for building",
        image: "/hardware-source-10162025.png",
        alt: "Source lunar garage and rover system",
        body: "A persistent lunar garage and rover designed for at least one year of operation to fully characterize the site in preparation for construction.",
    },
];

const Hardware: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            {/* HERO */}
            <div className="pt-32 pb-6 px-4 md:px-8 relative bg-potomac-primary">
                <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
                <div className="relative z-10 text-center space-y-6 max-w-5xl mx-auto">
                    <h2 className="text-5xl sm:text-6xl md:text-8xl font-serif text-white tracking-widest text-glow leading-tight">
                        HARDWARE
                    </h2>
                    <p className="text-lg sm:text-2xl text-potomac-gold font-light tracking-[0.3em] uppercase">
                        Progressive lunar data collection systems
                    </p>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto pt-4 leading-relaxed border-t border-white/10">
                        Compass, Pathfinder, and Source give customers a staged
                        path from resource reconnaissance to persistent site
                        characterization.
                    </p>
                </div>
            </div>

            {/* MAIN */}
            <main className="flex-1 px-4 md:px-8 py-2 relative z-10 bg-potomac-secondary">
                <div className="max-w-7xl mx-auto space-y-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px bg-potomac-gold/30 flex-1"></div>
                        <h3 className="text-xl md:text-2xl font-serif text-potomac-cream tracking-widest">
                            DATA COLLECTION ROADMAP
                        </h3>
                        <div className="h-px bg-potomac-gold/30 flex-1"></div>
                    </div>

                    <div className="space-y-8">
                        {hardwareSystems.map((system, index) => {
                            const isReversed = index % 2 === 1;
                            return (
                                <section
                                    key={system.title}
                                    className="glass-card rounded-lg overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2">
                                        <div
                                            className={`relative min-h-[280px] md:min-h-[420px] ${
                                                isReversed
                                                    ? "lg:order-2"
                                                    : ""
                                            }`}
                                        >
                                            <img
                                                src={system.image}
                                                alt={system.alt}
                                                loading="lazy"
                                                decoding="async"
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-potomac-secondary/80 via-transparent to-transparent"></div>
                                            <div className="absolute bottom-6 left-6">
                                                <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-1">
                                                    0{index + 1}
                                                </p>
                                                <h4 className="text-3xl text-white font-serif tracking-widest">
                                                    {system.title}
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="p-8 md:p-10 flex flex-col justify-center">
                                            <p className="text-potomac-gold text-xs font-bold uppercase tracking-[0.3em] mb-4">
                                                {system.kicker}
                                            </p>
                                            <h3 className="text-3xl md:text-4xl font-serif text-white tracking-widest mb-6">
                                                {system.title}
                                            </h3>
                                            <p className="text-gray-300 text-lg leading-relaxed">
                                                {system.body}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            );
                        })}
                    </div>

                    <div className="glass-card p-8 md:p-10 rounded-lg bg-gradient-to-r from-potomac-gold/5 to-transparent border-potomac-gold/20">
                        <h3 className="text-2xl font-serif text-potomac-gold tracking-widest mb-4">
                            FROM RECONNAISSANCE TO PERSISTENCE
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-lg">
                            Each system lowers the cost and risk of acquiring
                            mission-relevant lunar surface data. Compass finds
                            valuable resource signatures, Pathfinder returns
                            localized ground truth, and Source builds the
                            long-duration data record needed for construction
                            and sustained operations.
                        </p>
                    </div>

                    <div className="text-center pt-2 pb-10 border-t border-white/5">
                        <p className="text-potomac-gold uppercase tracking-[0.2em] text-sm mb-6">
                            Current Hardware Status:{" "}
                            <span className="text-white font-bold">
                                INVITE ONLY
                            </span>
                        </p>
                        <h3 className="text-3xl font-serif text-white mb-8">
                            Secure Your Dataset
                        </h3>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-8 py-4 bg-transparent border border-potomac-gold text-potomac-gold font-bold uppercase tracking-widest hover:bg-potomac-gold hover:text-potomac-primary transition duration-300"
                        >
                            Register Interest
                        </button>
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                context="source_interest"
            />
        </>
    );
};

export default Hardware;
