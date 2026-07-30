import type { Metadata } from "next";
import { TerminalWorkspace } from "./_integration/TerminalWorkspace";

export const metadata: Metadata = {
    title: "Cabeus Terminal",
    description:
        "Evidence-first cislunar and Earth-orbit intelligence for mission engineering, investment diligence, and space operations.",
    alternates: {
        canonical: "/terminal",
    },
};

export default function TerminalPage() {
    return <TerminalWorkspace />;
}
