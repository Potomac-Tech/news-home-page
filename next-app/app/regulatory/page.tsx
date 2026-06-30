import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Lunar Regulatory Intelligence",
    description:
        "Scout and Command lunar regulatory intelligence route for filings, comment periods, policy milestones, and compliance notes.",
    alternates: {
        canonical: "/regulatory",
    },
};

export default function RegulatoryPage() {
    return (
        <RouteScaffold
            title="Regulatory intelligence"
            description="This terminal route is reserved for lunar-relevant filings, comment periods, policy milestones, compliance notes, agency records, risk labels, and analyst review state."
            status="Scout intelligence shell"
            primaryHref="/pricing"
            primaryLabel="Compare tiers"
        />
    );
}
