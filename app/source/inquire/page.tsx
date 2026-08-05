import type { Metadata } from "next";
import Image from "next/image";
import { StrategicInquiryForm } from "../../_components/StrategicInquiryForm";

export const metadata: Metadata = {
    title: "Source Inquiry",
    description: "Register interest in Potomac Source lunar site-characterization support.",
    alternates: { canonical: "/source/inquire" },
};

export default async function SourceInquiryPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; source?: string; campaign?: string }>;
}) {
    const { status, source, campaign } = await searchParams;
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">Potomac Source</p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">Deliver data for building</h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">A persistent lunar garage and rover designed for at least one year of operation to fully characterize the site in preparation for construction.</p>
                    <div className="relative mt-8 aspect-[4/3] overflow-hidden border border-potomac-gold/25">
                        <Image src="/hardware-source-10162025.png" alt="Potomac Source lunar data collection hardware rendering" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" priority />
                    </div>
                </div>
                <StrategicInquiryForm product="source" status={status} sourceCta={source} attribution={{ source: source ?? "direct", campaign: campaign ?? "", route: "/source/inquire" }} />
            </div>
        </section>
    );
}
