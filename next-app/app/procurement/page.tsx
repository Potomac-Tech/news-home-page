import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Lunar Procurement",
    description:
        "Scout and Command lunar procurement intelligence route for solicitations, awards, due dates, and opportunity signals.",
    alternates: {
        canonical: "/procurement",
    },
};

export default function ProcurementPage() {
    return (
        <RouteScaffold
            title="Lunar procurement"
            description="This terminal route is reserved for lunar solicitations, awards, SBIR/STTR opportunities, due dates, source URLs, confidence labels, and Scout or Command upgrade prompts."
            status="Scout intelligence shell"
            primaryHref="/pricing"
            primaryLabel="Compare tiers"
        />
    );
}
