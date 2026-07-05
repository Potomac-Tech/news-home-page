import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Team",
    description:
        "Public Cabeus Explorer team route for the lunar intelligence platform.",
    alternates: {
        canonical: "/team",
    },
};

export default function TeamPage() {
    return (
        <RouteScaffold
            title="Cabeus Explorer Team"
            description="The public team route is available in the Next.js scaffold and can be ported from the current React page during route migration."
            status="Route preserved"
            primaryHref="/news"
            primaryLabel="Latest news"
        />
    );
}
