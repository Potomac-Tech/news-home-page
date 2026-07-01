export type TerminalModuleStatus = "live" | "member" | "scout" | "planned";

export type TerminalModule = {
    id: string;
    label: string;
    href: string;
    summary: string;
    status: TerminalModuleStatus;
    section: "News" | "Missions" | "Markets" | "Workspace";
};

export const terminalModules: TerminalModule[] = [
    {
        id: "news",
        label: "Lunar news",
        href: "/news",
        summary: "Headlines, public briefs, citations, and member-gated stories.",
        status: "live",
        section: "News",
    },
    {
        id: "launches",
        label: "Launches",
        href: "/launches",
        summary: "Upcoming lunar launch windows, vehicles, operators, and status.",
        status: "live",
        section: "Missions",
    },
    {
        id: "spacecraft",
        label: "Spacecraft and landers",
        href: "/spacecraft",
        summary: "Lunar spacecraft, landers, payloads, satellites, and phases.",
        status: "live",
        section: "Missions",
    },
    {
        id: "procurement",
        label: "Procurement",
        href: "/procurement",
        summary: "Lunar solicitations, awards, due dates, and opportunity signals.",
        status: "scout",
        section: "Markets",
    },
    {
        id: "regulatory",
        label: "Regulatory",
        href: "/regulatory",
        summary: "Filings, policy milestones, comment periods, and risk notes.",
        status: "scout",
        section: "Markets",
    },
    {
        id: "companies",
        label: "Companies",
        href: "/companies",
        summary: "Lunar company profiles, relationships, programs, and comparisons.",
        status: "live",
        section: "Markets",
    },
    {
        id: "economy",
        label: "Economy",
        href: "/member/economy",
        summary: "Paid lunar economy models, assumptions, sources, and downloads.",
        status: "scout",
        section: "Markets",
    },
    {
        id: "datasets",
        label: "Datasets",
        href: "/datasets",
        summary: "Public and member dataset catalog with release-state labels.",
        status: "live",
        section: "Markets",
    },
    {
        id: "marketplace",
        label: "Marketplace",
        href: "/member/marketplace",
        summary: "Scout and Command data requests, offers, and source evidence.",
        status: "scout",
        section: "Markets",
    },
    {
        id: "events",
        label: "Events",
        href: "/events",
        summary: "Public event teasers and member-gated event details.",
        status: "live",
        section: "News",
    },
    {
        id: "calculators",
        label: "Calculators",
        href: "/calculators",
        summary: "Mission cost, windows, link, thermal, radiation, and power tools.",
        status: "planned",
        section: "Missions",
    },
    {
        id: "alerts",
        label: "Alerts",
        href: "/alerts",
        summary: "Watched companies, missions, procurement, regulatory, and data changes.",
        status: "planned",
        section: "Workspace",
    },
    {
        id: "account",
        label: "Account",
        href: "/account",
        summary: "Membership, organization, billing, saved work, and access paths.",
        status: "member",
        section: "Workspace",
    },
];

export const terminalHeaderItems = terminalModules.filter((module) =>
    [
        "news",
        "launches",
        "spacecraft",
        "procurement",
        "regulatory",
        "companies",
        "datasets",
        "events",
    ].includes(module.id)
);

export function terminalStatusLabel(status: TerminalModuleStatus) {
    if (status === "live") {
        return "Live";
    }

    if (status === "member") {
        return "Member";
    }

    if (status === "scout") {
        return "Scout+";
    }

    return "Planned";
}
