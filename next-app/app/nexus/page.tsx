import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Nexus",
};

export default function NexusPage() {
    return (
        <RouteScaffold
            title="Potomac Nexus"
            description="The Nexus route is ready for member dashboard access status and a safe deep-link path to the existing Nexus experience."
            status="Route preserved"
            primaryHref="/news"
            primaryLabel="Latest news"
        />
    );
}
