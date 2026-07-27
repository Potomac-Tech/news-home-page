import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTerminalViewerContext } from "../../../lib/auth/terminal";
import { resolveTerminalModule } from "../../../lib/terminal/frontend";
import { TerminalWorkspace } from "../_integration/TerminalWorkspace";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ module: string }>;
}): Promise<Metadata> {
    const { module: moduleId } = await params;
    const module = resolveTerminalModule(moduleId);
    if (!module) return {};

    return {
        title: `${module.label} | Cabeus Terminal`,
        description: module.description,
        alternates: { canonical: `/terminal/${module.id}` },
    };
}

export default async function TerminalModulePage({
    params,
}: {
    params: Promise<{ module: string }>;
}) {
    const { module: moduleId } = await params;
    const module = resolveTerminalModule(moduleId);
    if (!module) notFound();

    const viewer = await getTerminalViewerContext(`/terminal/${module.id}`);
    return <TerminalWorkspace module={module} viewer={viewer} />;
}
