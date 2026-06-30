import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Lunar Alerts",
    description:
        "Lunar intelligence alerts route for watched companies, missions, procurements, regulatory records, datasets, events, and marketplace records.",
    alternates: {
        canonical: "/alerts",
    },
};

export default function AlertsPage() {
    return (
        <RouteScaffold
            title="Alerts center"
            description="This terminal route is reserved for watched lunar companies, missions, procurements, regulatory records, datasets, events, marketplace records, unread badges, email hooks, and freshness indicators."
            status="Alerts shell"
            primaryHref="/pricing"
            primaryLabel="Compare tiers"
        />
    );
}
