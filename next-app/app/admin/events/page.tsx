import type { Metadata } from "next";
import { requireEventStaff } from "../../../lib/auth/events";
import { createEvent, updateEvent } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Event Calendar Admin",
};

type EventRecord = {
    id: string;
    slug: string;
    status: string;
    event_type: string;
    access_tier_required: string;
    title: string;
    organizer: string | null;
    location: string;
    timezone: string;
    starts_at: string;
    ends_at: string | null;
    public_summary: string;
    public_teaser: string;
    public_agenda: unknown;
    hero_image_url: string | null;
    published_at: string | null;
    updated_at: string;
};

type EventDetails = {
    event_id: string;
    member_details_markdown: string;
    member_packet_url: string | null;
    registration_url: string | null;
    virtual_url: string | null;
    contact_email: string | null;
    source_links: unknown;
    preparation_notes: string | null;
};

const inputClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

const textareaClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

function FieldLabel({ children }: { children: string }) {
    return (
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
            {children}
        </label>
    );
}

function statusLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleString();
}

function toDateTimeLocal(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 16);
}

function parseStringArray(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function sourceLinksValue(value: unknown) {
    if (!Array.isArray(value)) {
        return "";
    }

    return value
        .filter(
            (item): item is Record<string, unknown> =>
                Boolean(item) && typeof item === "object"
        )
        .map((item) => {
            const label = typeof item.label === "string" ? item.label : "Source";
            const title = typeof item.title === "string" ? item.title : label;
            const url = typeof item.url === "string" ? item.url : "";

            return url ? `${label} | ${title} | ${url}` : "";
        })
        .filter(Boolean)
        .join("\n");
}

function StatusSelect({ defaultValue = "draft" }: { defaultValue?: string }) {
    return (
        <select name="status" defaultValue={defaultValue} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
        </select>
    );
}

function EventTypeSelect({
    defaultValue = "conference",
}: {
    defaultValue?: string;
}) {
    return (
        <select
            name="event_type"
            defaultValue={defaultValue}
            className={inputClass}
        >
            <option value="conference">Conference</option>
            <option value="summit">Summit</option>
            <option value="workshop">Workshop</option>
            <option value="webinar">Webinar</option>
            <option value="briefing">Briefing</option>
            <option value="roundtable">Roundtable</option>
            <option value="other">Other</option>
        </select>
    );
}

function AccessTierSelect({
    defaultValue = "member",
}: {
    defaultValue?: string;
}) {
    return (
        <select
            name="access_tier_required"
            defaultValue={defaultValue}
            className={inputClass}
        >
            <option value="member">Member</option>
            <option value="scout">Scout</option>
            <option value="command">Command</option>
        </select>
    );
}

function EventFormFields({
    event,
    details,
}: {
    event?: EventRecord;
    details?: EventDetails;
}) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Title</FieldLabel>
                <input
                    required
                    name="title"
                    defaultValue={event?.title ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Slug</FieldLabel>
                <input
                    required
                    name="slug"
                    defaultValue={event?.slug ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Status</FieldLabel>
                <StatusSelect defaultValue={event?.status ?? "draft"} />
            </div>
            <div>
                <FieldLabel>Event type</FieldLabel>
                <EventTypeSelect defaultValue={event?.event_type ?? "conference"} />
            </div>
            <div>
                <FieldLabel>Access tier</FieldLabel>
                <AccessTierSelect
                    defaultValue={event?.access_tier_required ?? "member"}
                />
            </div>
            <div>
                <FieldLabel>Organizer</FieldLabel>
                <input
                    name="organizer"
                    defaultValue={event?.organizer ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Location</FieldLabel>
                <input
                    required
                    name="location"
                    defaultValue={event?.location ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Timezone</FieldLabel>
                <input
                    required
                    name="timezone"
                    defaultValue={event?.timezone ?? "America/New_York"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Starts at</FieldLabel>
                <input
                    required
                    type="datetime-local"
                    name="starts_at"
                    defaultValue={toDateTimeLocal(event?.starts_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Ends at</FieldLabel>
                <input
                    type="datetime-local"
                    name="ends_at"
                    defaultValue={toDateTimeLocal(event?.ends_at)}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Public summary</FieldLabel>
                <textarea
                    required
                    name="public_summary"
                    rows={3}
                    defaultValue={event?.public_summary ?? ""}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Public teaser</FieldLabel>
                <textarea
                    required
                    name="public_teaser"
                    rows={4}
                    defaultValue={event?.public_teaser ?? ""}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Public agenda</FieldLabel>
                <textarea
                    name="public_agenda"
                    rows={4}
                    defaultValue={parseStringArray(event?.public_agenda).join("\n")}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Member details</FieldLabel>
                <textarea
                    required
                    name="member_details_markdown"
                    rows={6}
                    defaultValue={details?.member_details_markdown ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Registration URL</FieldLabel>
                <input
                    name="registration_url"
                    defaultValue={details?.registration_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Member packet URL</FieldLabel>
                <input
                    name="member_packet_url"
                    defaultValue={details?.member_packet_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Virtual URL or note</FieldLabel>
                <input
                    name="virtual_url"
                    defaultValue={details?.virtual_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Contact email</FieldLabel>
                <input
                    name="contact_email"
                    defaultValue={details?.contact_email ?? ""}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Source links</FieldLabel>
                <textarea
                    name="source_links"
                    rows={4}
                    defaultValue={sourceLinksValue(details?.source_links)}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Preparation notes</FieldLabel>
                <textarea
                    name="preparation_notes"
                    rows={3}
                    defaultValue={details?.preparation_notes ?? ""}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Hero image URL</FieldLabel>
                <input
                    name="hero_image_url"
                    defaultValue={event?.hero_image_url ?? ""}
                    className={inputClass}
                />
            </div>
        </div>
    );
}

export default async function AdminEventsPage() {
    const { supabase } = await requireEventStaff();
    const { data: eventData, error: eventError } = await supabase
        .from("event_calendar_events")
        .select(
            "id,slug,status,event_type,access_tier_required,title,organizer,location,timezone,starts_at,ends_at,public_summary,public_teaser,public_agenda,hero_image_url,published_at,updated_at"
        )
        .order("starts_at", { ascending: true });

    if (eventError) {
        throw new Error(eventError.message);
    }

    const events = (eventData ?? []) as EventRecord[];
    const eventIds = events.map((event) => event.id);
    const { data: detailData, error: detailError } = eventIds.length
        ? await supabase
              .from("event_calendar_event_details")
              .select(
                  "event_id,member_details_markdown,member_packet_url,registration_url,virtual_url,contact_email,source_links,preparation_notes"
              )
              .in("event_id", eventIds)
        : { data: [], error: null };

    if (detailError) {
        throw new Error(detailError.message);
    }

    const detailsByEventId = new Map(
        ((detailData ?? []) as EventDetails[]).map((details) => [
            details.event_id,
            details,
        ])
    );

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Event workflow
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Event Calendar Admin
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Create public event teasers, maintain member-only
                        logistics, and publish major conferences, summits, and
                        workshops into the Potomac event calendar.
                    </p>
                </div>

                <form action={createEvent} className="glass-card mt-12 rounded p-6">
                    <h2 className="font-serif text-2xl text-white">
                        New Event
                    </h2>
                    <div className="mt-6">
                        <EventFormFields />
                    </div>
                    <button
                        type="submit"
                        className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Create event
                    </button>
                </form>

                <div className="mt-10 space-y-6">
                    {events.length === 0 ? (
                        <div className="glass-card rounded p-6 text-potomac-cream/80">
                            No calendar events yet.
                        </div>
                    ) : (
                        events.map((event) => {
                            const details = detailsByEventId.get(event.id);

                            return (
                                <article key={event.id} className="glass-card rounded p-6">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="font-serif text-2xl text-white">
                                                    {event.title}
                                                </h2>
                                                <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                    {statusLabel(event.status)}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-potomac-cream/65">
                                                /events | {event.location} |{" "}
                                                {formatDate(event.starts_at)}
                                            </p>
                                            <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                                Published {formatDate(event.published_at)} |
                                                Updated {formatDate(event.updated_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <details className="mt-6 border-y border-white/10 py-5">
                                        <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                            Preview public and member content
                                        </summary>
                                        <div className="mt-5 grid gap-6 lg:grid-cols-2">
                                            <section>
                                                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Public preview
                                                </h3>
                                                <p className="mt-3 text-lg font-semibold text-white">
                                                    {event.public_summary}
                                                </p>
                                                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/75">
                                                    {event.public_teaser}
                                                </p>
                                                <div className="mt-4 space-y-2">
                                                    {parseStringArray(
                                                        event.public_agenda
                                                    ).map((agendaItem) => (
                                                        <p
                                                            key={agendaItem}
                                                            className="border-l border-potomac-gold/35 pl-3 text-sm leading-6 text-potomac-cream/65"
                                                        >
                                                            {agendaItem}
                                                        </p>
                                                    ))}
                                                </div>
                                            </section>
                                            <section>
                                                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Member preview
                                                </h3>
                                                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-potomac-cream/55">
                                                    {statusLabel(
                                                        event.access_tier_required
                                                    )}{" "}
                                                    access
                                                </p>
                                                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/75">
                                                    {details?.member_details_markdown ??
                                                        "No member details have been saved."}
                                                </p>
                                            </section>
                                        </div>
                                    </details>

                                    <form action={updateEvent} className="mt-6">
                                        <input
                                            type="hidden"
                                            name="event_id"
                                            value={event.id}
                                        />
                                        <EventFormFields
                                            event={event}
                                            details={details}
                                        />
                                        <button
                                            type="submit"
                                            className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                        >
                                            Save event
                                        </button>
                                    </form>
                                </article>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
