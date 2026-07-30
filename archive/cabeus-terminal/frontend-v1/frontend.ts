export const TERMINAL_FRONTEND_VERSION = "2026-07-27.frontend-v1" as const;

export const TERMINAL_MODULES = [
    {
        id: "contracts",
        label: "Contracts & funding",
        description:
            "Federal opportunities, lifecycle changes, awards, and Andromeda program evidence.",
    },
    {
        id: "diligence",
        label: "Investment due diligence",
        description:
            "Evidence-aware profiles, comparable entities, saved models, and report snapshots.",
    },
    {
        id: "organizations",
        label: "Organization & market intelligence",
        description:
            "Company, market, relationship, funding, contract, and workforce signals.",
    },
    {
        id: "missions",
        label: "Mission intelligence",
        description:
            "Cislunar and Earth-orbit mission planning, assets, engineering, and SDA views.",
    },
    {
        id: "workforce",
        label: "Workforce development",
        description:
            "Public job signals, mission matching, gaps, and organizational hiring trends.",
    },
] as const;

export type TerminalModule = (typeof TERMINAL_MODULES)[number];
export type TerminalModuleId = TerminalModule["id"];

export function resolveTerminalModule(
    value?: string | null
): TerminalModule | null {
    const moduleId = value ?? "contracts";
    return TERMINAL_MODULES.find((module) => module.id === moduleId) ?? null;
}
