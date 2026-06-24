import type { Metadata } from "next";
import Link from "next/link";
import {
    type EventAccessTier,
    type EventCalendarDetails,
    type EventCalendarRecord,
    type EventSourceLink,
    fallbackEvents,
    publicEventTeasers,
} from "../_data/events";
import {
    absoluteSiteUrl,
    jsonLdScript,
    organizationJsonLd,
    siteConfig,
} from "../_data/site";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import {
    getEventAccessContext,
    type EventAccessContext,
} from "../../lib/auth/event-access";
import { SponsorUnit } from "../_components/SponsorUnit";
import {
    loadSponsorUnits,
    sponsorPlacementKeys,
} from "../_data/sponsorAds";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Events",
    description:
        "Public Potomac event calendar with member-only details for lunar conferences, summits, and workshops.",
    alternates: {
        canonical: "/events",
    },
    openGraph: {
        title: "Events | Potomac",
        description:
            "Public Potomac event calendar with member-only details for lunar conferences, summits, and workshops.",
        url: absoluteSiteUrl("/events"),
        siteName: siteConfig.name,
        type: "website",
    },
};

type EventRow = {
    id: string;
    slug: string;
    title: string;
    event_type: string;
    access_tier_required: string | null;
    organizer: string | null;
    location: string;
    timezone: string;
    starts_at: string;
    ends_at: string | null;
    public_summary: string;
    public_teaser: string;
    public_agenda: unknown;
    published_at: string | null;
};

type EventDetailRow = {
    event_id: string;
    member_details_markdown: string;
    member_packet_url: string | null;
    registration_url: string | null;
    virtual_url: string | null;
    contact_email: string | null;
    source_links: unknown;
    preparation_notes: string | null;
};

type LoadedEvents = {
    events: EventCalendarRecord[];
    access: EventAccessContext;
};

const anonymousAccess: EventAccessContext = {
    canReadEventDetails: false,
    state: "signed_out",
    userId: null,
    roleId: null,
    loginHref: "/auth/login?next=%2Fevents",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
});

function accessTierLabel(tier: EventAccessTier) {
    if (tier === "command") {
        return "Command";
    }

    if (tier === "scout") {
        return "Scout";
    }

    return "Member";
}

function eventTypeLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date pending";
    }

    return dateFormatter.format(date);
}

function formatDateRange(event: EventCalendarRecord) {
    const startsAt = formatDate(event.startsAt);

    if (!event.endsAt) {
        return startsAt;
    }

    const endDate = new Date(event.endsAt);

    if (Number.isNaN(endDate.getTime())) {
        return startsAt;
    }

    return `${startsAt} - ${dateFormatter.format(endDate)}`;
}

function normalizeTier(value: string | null | undefined): EventAccessTier {
    if (value === "command" || value === "scout") {
        return value;
    }

    return "member";
}

