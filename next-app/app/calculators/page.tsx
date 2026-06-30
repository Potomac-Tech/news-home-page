import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Lunar Mission Calculators",
    description:
        "Lunar mission calculator route for cost, launch-window, link-budget, thermal, radiation, and power assumptions.",
    alternates: {
        canonical: "/calculators",
    },
};

export default function CalculatorsPage() {
    return (
        <RouteScaffold
            title="Mission calculators"
            description="This terminal route is reserved for lunar mission cost, launch-window, RF link-budget, thermal, radiation, and power calculators with assumptions, units, citations, confidence notes, and saved runs."
            status="Calculator shell"
            primaryHref="/terminal"
            primaryLabel="Terminal"
        />
    );
}
