import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Nexus",
    description:
        "Member access to the Cabeus Explorer Nexus lunar mapping and analysis tool.",
    alternates: {
        canonical: "/nexus",
    },
};

export default function NexusPage() {
    return (
        <RouteScaffold
            title="Cabeus Explorer Nexus"
            description="Approved Explorer, Scout, and Meridian members can open Nexus with their existing Cabeus Explorer identity."
            status="Member tool"
            primaryHref="/api/member/nexus/handoff"
            primaryLabel="Open Nexus"
        />
    );
}
