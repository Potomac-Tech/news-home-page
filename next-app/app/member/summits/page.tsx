import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { getEventAccessContext } from "../../../lib/auth/event-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Internal Summit Tracker",
};

type InternalSummit = {
    id: string;
    slug: string;
    summit_status: string;
    title: string;
    location: string;
    timezone: string;
    starts_at: string;
    ends_at: string | null;
    status_note: string | null;
    tracker_summary: string;
    agenda_markdown: string | null;
    past_event_summary_markdown: string | null;
    major_news: unknown;
    source_links: unknown;
    next_steps: unknown;
    published_at: string | null;
};

type SourceLink = {
    label: string;
    title: string;
    url: string;
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

function statusLabel(value: string) {
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

function formatDateRange(summit: InternalSummit) {
    const startsAt = formatDate(summit.starts_at);

    if (!summit.ends_at) {
        return startsAt;
    }

    const endDate = new Date(summit.ends_at);

    if (Number.isNaN(endDate.getTime())) {
        return startsAt;
    }

    return `${startsAt} - ${dateFormatter.format(endDate)}`;
}

function parseStringArray(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function parseSourceLinks(value: unknown): SourceLink[] {
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

function renderParagraphs(value: string | null | undefined) {
    return (value ?? "")
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Member summit tracker
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Internal summit records are member-gated and are not
                        rendered from local fallback data. Configure the Potomac
                        Supabase public environment variables and sign in with
                        an approved role to view the tracker.
                    </p>
                    <Link
                        href="/apply"
                        className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Apply for access
                    </Link>
                </div>
            </div>
        </section>
    );
}

function LockedGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Member summit tracker
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Approved Member access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Internal summit plans and past-event summaries are
                        reserved for approved Explorer, Scout, and Command
                        members.
                    </p>
                    <Link
                        href="/apply"
                        className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Apply for access
                    </Link>
                </div>
            </div>
        </section>
    );
}

function SummitCard({ summit }: { summit: InternalSummit }) {
    const majorNews = parseStringArray(summit.major_news);
    const nextSteps = parseStringArray(summit.next_steps);
    const sourceLinks = parseSourceLinks(summit.source_links);
    const isCompleted = summit.summit_status === "completed";

    return (
        <article className="glass-card rounded p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                        <span className="text-potomac-gold">
                            {statusLabel(summit.summit_status)}
                        </span>
                        <span>{summit.location}</span>
                    </div>
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-white">
                        {summit.title}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-potomac-cream/75">
                        {summit.tracker_summary}
                    </p>
                </div>
                <div className="rounded border border-potomac-gold/30 px-5 py-4 lg:min-w-72">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Summit window
                    </p>
                    <p className="mt-2 text-sm leading-6 text-potomac-cream/70">
                        {formatDateRange(summit)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                        {summit.timezone}
                    </p>
                </div>
            </div>

            {summit.status_note ? (
                <p className="mt-5 border-l border-potomac-gold/40 pl-4 text-sm leading-6 text-potomac-cream/65">
                    {summit.status_note}
                </p>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        {isCompleted ? "Past-event summary" : "Agenda"}
                    </p>
                    <div className="mt-3 space-y-4 text-sm leading-6 text-potomac-cream/75">
                        {renderParagraphs(
                            isCompleted
                                ? summit.past_event_summary_markdown
                                : summit.agenda_markdown
                        ).map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </section>
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        {isCompleted ? "Major news" : "Next steps"}
                    </p>
                    <div className="mt-3 space-y-3">
                        {(isCompleted ? majorNews : nextSteps).map((item) => (
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

            {sourceLinks.length ? (
                <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Source links
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {sourceLinks.map((source) => (
                            <a
                                key={`${source.label}-${source.url}`}
                                href={source.url}
                                target={source.url.startsWith("http") ? "_blank" : undefined}
                                rel={source.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                className="rounded border border-white/10 px-4 py-3 text-sm leading-6 text-white transition hover:border-potomac-gold hover:text-potomac-gold"
                            >
                                {source.label}: {source.title}
                            </a>
                        ))}
                    </div>
                </div>
            ) : null}
        </article>
    );
}

export default async function MemberSummitsPage() {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getEventAccessContext({
        supabase,
        tier: "member",
        nextPath: "/member/summits",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canReadEventDetails) {
        return <LockedGate />;
    }

    const { data, error } = await supabase
        .from("internal_summits")
        .select(
            "id,slug,summit_status,title,location,timezone,starts_at,ends_at,status_note,tracker_summary,agenda_markdown,past_event_summary_markdown,major_news,source_links,next_steps,published_at"
        )
        .eq("publish_status", "published")
        .lte("published_at", new Date().toISOString())
        .order("starts_at", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    const summits = (data ?? []) as InternalSummit[];
    const now = Date.now();
    const upcomingSummits = summits.filter((summit) => {
        const endsAt = new Date(summit.ends_at ?? summit.starts_at).getTime();

        return summit.summit_status !== "completed" && endsAt >= now;
    });
    const pastSummits = summits.filter((summit) => {
        const endsAt = new Date(summit.ends_at ?? summit.starts_at).getTime();

        return summit.summit_status === "completed" || endsAt < now;
    });

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Member intelligence
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Internal Summit Tracker
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Upcoming Potomac summits, internal planning status, and
                        post-event summaries for approved members.
                    </p>
                </div>

                <section className="mt-12">
                    <h2 className="font-serif text-3xl text-white">
                        Upcoming Summits
                    </h2>
                    <div className="mt-6 space-y-6">
                        {upcomingSummits.length ? (
                            upcomingSummits.map((summit) => (
                                <SummitCard key={summit.id} summit={summit} />
                            ))
                        ) : (
                            <div className="glass-card rounded p-6 text-potomac-cream/75">
                                No upcoming internal summits are published yet.
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-12">
                    <h2 className="font-serif text-3xl text-white">
                        Past Event Summaries
                    </h2>
                    <div className="mt-6 space-y-6">
                        {pastSummits.length ? (
                            pastSummits.map((summit) => (
                                <SummitCard key={summit.id} summit={summit} />
                            ))
                        ) : (
                            <div className="glass-card rounded p-6 text-potomac-cream/75">
                                No past summit summaries are published yet.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </section>
    );
}