function parseStringArray(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function parseSourceLinks(value: unknown): EventSourceLink[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(
            (item): item is Record<string, unknown> =>
                Boolean(item) && typeof item === "object"
        )
        .map((item) => ({
            label: typeof item.label === "string" ? item.label : "Source",
            title: typeof item.title === "string" ? item.title : "Source",
            url: typeof item.url === "string" ? item.url : "",
        }))
        .filter((item) => item.url);
}

function renderParagraphs(value: string) {
    return value
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

function mapDetail(row: EventDetailRow): EventCalendarDetails {
    return {
        memberDetails: row.member_details_markdown,
        memberPacketUrl: row.member_packet_url ?? undefined,
        registrationUrl: row.registration_url ?? undefined,
        virtualUrl: row.virtual_url ?? undefined,
        contactEmail: row.contact_email ?? undefined,
        sourceLinks: parseSourceLinks(row.source_links),
        preparationNotes: row.preparation_notes ?? undefined,
    };
}

function mapEvent(
    row: EventRow,
    detailsByEventId: Map<string, EventCalendarDetails>
): EventCalendarRecord {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        eventType: row.event_type,
        accessTier: normalizeTier(row.access_tier_required),
        organizer: row.organizer ?? undefined,
        location: row.location,
        timezone: row.timezone,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        publicSummary: row.public_summary,
        publicTeaser: row.public_teaser,
        publicAgenda: parseStringArray(row.public_agenda),
        publishedAt: row.published_at ?? row.starts_at,
        details: detailsByEventId.get(row.id),
    };
}

async function loadEvents(): Promise<LoadedEvents> {
    if (!hasPotomacSupabasePublicConfig()) {
        return {
            events: publicEventTeasers(),
            access: anonymousAccess,
        };
    }

    const supabase = await createClient();
    const access = await getEventAccessContext({
        supabase,
        tier: "member",
        nextPath: "/events",
    });

    const { data, error } = await supabase
        .from("event_calendar_events")
        .select(
            "id,slug,title,event_type,access_tier_required,organizer,location,timezone,starts_at,ends_at,public_summary,public_teaser,public_agenda,published_at"
        )
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(24);

    if (error || !data?.length) {
        return {
            events: publicEventTeasers(),
            access,
        };
    }

    const eventIds = ((data ?? []) as EventRow[]).map((event) => event.id);
    let detailsByEventId = new Map<string, EventCalendarDetails>();

    if (eventIds.length && access.state !== "signed_out") {
        const { data: detailData, error: detailError } = await supabase
            .from("event_calendar_event_details")
            .select(
                "event_id,member_details_markdown,member_packet_url,registration_url,virtual_url,contact_email,source_links,preparation_notes"
            )
            .in("event_id", eventIds);

        if (detailError) {
            throw new Error(detailError.message);
        }

        detailsByEventId = new Map(
            ((detailData ?? []) as EventDetailRow[]).map((detail) => [
                detail.event_id,
                mapDetail(detail),
            ])
        );
    }

    return {
        events: ((data ?? []) as EventRow[]).map((event) =>
            mapEvent(event, detailsByEventId)
        ),
        access,
    };
}

function MemberGate({
    event,
    access,
}: {
    event: EventCalendarRecord;
    access: EventAccessContext;
}) {
    const tierLabel = accessTierLabel(event.accessTier);

    return (
        <section className="member-gated-content mt-6 rounded border border-potomac-gold/20 bg-black/20 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                {tierLabel}+ event details
            </p>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                Public readers can see the event theme, timing, and agenda
                preview. Approved members unlock registration details, source
                links, and preparation notes.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
                {access.state === "signed_out" ? (
                    <Link
                        href={access.loginHref}
                        className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Sign in
                    </Link>
                ) : null}
                <Link
                    href="/apply"
                    className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Apply for access
                </Link>
            </div>
        </section>
    );
}

function MemberDetails({ details }: { details: EventCalendarDetails }) {
    return (
        <section className="member-gated-content mt-6 rounded border border-potomac-gold/30 bg-potomac-primary/55 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                Member details
            </p>
            <div className="mt-4 space-y-4 text-sm leading-6 text-potomac-cream/80">
                {renderParagraphs(details.memberDetails).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                ))}
            </div>
            {details.preparationNotes ? (
                <p className="mt-5 border-l border-potomac-gold/40 pl-4 text-sm leading-6 text-potomac-cream/65">
                    {details.preparationNotes}
                </p>
            ) : null}
            <div className="mt-5 grid gap-3 text-sm text-potomac-cream/70 md:grid-cols-2">
                {details.registrationUrl ? (
                    <a
                        href={details.registrationUrl}
                        target={details.registrationUrl.startsWith("http") ? "_blank" : undefined}
                        rel={details.registrationUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="rounded border border-white/10 px-4 py-3 transition hover:border-potomac-gold hover:text-potomac-gold"
                    >
                        Registration
                    </a>
                ) : null}
                {details.memberPacketUrl ? (
                    <a
                        href={details.memberPacketUrl}
                        target={details.memberPacketUrl.startsWith("http") ? "_blank" : undefined}
                        rel={details.memberPacketUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="rounded border border-white/10 px-4 py-3 transition hover:border-potomac-gold hover:text-potomac-gold"
                    >
                        Member packet
                    </a>
                ) : null}
                {details.virtualUrl ? (
                    <span className="rounded border border-white/10 px-4 py-3">
                        {details.virtualUrl}
                    </span>
                ) : null}
                {details.contactEmail ? (
                    <a
                        href={`mailto:${details.contactEmail}`}
                        className="rounded border border-white/10 px-4 py-3 transition hover:border-potomac-gold hover:text-potomac-gold"
                    >
                        {details.contactEmail}
                    </a>
                ) : null}
            </div>
            {details.sourceLinks.length ? (
                <div className="mt-5 border-t border-white/10 pt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Source links
                    </p>
                    <div className="mt-3 space-y-2">
                        {details.sourceLinks.map((source) => (
                            <a
                                key={`${source.label}-${source.url}`}
                                href={source.url}
                                target={source.url.startsWith("http") ? "_blank" : undefined}
                                rel={source.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                className="block text-sm leading-6 text-white transition hover:text-potomac-gold"
                            >
                                {source.label}: {source.title}
                            </a>
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}

export default async function EventsPage() {
    const [{ events, access }, sponsorUnits] = await Promise.all([
        loadEvents(),
        loadSponsorUnits([sponsorPlacementKeys.eventSidebar]),
    ]);
    const eventSponsorUnit = sponsorUnits.get(sponsorPlacementKeys.eventSidebar)!;
    const eventItemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Potomac public event calendar",
        itemListElement: events.map((event, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
                "@type": "Event",
                name: event.title,
                startDate: new Date(event.startsAt).toISOString(),
                endDate: event.endsAt
                    ? new Date(event.endsAt).toISOString()
                    : undefined,
                eventAttendanceMode:
                    event.location.toLowerCase() === "virtual"
                        ? "https://schema.org/OnlineEventAttendanceMode"
                        : "https://schema.org/MixedEventAttendanceMode",
                location: {
                    "@type": "Place",
                    name: event.location,
                },
                organizer: organizationJsonLd(),
                description: event.publicSummary,
                url: absoluteSiteUrl("/events"),
            },
        })),
    };

    return (
        <section className="bg-grid-pattern">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(eventItemListJsonLd),
                }}
            />
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-10 lg:grid-cols-[0.9fr_0.55fr]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Event calendar
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Lunar Industry Events
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Public previews for major conferences, summits, and
                            workshops. Approved members unlock registration
                            context, briefing notes, and source-backed
                            preparation packets.
                        </p>
                    </div>
                    <aside className="space-y-6">
                        <SponsorUnit unit={eventSponsorUnit} />
                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-2xl text-white">
                                Access Model
                            </h2>
                            <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                                Event titles, timing, locations, and teaser agendas
                                stay public. Detailed logistics and analyst prep
                                notes are requested from a separate RLS-protected
                                details table for approved roles only.
                            </p>
                            <Link
                                href="/apply"
                                className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Apply for Member access
                            </Link>
                        </section>
                    </aside>
                </div>

                <div className="mt-12 space-y-6">
                    {events.map((event) => (
                        <article key={event.slug} className="glass-card rounded p-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                                        <span className="text-potomac-gold">
                                            {eventTypeLabel(event.eventType)}
                                        </span>
                                        <span>{accessTierLabel(event.accessTier)}+</span>
                                        {event.organizer ? (
                                            <span>{event.organizer}</span>
                                        ) : null}
                                    </div>
                                    <h2 className="mt-4 font-serif text-3xl leading-tight text-white md:text-4xl">
                                        {event.title}
                                    </h2>
                                    <p className="mt-4 max-w-3xl text-base leading-7 text-potomac-cream/75">
                                        {event.publicSummary}
                                    </p>
                                </div>
                                <div className="rounded border border-potomac-gold/30 px-5 py-4 lg:min-w-72">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        {event.location}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-potomac-cream/70">
                                        {formatDateRange(event)}
                                    </p>
                                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {event.timezone}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                                <section>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        Public teaser
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                        {event.publicTeaser}
                                    </p>
                                </section>
                                <section>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        Agenda preview
                                    </p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                        {(event.publicAgenda.length
                                            ? event.publicAgenda
                                            : [event.publicSummary]
                                        ).map((item) => (
                                            <p
                                                key={item}
                                                className="border-l border-potomac-gold/35 pl-3 text-sm leading-6 text-potomac-cream/70"
                                            >
                                                {item}
                                            </p>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {event.details ? (
                                <MemberDetails details={event.details} />
                            ) : (
                                <MemberGate event={event} access={access} />
                            )}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
