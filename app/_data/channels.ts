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

function verifiedChannelUrl(
    value: string | undefined,
    allowedHosts: string[]
) {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === "https:" &&
            allowedHosts.some(
                (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
            )
            ? url.toString()
            : null;
    } catch {
        return null;
    }
}

const configuredChannels: ExternalChannel[] = [
    {
        id: "substack",
        label: "Substack",
        description: "Long-form lunar intelligence and publication updates.",
        href: verifiedChannelUrl(process.env.NEXT_PUBLIC_SUBSTACK_URL, ["substack.com"]),
        status: "Live",
    },
    {
        id: "podcast",
        label: "Podcast",
        description: "Conversations on lunar markets, missions, and infrastructure.",
        href: verifiedChannelUrl(process.env.NEXT_PUBLIC_PODCAST_URL, [
            "spotify.com",
            "podcasts.apple.com",
            "youtube.com",
            "youtu.be",
        ]),
        status: "Live",
    },
];

externalChannels.push(...configuredChannels.filter((channel) => channel.href));

export const liveExternalChannelUrls = externalChannels
    .map((channel) => channel.href)
    .filter((href): href is string => Boolean(href));
