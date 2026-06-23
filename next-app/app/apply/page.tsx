import type { Metadata } from "next";
import { ApplicationForm } from "./ApplicationForm";

export const metadata: Metadata = {
    title: "Apply",
    description:
        "Apply for free Potomac Member access to read full public-story bodies after approval.",
    alternates: {
        canonical: "/apply",
    },
};

export default function ApplyPage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-[0.85fr_1.15fr] md:px-8">
                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Free Member access
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Apply for Member access
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                        Applications enter manual review before full article
                        access is granted. Scout and Command access remain
                        separate paid or organization-level decisions.
                    </p>
                </div>
                <ApplicationForm />
            </div>
        </section>
    );
}
