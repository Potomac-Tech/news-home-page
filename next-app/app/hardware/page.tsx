import type { Metadata } from "next";
import { RouteScaffold } from "../_components/RouteScaffold";

export const metadata: Metadata = {
    title: "Hardware",
};

export default function HardwarePage() {
    return (
        <RouteScaffold
            title="Potomac Hardware"
            description="The hardware route is reserved in the Next.js scaffold so existing product positioning can move over without losing the current public URL."
            status="Route preserved"
            primaryHref="/source"
            primaryLabel="Source redirect"
        />
    );
}
