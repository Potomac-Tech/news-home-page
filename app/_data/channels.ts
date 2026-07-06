export type ExternalChannel = {
    id: "substack" | "podcast" | "linkedin" | "x";
    label: string;
    description: string;
    href: string | null;
    status: "Live" | "Launch pending";
};

export const externalChannels: ExternalChannel[] = [
    {
        id: "substack",
        label: "Substack",
        description: "Long-form public intelligence notes.",
        href: null,
        status: "Launch pending",
    },
    {
        id: "podcast",
        label: "Podcast",
        description: "Audio briefings and event recaps.",
        href: null,
        status: "Launch pending",
    },
    {
        id: "linkedin",
        label: "LinkedIn",
        description: "Company updates and public announcements.",
        href: "https://www.linkedin.com/company/potomac-database-systems",
        status: "Live",
    },
    {
        id: "x",
        label: "X",
        description: "Fast public market and mission notes.",
        href: null,
        status: "Launch pending",
    },
];

export const liveExternalChannelUrls = externalChannels
    .map((channel) => channel.href)
    .filter((href): href is string => Boolean(href));
