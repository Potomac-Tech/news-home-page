import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Pathfinder Inquiry",
    description: "Register interest in Potomac Pathfinder lunar hardware planning.",
};

export default function PathfinderInquiryPage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="max-w-4xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                        Potomac Pathfinder
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                        Find the landing site
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        An impact-emplaced lunar sensor that survives hard
                        landing independent of a lander and finds the best
                        landing sites.
                    </p>
                    <Link
                        href="/request-access?source=pathfinder-inquiry"
                        className="mt-8 inline-flex bg-potomac-gold px-5 py-3 font-mono text-[0.68rem] font-bold uppercase text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Learn more
                    </Link>
                </div>
            </div>
        </section>
    );
}
