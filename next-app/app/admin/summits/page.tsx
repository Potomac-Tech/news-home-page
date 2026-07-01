import type { Metadata } from "next";
import { requireEventStaff } from "../../../lib/auth/events";
import { createSummit, updateSummit } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Internal Summits Admin",
};

type InternalSummit = {
    id: string;
    slug: string;
    publish_status: string;
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
    updated_at: string;
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

function PublishStatusSelect({
    defaultValue = "draft",
}: {
    defaultValue?: string;
}) {
    return (
        <select
            name="publish_status"
            defaultValue={defaultValue}
            className={inputClass}
        >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
        </select>
    );
}

function SummitStatusSelect({
    defaultValue = "planned",
}: {
    defaultValue?: string;
}) {
    return (
        <select
            name="summit_status"
            defaultValue={defaultValue}
            className={inputClass}
        >
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
        </select>
    );
}

function SummitFormFields({ summit }: { summit?: InternalSummit }) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Title</FieldLabel>
                <input
                    required
                    name="title"
                    defaultValue={summit?.title ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Slug</FieldLabel>
                <input
                    required
                    name="slug"
                    defaultValue={summit?.slug ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Publish status</FieldLabel>
                <PublishStatusSelect
                    defaultValue={summit?.publish_status ?? "draft"}
                />
            </div>
            <div>
                <FieldLabel>Summit status</FieldLabel>
                <SummitStatusSelect
                    defaultValue={summit?.summit_status ?? "planned"}
                />
            </div>
            <div>
                <FieldLabel>Location</FieldLabel>
                <input
                    required
                    name="location"
                    defaultValue={summit?.location ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Timezone</FieldLabel>
                <input
                    required
                    name="timezone"
                    defaultValue={summit?.timezone ?? "America/New_York"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Starts at</FieldLabel>
                <input
                    required
                    type="datetime-local"
                    name="starts_at"
                    defaultValue={toDateTimeLocal(summit?.starts_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Ends at</FieldLabel>
                <input
                    type="datetime-local"
                    name="ends_at"
                    defaultValue={toDateTimeLocal(summit?.ends_at)}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Status note</FieldLabel>
                <textarea
                    name="status_note"
                    rows={3}
                    defaultValue={summit?.status_note ?? ""}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Tracker summary</FieldLabel>
                <textarea
                    required
                    name="tracker_summary"
                    rows={3}
                    defaultValue={summit?.tracker_summary ?? ""}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Agenda</FieldLabel>
                <textarea
                    name="agenda_markdown"
                    rows={5}
                    defaultValue={summit?.agenda_markdown ?? ""}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Past-event summary</FieldLabel>
                <textarea
                    name="past_event_summary_markdown"
                    rows={5}
                    defaultValue={summit?.past_event_summary_markdown ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Major news</FieldLabel>
                <textarea
                    name="major_news"
                    rows={5}
                    defaultValue={parseStringArray(summit?.major_news).join("\n")}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Next steps</FieldLabel>
                <textarea
                    name="next_steps"
                    rows={5}
                    defaultValue={parseStringArray(summit?.next_steps).join("\n")}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Source links</FieldLabel>
                <textarea
                    name="source_links"
                    rows={4}
                    defaultValue={sourceLinksValue(summit?.source_links)}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

export default async function AdminSummitsPage() {
    const { supabase } = await requireEventStaff();
    const { data, error } = await supabase
        .from("internal_summits")
        .select(
            "id,slug,publish_status,summit_status,title,location,timezone,starts_at,ends_at,status_note,tracker_summary,agenda_markdown,past_event_summary_markdown,major_news,source_links,next_steps,published_at,updated_at"
        )
        .order("starts_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    const summits = (data ?? []) as InternalSummit[];

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Internal summits
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Summit Tracker Admin
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Maintain upcoming internal summits, planning status,
                        post-event summaries, major news, and source links for
                        the member-only tracker.
                    </p>
                </div>

                <form action={createSummit} className="glass-card mt-12 rounded p-6">
                    <h2 className="font-serif text-2xl text-white">
                        New Summit
                    </h2>
                    <div className="mt-6">
                        <SummitFormFields />
                    </div>
                    <button
                        type="submit"
                        className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Create summit
                    </button>
                </form>

                <div className="mt-10 space-y-6">
                    {summits.length === 0 ? (
                        <div className="glass-card rounded p-6 text-potomac-cream/80">
                            No internal summits yet.
                        </div>
                    ) : (
                        summits.map((summit) => (
                            <article key={summit.id} className="glass-card rounded p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="font-serif text-2xl text-white">
                                                {summit.title}
                                            </h2>
                                            <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                {statusLabel(
                                                    summit.publish_status
                                                )}
                                            </span>
                                            <span className="rounded border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-cream/65">
                                                {statusLabel(
                                                    summit.summit_status
                                                )}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-potomac-cream/65">
                                            /member/summits | {summit.location} |{" "}
                                            {formatDate(summit.starts_at)}
                                        </p>
                                        <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                            Published {formatDate(summit.published_at)} |
                                            Updated {formatDate(summit.updated_at)}
                                        </p>
                                    </div>
                                </div>

                                <details className="mt-6 border-y border-white/10 py-5">
                                    <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                        Preview tracker content
                                    </summary>
                                    <div className="mt-5 grid gap-6 lg:grid-cols-2">
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                Upcoming view
                                            </h3>
                                            <p className="mt-3 text-lg font-semibold text-white">
                                                {summit.tracker_summary}
                                            </p>
                                            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/75">
                                                {summit.agenda_markdown ??
                                                    "No agenda has been saved."}
                                            </p>
                                        </section>
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                Past-event view
                                            </h3>
                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/75">
                                                {summit.past_event_summary_markdown ??
                                                    "No past-event summary has been saved."}
                                            </p>
                                            <div className="mt-4 space-y-2">
                                                {parseStringArray(
                                                    summit.major_news
                                                ).map((item) => (
                                                    <p
                                                        key={item}
                                                        className="border-l border-potomac-gold/35 pl-3 text-sm leading-6 text-potomac-cream/65"
                                                    >
                                                        {item}
                                                    </p>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </details>

                                <form action={updateSummit} className="mt-6">
                                    <input
                                        type="hidden"
                                        name="summit_id"
                                        value={summit.id}
                                    />
                                    <SummitFormFields summit={summit} />
                                    <button
                                        type="submit"
                                        className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                    >
                                        Save summit
                                    </button>
                                </form>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
