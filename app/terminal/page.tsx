import type { Metadata } from "next";
import { getTerminalViewerContext } from "../../lib/auth/terminal";
import { resolveTerminalModule } from "../../lib/terminal/frontend";
import { TerminalWorkspace } from "./_integration/TerminalWorkspace";

export const metadata: Metadata = {
    title: "Cabeus Terminal",
    description:
        "Evidence-first cislunar and Earth-orbit intelligence for mission engineering, investment diligence, and space operations.",
    alternates: {
        canonical: "/terminal",
    },
};

export default async function TerminalPage() {
    const module = resolveTerminalModule();
    const viewer = await getTerminalViewerContext("/terminal");
    if (!module) return null;

    return <TerminalWorkspace module={module} viewer={viewer} />;
}
