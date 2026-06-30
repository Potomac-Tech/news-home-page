import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Lunar Companies",
    description:
        "Lunar company directory and comparison route for profiles, programs, contracts, facilities, leadership, and relationships.",
    alternates: {
        canonical: "/companies",
    },
};

export default function CompaniesPage() {
    return (
        <RouteScaffold
            title="Lunar companies"
            description="This terminal route is reserved for searchable lunar company profiles, sectors, programs, contracts, facilities, leadership, public or licensed financial fields, news links, and comparison attributes."
            status="Company intelligence shell"
            primaryHref="/terminal"
            primaryLabel="Terminal"
        />
    );
}
