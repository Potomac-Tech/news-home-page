import React from "react";
import SponsorUnit from "../components/SponsorUnit";
import {
    accessHref,
    eventTeasers,
    sponsorUnits,
} from "../data/newsIntelligence";

const eventAgenda = [
    "Surface operations demand",
    "Mission data rights",
    "Customer and sponsor signals",
];

const Events: React.FC = () => {
    return (
        <section className="bg-grid-pattern pt-20">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-10 lg:grid-cols-[0.9fr_0.55fr]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Event calendar
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Lunar Industry Events
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Public previews for major conferences, summits, and
                            workshops. Approved members unlock registration
                            context, briefing notes, and source-backed
                            preparation packets.
                        </p>
                    </div>
                    <aside className="space-y-6">
                        <SponsorUnit unit={sponsorUnits.eventSidebar} />
                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-2xl text-white">
                                Access Model
                            </h2>
                            <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                                Event titles, timing, locations, and teaser agendas
                                stay public. Detailed logistics and analyst prep
                                notes are reserved for approved members.
                            </p>
                            <a
                                href={accessHref}
                                className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Apply for Member access
                            </a>
                        </section>
                    </aside>
                </div>

                <div className="mt-12 space-y-6">
                    {eventTeasers.map((event) => (
                        <article key={event.name} className="glass-card rounded p-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                                        <span className="text-potomac-gold">
                                            Roundtable
                                        </span>
                                        <span>Member+</span>
                                        <span>Potomac</span>
                                    </div>
                                    <h2 className="mt-4 font-serif text-3xl leading-tight text-white md:text-4xl">
                                        {event.name}
                                    </h2>
                                    <p className="mt-4 max-w-3xl text-base leading-7 text-potomac-cream/75">
                                        {event.publicNote}
                                    </p>
                                </div>
                                <div className="rounded border border-potomac-gold/30 px-5 py-4 lg:min-w-72">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        {event.location}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-potomac-cream/70">
                                        {event.date}, 2026
                                    </p>
                                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        America/New_York
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                                <section>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        Public teaser
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                        {event.memberNote}
                                    </p>
                                </section>
                                <section>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        Agenda preview
                                    </p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                        {eventAgenda.map((item) => (
                                            <p
                                                key={`${event.name}-${item}`}
                                                className="border-l border-potomac-gold/35 pl-3 text-sm leading-6 text-potomac-cream/70"
                                            >
                                                {item}
                                            </p>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <section className="member-gated-content mt-6 rounded border border-potomac-gold/20 bg-black/20 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                    Member+ event details
                                </p>
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                    Public readers can see the event theme, timing,
                                    and agenda preview. Approved members unlock
                                    registration details, source links, and
                                    preparation notes.
                                </p>
                                <a
                                    href={accessHref}
                                    className="mt-5 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                >
                                    Apply for access
                                </a>
                            </section>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Events;
