import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Lunar Spacecraft and Landers",
    description:
        "Lunar spacecraft, lander, payload, and satellite tracker route.",
    alternates: {
        canonical: "/spacecraft",
    },
};

export default function SpacecraftPage() {
    return (
        <RouteScaffold
            title="Spacecraft and landers"
            description="This terminal route is reserved for lunar spacecraft, landers, payloads, satellites, mission phases, landing sites, instruments, freshness, and source citations."
            status="Object tracker shell"
            primaryHref="/terminal"
            primaryLabel="Terminal"
        />
    );
}
