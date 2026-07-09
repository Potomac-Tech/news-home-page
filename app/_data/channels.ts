export type ExternalChannel = {
    id: "substack" | "podcast" | "linkedin";
    label: string;
    description: string;
    href: string | null;
    status: "Live";
};

export const externalChannels: ExternalChannel[] = [
    {
        id: "linkedin",
        label: "LinkedIn",
        description: "Company updates and public announcements.",
        href: "https://www.linkedin.com/company/cabeus-explorer",
        status: "Live",
    },
];

export const liveExternalChannelUrls = externalChannels
    .map((channel) => channel.href)
    .filter((href): href is string => Boolean(href));
