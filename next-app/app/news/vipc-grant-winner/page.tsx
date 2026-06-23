import type { Metadata } from "next";
import { RouteScaffold } from "../../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "VIPC Grant Winner",
};

export default function VipcGrantWinnerPage() {
    return (
        <RouteScaffold
            title="VIPC Grant Winner"
            description="The existing VIPC grant story has a reserved Next.js article route for the upcoming CMS-backed public teaser and gated-body workflow."
            status="Article route reserved"
            primaryHref="/news"
            primaryLabel="Back to news"
        />
    );
}
