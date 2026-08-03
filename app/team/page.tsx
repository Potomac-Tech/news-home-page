import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About Cabeus Explorer",
    description:
        "Learn about Cabeus Explorer, the intelligence platform for space industrialists securing, financing, and building the lunar economy.",
    alternates: {
        canonical: "/team",
    },
};

const platformAreas = [
    {
        number: "01",
        title: "Intelligence",
        description:
            "Trusted reporting, proprietary data, and strategic context for decisions that move the lunar industry.",
        href: "/terminal",
        label: "Explore intelligence",
    },
    {
        number: "02",
        title: "Council",
        description:
            "A community for the leaders securing, building, and financing the lunar economy and what comes beyond it.",
        href: "/pricing",
        label: "Meet the Council",
    },
    {
        number: "03",
        title: "Convenings",
        description:
            "Focused gatherings that bring space industrialists together around capital, policy, infrastructure, and execution.",
        href: "/space-industrialist-week",
        label: "View convenings",
    },
];

export default function TeamPage() {
    return (
        <div className="min-h-screen bg-cabeus-paper text-cabeus-ink">
            <header className="border-b border-cabeus-line">
                <div className="mx-auto grid min-h-[38rem] w-full max-w-[92rem] lg:grid-cols-[0.92fr_1.08fr]">
                    <div className="flex items-center px-5 py-14 md:px-10 md:py-20">
                        <div className="max-w-2xl">
                            <p className="brand-kicker">About Cabeus Explorer</p>
                            <h1 className="mt-6 max-w-[9ch] text-balance font-serif text-[clamp(4rem,7vw,7.5rem)] font-medium leading-[0.9]">
                                Clarity for the lunar economy.
                            </h1>
                            <p className="mt-8 max-w-xl text-base leading-8 text-cabeus-muted md:text-lg">
                                Cabeus Explorer is the leading platform providing
                                trusted intelligence and proprietary data for space
                                industrialists securing, financing and building the
                                lunar economy (and beyond).
                            </p>
                        </div>
                    </div>
                    <figure className="relative min-h-[26rem] overflow-hidden border-t border-cabeus-line bg-black lg:min-h-full lg:border-l lg:border-t-0">
                        <img
                            src="/apollo-11-full-moon-nasa.jpg"
                            alt="The Moon photographed during NASA's Apollo 11 mission"
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        <figcaption className="absolute bottom-0 left-0 bg-black/75 px-4 py-3 font-mono text-[0.6rem] font-semibold uppercase text-white/75">
                            The Moon / NASA Apollo 11 archive
                        </figcaption>
                    </figure>
                </div>
            </header>

            <main>
                <section className="border-b border-cabeus-line bg-cabeus-ink text-cabeus-paper">
                    <div className="mx-auto w-full max-w-[92rem] px-5 py-16 md:px-10 md:py-24">
                        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
                            <div>
                                <p className="font-mono text-xs font-bold uppercase text-cabeus-gold">
                                    Our purpose
                                </p>
                                <h2 className="mt-5 max-w-[9ch] font-serif text-5xl font-medium leading-[0.94] md:text-7xl">
                                    Built for space industrialists.
                                </h2>
                            </div>
                            <p className="max-w-3xl text-lg leading-8 text-cabeus-paper/70 md:text-2xl md:leading-10">
                                We connect reporting, data, and the people shaping the
                                emerging lunar market so leaders can understand what is
                                changing, why it matters, and what comes next.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="border-b border-cabeus-line">
                    <div className="mx-auto w-full max-w-[92rem] px-5 py-16 md:px-10 md:py-24">
                        <p className="brand-kicker">The platform</p>
                        <h2 className="mt-5 max-w-[12ch] font-serif text-5xl font-medium leading-[0.94] md:text-7xl">
                            Intelligence, community, and convening power.
                        </h2>
                        <div className="mt-12 grid border-y border-cabeus-line md:grid-cols-3">
                            {platformAreas.map((area) => (
                                <article
                                    key={area.number}
                                    className="border-t border-cabeus-line py-8 first:border-t-0 md:border-l md:border-t-0 md:px-8 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
                                >
                                    <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                        {area.number} / {area.title}
                                    </p>
                                    <h3 className="mt-4 font-serif text-4xl font-medium">
                                        {area.title}
                                    </h3>
                                    <p className="mt-5 text-sm leading-7 text-cabeus-muted">
                                        {area.description}
                                    </p>
                                    <Link
                                        href={area.href}
                                        className="mt-7 inline-block border-b border-cabeus-gold pb-1 font-mono text-xs font-bold uppercase text-cabeus-ink transition hover:text-cabeus-bronze"
                                    >
                                        {area.label} &#8594;
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-b border-cabeus-line bg-cabeus-smoke">
                    <div className="mx-auto grid w-full max-w-[92rem] gap-10 px-5 py-16 md:px-10 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                        <div>
                            <p className="brand-kicker">Accountability</p>
                            <h2 className="mt-5 max-w-[10ch] font-serif text-5xl font-medium leading-[0.94] md:text-7xl">
                                Know who stands behind the work.
                            </h2>
                        </div>
                        <div className="border-t border-cabeus-line">
                            <Link
                                href="/authors"
                                className="group flex items-center justify-between gap-6 border-b border-cabeus-line py-6"
                            >
                                <span className="font-serif text-3xl transition group-hover:text-cabeus-bronze">
                                    Author biographies
                                </span>
                                <span aria-hidden="true" className="font-mono text-cabeus-bronze">
                                    &#8594;
                                </span>
                            </Link>
                            <Link
                                href="/contact"
                                className="group flex items-center justify-between gap-6 border-b border-cabeus-line py-6"
                            >
                                <span className="font-serif text-3xl transition group-hover:text-cabeus-bronze">
                                    Contact and editorial standards
                                </span>
                                <span aria-hidden="true" className="font-mono text-cabeus-bronze">
                                    &#8594;
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
