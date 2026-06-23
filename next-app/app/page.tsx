import Link from "next/link";
import { potomacBrand } from "./_data/brand";
import { currentRoutes } from "./_data/currentRoutes";

export default function HomePage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-[1.15fr_0.85fr] md:px-8">
                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Lunar intelligence briefing
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Potomac News & Intelligence
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                        The Next.js foundation is ready to carry public
                        reporting, member access, and Supabase-backed lunar
                        market intelligence.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link
                            href="/news"
                            className="rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            View news
                        </Link>
                        <Link
                            href="/nexus"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Nexus
                        </Link>
                    </div>
                </div>
                <div className="glass-card rounded p-6">
                    <img
                        src={potomacBrand.assets.newsLogo}
                        alt="Potomac News"
                        className="mb-6 h-12 w-auto"
                    />
                    <h2 className="font-serif text-2xl text-white">
                        Route Inventory
                    </h2>
                    <div className="mt-6 space-y-4">
                        {currentRoutes.map((route) => (
                            <div
                                key={route.href}
                                className="border-l border-potomac-gold/50 pl-4"
                            >
                                <Link
                                    href={route.href}
                                    className="font-semibold text-potomac-gold hover:text-potomac-cream"
                                >
                                    {route.href}
                                </Link>
                                <p className="mt-1 text-sm leading-6 text-potomac-cream/70">
                                    {route.note}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
