import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Lunar Launches",
    description:
        "Lunar launch tracker route for upcoming launch windows, vehicles, operators, and mission status.",
    alternates: {
        canonical: "/launches",
    },
};

export default function LaunchesPage() {
    return (
        <RouteScaffold
            title="Lunar launches"
            description="This terminal route is reserved for source-backed lunar launch windows, vehicle status, operators, payload context, and mission citations."
            status="Mission tracker shell"
            primaryHref="/terminal"
            primaryLabel="Terminal"
        />
    );
}
