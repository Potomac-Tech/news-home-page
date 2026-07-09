import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Source Inquiry",
    description: "Register interest in Potomac Source lunar site-characterization support.",
};

export default function SourceInquiryPage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="max-w-4xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                        Potomac Source
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                        Deliver data for building
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        A persistent lunar garage and rover designed for at
                        least one year of operation to fully characterize the
                        site in preparation for construction.
                    </p>
                    <Link
                        href="/request-access?source=source-inquiry"
                        className="mt-8 inline-flex bg-potomac-gold px-5 py-3 font-mono text-[0.68rem] font-bold uppercase text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Learn more
                    </Link>
                </div>
            </div>
        </section>
    );
}
