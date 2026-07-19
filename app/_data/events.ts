export type EventAccessTier = "member" | "scout" | "command";

export type EventSourceLink = {
    label: string;
    title: string;
    url: string;
};

export type EventCalendarDetails = {
    memberDetails: string;
    memberPacketUrl?: string;
    registrationUrl?: string;
    virtualUrl?: string;
    contactEmail?: string;
    sourceLinks: EventSourceLink[];
    preparationNotes?: string;
};

export type EventCalendarRecord = {
    id?: string;
    slug: string;
    title: string;
    eventType: string;
    accessTier: EventAccessTier;
    organizer?: string;
    location: string;
    timezone: string;
    startsAt: string;
    dateLabel?: string;
    endsAt?: string | null;
    publicSummary: string;
    publicTeaser: string;
    publicAgenda: string[];
    publishedAt: string;
    details?: EventCalendarDetails;
};

export const fallbackEvents: EventCalendarRecord[] = [
    {
        slug: "potomac-space-investment-forum-2026",
        title: "Space Investment Forum",
        eventType: "forum",
        accessTier: "member",
        organizer: "Potomac Database Systems and Meet the Future",
        location: "Cosmos Club, Washington, DC",
        timezone: "America/New_York",
        startsAt: "2026-07-21T09:45:00-04:00",
        endsAt: "2026-07-21T12:00:00-04:00",
        publicSummary:
            "An invitation-only forum for leaders in investment, government, industry, and national security focused on American leadership in space.",
        publicTeaser:
            "The featured conversation and agenda connect Artemis, cislunar infrastructure, defense, workforce, capital allocation, and data intelligence.",
        publicAgenda: [
            "American strength in space",
            "Lunar and cislunar infrastructure",
            "Capital allocation and investment trends",
        ],
        publishedAt: "2026-07-19T12:00:00-04:00",
        details: {
            memberDetails:
                "The main forum runs from 9:45 a.m. to noon for approximately 50 curated guests. Jim Bridenstine and retired Brig. Gen. Damon Feltman will lead the featured conversation.",
            contactEmail: "kevcirilli@gmail.com",
            sourceLinks: [
                {
                    label: "Event invitation",
                    title: "Space Investment Forum",
                    url: "/potomac-space-investment-forum.jpg",
                },
            ],
            preparationNotes: "Invitation only. Business attire.",
        },
    },
    {
        slug: "space-industrialist-week-2026",
        title: "Space Industrialist Week",
        eventType: "industry_week",
        accessTier: "member",
        organizer: "Cabeus Explorer",
        location: "Venue to be announced",
        timezone: "America/New_York",
        startsAt: "2026-09-01T09:00:00-04:00",
        dateLabel: "September 2026 | Dates to be announced",
        publicSummary:
            "A new gathering for leading figures across the space and lunar industries, featuring the inaugural Cabeus Games.",
        publicTeaser:
            "Save the date for September. Program dates, venue, participants, and attendance information will be announced as they are confirmed.",
        publicAgenda: [
            "Space and lunar industry leadership",
            "Industrial strategy and collaboration",
            "Inaugural Cabeus Games",
        ],
        publishedAt: "2026-07-19T12:00:00-04:00",
    },
];

export function publicEventTeasers() {
    return fallbackEvents.map(({ details: _details, ...event }) => event);
}
