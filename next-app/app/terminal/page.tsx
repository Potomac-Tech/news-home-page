import type { Metadata } from "next";
import { TerminalDashboardShell } from "../_components/TerminalDashboardShell";

export const metadata: Metadata = {
    title: "Lunar Terminal",
    description:
        "Potomac lunar industry terminal navigation for news, missions, markets, datasets, alerts, calculators, and account areas.",
    alternates: {
        canonical: "/terminal",
    },
};

export default function TerminalPage() {
    return (
        <div className="bg-grid-pattern">
            <section className="border-b border-white/10">
                <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
                    <div className="max-w-4xl">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                            Lunar command center
                        </p>
                        <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                            Potomac lunar industry terminal
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                            A news-first terminal shell for lunar launches,
                            spacecraft, landers, procurements, regulatory
                            movement, company profiles, economy intelligence,
                            datasets, marketplace workflows, events,
                            calculators, alerts, and member account paths.
                        </p>
                    </div>
                </div>
            </section>
            <TerminalDashboardShell />
        </div>
    );
}
