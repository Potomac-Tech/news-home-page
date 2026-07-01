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
    endsAt?: string | null;
    publicSummary: string;
    publicTeaser: string;
    publicAgenda: string[];
    publishedAt: string;
    details?: EventCalendarDetails;
};

export const fallbackEvents: EventCalendarRecord[] = [
    {
        slug: "lunar-surface-markets-roundtable",
        title: "Lunar Surface Markets Roundtable",
        eventType: "roundtable",
        accessTier: "member",
        organizer: "Potomac",
        location: "Washington, DC",
        timezone: "America/New_York",
        startsAt: "2026-07-16T14:00:00-04:00",
        endsAt: "2026-07-16T17:00:00-04:00",
        publicSummary:
            "A focused roundtable on near-term lunar surface services, data rights, and commercial demand signals.",
        publicTeaser:
            "Public readers can track the theme and timing. Approved members receive the attendee brief, source links, and follow-up notes when available.",
        publicAgenda: [
            "Surface operations demand",
            "Mission data rights",
            "Customer and sponsor signals",
        ],
        publishedAt: "2026-06-20T12:00:00-04:00",
        details: {
            memberDetails:
                "Member packet covers participating company categories, recent public procurement signals, and questions for analysts to pressure-test during the roundtable.",
            registrationUrl: "https://potomacdb.com/apply",
            contactEmail: "events@potomacdb.com",
            sourceLinks: [
                {
                    label: "Briefing source",
                    title: "Potomac lunar intelligence event tracker",
                    url: "https://potomacdb.com/events",
                },
            ],
            preparationNotes:
                "Review current lunar surface services briefs before attending.",
        },
    },
    {
        slug: "cislunar-supply-chain-briefing",
        title: "Cislunar Supply Chain Briefing",
        eventType: "briefing",
        accessTier: "member",
        organizer: "Potomac",
        location: "Virtual",
        timezone: "America/New_York",
        startsAt: "2026-08-06T11:00:00-04:00",
        endsAt: "2026-08-06T12:15:00-04:00",
        publicSummary:
            "A virtual briefing on procurement timing, payload capacity, and supplier watchlist development for lunar programs.",
        publicTeaser:
            "The public calendar shows the briefing theme. Members unlock source-backed preparation notes and registration details.",
        publicAgenda: [
            "Supplier watchlist setup",
            "Payload capacity indicators",
            "Procurement timing signals",
        ],
        publishedAt: "2026-06-20T12:00:00-04:00",
        details: {
            memberDetails:
                "Member detail includes the supplier-screening worksheet, source watchlist framing, and analyst questions for procurement teams.",
            registrationUrl: "https://potomacdb.com/apply",
            virtualUrl: "Member portal link pending",
            contactEmail: "events@potomacdb.com",
            sourceLinks: [],
            preparationNotes:
                "Bring current program timing assumptions and known supplier dependencies.",
        },
    },
    {
        slug: "mission-data-rights-workshop",
        title: "Mission Data Rights Workshop",
        eventType: "workshop",
        accessTier: "member",
        organizer: "Potomac",
        location: "Member-only",
        timezone: "America/New_York",
        startsAt: "2026-09-10T13:00:00-04:00",
        endsAt: "2026-09-10T16:00:00-04:00",
        publicSummary:
            "A member workshop on how mission contracts, data addenda, and downstream analytics shape lunar data access.",
        publicTeaser:
            "Public readers can follow the topic. Approved members receive the methodology packet and workshop logistics.",
        publicAgenda: [
            "Mission contract structure",
            "Data exclusivity windows",
            "Analyst methodology notes",
        ],
        publishedAt: "2026-06-20T12:00:00-04:00",
        details: {
            memberDetails:
                "The workshop packet covers NASA-paid mission-cost benchmarks, addendum treatment, and how Potomac labels confidence across data-rights assumptions.",
            registrationUrl: "https://potomacdb.com/apply",
            contactEmail: "events@potomacdb.com",
            sourceLinks: [],
            preparationNotes:
                "Members should review their internal data-use assumptions before the workshop.",
        },
    },
];

export function publicEventTeasers() {
    return fallbackEvents.map(({ details: _details, ...event }) => event);
}
