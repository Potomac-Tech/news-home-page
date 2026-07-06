import type { Metadata } from "next";
import { LunarCalculatorWorkspace } from "./LunarCalculatorWorkspace";

export const metadata: Metadata = {
    title: "Lunar Mission Calculators",
    description:
        "Interactive lunar mission calculators for cost, launch-window, RF link-budget, thermal, radiation, and power planning assumptions.",
    alternates: {
        canonical: "/calculators",
    },
};

export default function CalculatorsPage() {
    return (
        <>
            <section className="border-b border-white/10 bg-grid-pattern">
                <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                        Lunar mission calculators
                    </p>
                    <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight text-white md:text-6xl">
                        Planning math with visible assumptions.
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-7 text-potomac-cream/75 md:text-lg md:leading-8">
                        Use the first calculator set for lunar mission cost,
                        launch-window pressure, RF link budget, thermal balance,
                        radiation exposure, and surface power. Each tool exposes
                        its assumptions, limits, citations, units, and
                        confidence level.
                    </p>
                </div>
            </section>
            <LunarCalculatorWorkspace />
        </>
    );
}
