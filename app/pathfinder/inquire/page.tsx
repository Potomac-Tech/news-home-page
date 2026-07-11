import type { Metadata } from "next";
import Image from "next/image";
import { StrategicInquiryForm } from "../../_components/StrategicInquiryForm";

export const metadata: Metadata = {
    title: "Pathfinder Inquiry",
    description: "Register interest in Potomac Pathfinder lunar hardware planning.",
    alternates: { canonical: "/pathfinder/inquire" },
};

export default async function PathfinderInquiryPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; source?: string; campaign?: string }>;
}) {
    const { status, source, campaign } = await searchParams;
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">Potomac Pathfinder</p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">Find the landing site</h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">An impact-emplaced lunar sensor that survives hard landing independent of a lander and finds the best landing sites.</p>
                    <div className="relative mt-8 aspect-[4/3] overflow-hidden border border-potomac-gold/25">
                        <Image src="/hardware-pathfinder-05122026.png" alt="Potomac Pathfinder lunar hardware planning rendering" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" priority />
                    </div>
                </div>
                <StrategicInquiryForm product="pathfinder" status={status} sourceCta={source} attribution={{ source: source ?? "direct", campaign: campaign ?? "", route: "/pathfinder/inquire" }} />
            </div>
        </section>
    );
}
