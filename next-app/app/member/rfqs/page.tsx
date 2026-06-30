import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRfqAccessContext } from "../../../lib/auth/rfq";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import {
    createRfqPost,
    reportRfq,
    submitRfqResponse,
    updateRfqStatus,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "RFQ Workspace",
};

type RfqPost = {
    id: string;
    title: string;
    summary: string;
    description: string;
    category: string;
    procurement_stage: string | null;
    location: string | null;
    budget_range: string | null;
    due_at: string | null;
    question_deadline_at: string | null;
    visibility: string;
    status: string;
    created_by: string;
    organization_id: string | null;
    contact_name: string | null;
    contact_email: string | null;
    published_at: string | null;
    created_at: string;
};

type RfqResponse = {
    id: string;
    rfq_id: string;
    responder_user_id: string;
    organization_id: string | null;
    status: string;
    response_summary: string;
    response_body: string;
    estimated_price: string | null;
    delivery_timeline: string | null;
    contact_name: string | null;
    contact_email: string | null;
    submitted_at: string | null;
    created_at: string;
};

type Organization = {
    id: string;
    name: string;
    role: string;
};

type RfqData = {
    rfqs: RfqPost[];
    selectedRfq: RfqPost | null;
    responses: RfqResponse[];
    responseCountsByRfqId: Map<string, number>;
    organizations: Organization[];
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
});

function statusLabel(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date pending";
    }

    return dateTimeFormatter.format(date);
}

function StatusPill({ label }: { label: string }) {
    return (
        <span className="rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
            {label}
        </span>
    );
}

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        RFQ workspace
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        RFQs are paid-member workflows and require Potomac
                        Supabase public configuration plus a signed-in Scout or
                        Command member.
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
                        RFQ workspace
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Scout or Command access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        RFQ posting, browsing, and responses are reserved for
                        paid Scout and Command members.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/member"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Workspace
                        </Link>
                        <Link
                            href="/command"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Command access
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function RfqSidebar({
    rfqs,
    selectedRfq,
    responseCountsByRfqId,
}: {
    rfqs: RfqPost[];
    selectedRfq: RfqPost | null;
    responseCountsByRfqId: Map<string, number>;
}) {
    return (
        <aside className="space-y-6">
            <section className="glass-card rounded p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Marketplace
                </p>
                <h1 className="mt-3 font-serif text-3xl leading-tight text-white">
                    RFQs
                </h1>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="border-l border-potomac-gold/35 pl-3">
                        <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                            Open
                        </dt>
                        <dd className="mt-1 font-semibold text-white">
                            {rfqs.filter((rfq) => rfq.status === "open").length}
                        </dd>
                    </div>
                    <div className="border-l border-potomac-gold/35 pl-3">
                        <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                            Total
                        </dt>
                        <dd className="mt-1 font-semibold text-white">
                            {rfqs.length}
                        </dd>
                    </div>
                </dl>
                <Link
                    href="/member"
                    className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Workspace
                </Link>
            </section>

            <section className="glass-card rounded p-4">
                <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Opportunities
                </p>
                <div className="mt-3 space-y-2">
                    {rfqs.length ? (
                        rfqs.map((rfq) => {
                            const selected = rfq.id === selectedRfq?.id;

                            return (
                                <Link
                                    key={rfq.id}
                                    href={`/member/rfqs?rfq=${rfq.id}`}
                                    className={
                                        selected
                                            ? "block rounded border border-potomac-gold/55 bg-white/10 p-4"
                                            : "block rounded border border-white/10 bg-black/15 p-4 transition hover:border-potomac-gold/45 hover:bg-white/5"
                                    }
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                {rfq.title}
                                            </p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                                {rfq.category} |{" "}
                                                {statusLabel(rfq.status)}
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                                            {responseCountsByRfqId.get(rfq.id) ?? 0}
                                        </span>
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-potomac-cream/60">
                                        {rfq.summary}
                                    </p>
                                    <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                        Due {formatDateTime(rfq.due_at)}
                                    </p>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="rounded border border-white/10 bg-black/15 p-4 text-sm leading-6 text-potomac-cream/65">
                            No RFQs are visible yet.
                        </div>
                    )}
                </div>
            </section>
        </aside>
    );
}

function OrganizationSelect({
    organizations,
    optional = true,
}: {
    organizations: Organization[];
    optional?: boolean;
}) {
    return (
        <select
            name="organization_id"
            className="mt-2 w-full rounded border border-white/10 bg-potomac-primary px-3 py-3 text-sm text-white"
            required={!optional}
        >
            {optional ? <option value="">Personal attribution</option> : null}
            {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                    {organization.name} - {statusLabel(organization.role)}
                </option>
            ))}
        </select>
    );
}

function PostRfqForm({ organizations }: { organizations: Organization[] }) {
    return (
        <section className="glass-card rounded p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                Post RFQ
            </p>
            <form action={createRfqPost} className="mt-5 space-y-4">
                <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                        Title
                    </span>
                    <input
                        name="title"
                        required
                        maxLength={180}
                        className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                        placeholder="Lunar payload integration support"
                    />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                            Category
                        </span>
                        <input
                            name="category"
                            required
                            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                            placeholder="Payloads"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                            Visibility
                        </span>
                        <select
                            name="visibility"
                            required
                            className="mt-2 w-full rounded border border-white/10 bg-potomac-primary px-3 py-3 text-sm text-white"
                        >
                            <option value="scout_command">Scout and Command</option>
                            <option value="command_only">Command only</option>
                            <option value="invited_organizations">
                                Invited organizations
                            </option>
                        </select>
                    </label>
                </div>
                <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                        Organization
                    </span>
                    <OrganizationSelect organizations={organizations} />
                </label>
                <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                        Summary
                    </span>
                    <textarea
                        name="summary"
                        required
                        rows={3}
                        maxLength={500}
                        className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                        placeholder="Short opportunity summary for the RFQ list."
                    />
                </label>
                <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                        Description
                    </span>
                    <textarea
                        name="description"
                        required
                        rows={6}
                        className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                        placeholder="Scope, evaluation criteria, constraints, and response requirements."
                    />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                            Due date
                        </span>
                        <input
                            type="datetime-local"
                            name="due_at"
                            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                            Questions due
                        </span>
                        <input
                            type="datetime-local"
                            name="question_deadline_at"
                            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                        />
                    </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <input
                        name="budget_range"
                        className="rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                        placeholder="Budget range"
                    />
                    <input
                        name="location"
                        className="rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                        placeholder="Location or remote"
                    />
                </div>
                <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                    <input
                        type="checkbox"
                        name="publish_now"
                        value="1"
                        className="h-4 w-4 accent-potomac-gold"
                    />
                    Publish immediately
                </label>
                <button className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream">
                    Save RFQ
                </button>
            </form>
        </section>
    );
}

function RfqDetail({
    rfq,
    responses,
    organizations,
    currentUserId,
    canModerate,
}: {
    rfq: RfqPost | null;
    responses: RfqResponse[];
    organizations: Organization[];
    currentUserId: string;
    canModerate: boolean;
}) {
    if (!rfq) {
        return (
            <section className="glass-card rounded p-6">
                <h2 className="font-serif text-2xl text-white">
                    Select an RFQ
                </h2>
                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                    Choose an opportunity from the list or create a new one.
                </p>
            </section>
        );
    }

    const isOwner = rfq.created_by === currentUserId;

    return (
        <section className="space-y-6">
            <article className="glass-card rounded p-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex flex-wrap gap-2">
                            <StatusPill label={statusLabel(rfq.status)} />
                            <StatusPill label={statusLabel(rfq.visibility)} />
                            {canModerate ? <StatusPill label="Moderator view" /> : null}
                        </div>
                        <h2 className="mt-3 font-serif text-3xl leading-tight text-white">
                            {rfq.title}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            {rfq.summary}
                        </p>
                    </div>
                    <ReportForm rfqId={rfq.id} reportedUserId={rfq.created_by} />
                </div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/80">
                    {rfq.description}
                </p>
                <dl className="mt-6 grid gap-3 text-sm text-potomac-cream/65 md:grid-cols-2">
                    <div className="border-t border-white/10 pt-3">
                        <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                            Category
                        </dt>
                        <dd className="mt-1 text-white">{rfq.category}</dd>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                        <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                            Due
                        </dt>
                        <dd className="mt-1 text-white">
                            {formatDateTime(rfq.due_at)}
                        </dd>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                        <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                            Budget
                        </dt>
                        <dd className="mt-1 text-white">
                            {rfq.budget_range ?? "Not listed"}
                        </dd>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                        <dt className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                            Location
                        </dt>
                        <dd className="mt-1 text-white">
                            {rfq.location ?? "Not listed"}
                        </dd>
                    </div>
                </dl>
                {isOwner || canModerate ? <StatusForm rfq={rfq} /> : null}
            </article>

            <section className="glass-card rounded p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Responses
                </p>
                <div className="mt-5 space-y-4">
                    {responses.length ? (
                        responses.map((response) => (
                            <article
                                key={response.id}
                                className="rounded border border-white/10 bg-black/20 p-4"
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap gap-2">
                                            <StatusPill
                                                label={statusLabel(response.status)}
                                            />
                                            {response.responder_user_id ===
                                            currentUserId ? (
                                                <StatusPill label="Your response" />
                                            ) : null}
                                        </div>
                                        <h3 className="mt-3 text-sm font-bold leading-6 text-white">
                                            {response.response_summary}
                                        </h3>
                                    </div>
                                    <span className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {formatDateTime(
                                            response.submitted_at ??
                                                response.created_at
                                        )}
                                    </span>
                                </div>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-potomac-cream/75">
                                    {response.response_body}
                                </p>
                                <dl className="mt-4 grid gap-3 text-xs text-potomac-cream/55 md:grid-cols-2">
                                    <div>
                                        <dt>Estimate</dt>
                                        <dd className="mt-1 text-potomac-cream/80">
                                            {response.estimated_price ?? "Not listed"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Timeline</dt>
                                        <dd className="mt-1 text-potomac-cream/80">
                                            {response.delivery_timeline ??
                                                "Not listed"}
                                        </dd>
                                    </div>
                                </dl>
                                <div className="mt-4 border-t border-white/10 pt-4">
                                    <ReportForm
                                        rfqId={rfq.id}
                                        responseId={response.id}
                                        reportedUserId={response.responder_user_id}
                                    />
                                </div>
                            </article>
                        ))
                    ) : (
                        <p className="text-sm leading-6 text-potomac-cream/65">
                            No visible responses are available yet.
                        </p>
                    )}
                </div>
            </section>

            {rfq.status === "open" && !isOwner ? (
                <ResponseForm rfqId={rfq.id} organizations={organizations} />
            ) : null}
        </section>
    );
}

function StatusForm({ rfq }: { rfq: RfqPost }) {
    return (
        <form
            action={updateRfqStatus}
            className="mt-6 grid gap-3 border-t border-white/10 pt-5 md:grid-cols-[1fr_1fr_auto]"
        >
            <input type="hidden" name="rfq_id" value={rfq.id} />
            <select
                name="to_status"
                defaultValue={rfq.status}
                className="rounded border border-white/10 bg-potomac-primary px-3 py-3 text-sm text-white"
            >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="paused">Paused</option>
                <option value="awarded">Awarded</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
            </select>
            <input
                name="note"
                className="rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                placeholder="Optional status note"
            />
            <button className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                Update
            </button>
        </form>
    );
}

function ResponseForm({
    rfqId,
    organizations,
}: {
    rfqId: string;
    organizations: Organization[];
}) {
    return (
        <section className="glass-card rounded p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                Respond
            </p>
            <form action={submitRfqResponse} className="mt-5 space-y-4">
                <input type="hidden" name="rfq_id" value={rfqId} />
                <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/55">
                        Organization
                    </span>
                    <OrganizationSelect organizations={organizations} />
                </label>
                <input
                    name="response_summary"
                    required
                    maxLength={500}
                    className="w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                    placeholder="Response summary"
                />
                <textarea
                    name="response_body"
                    required
                    rows={6}
                    className="w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                    placeholder="Capabilities, approach, assumptions, and exceptions."
                />
                <div className="grid gap-4 md:grid-cols-2">
                    <input
                        name="estimated_price"
                        className="rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                        placeholder="Estimated price"
                    />
                    <input
                        name="delivery_timeline"
                        className="rounded border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"
                        placeholder="Delivery timeline"
                    />
                </div>
                <button className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream">
                    Submit response
                </button>
            </form>
        </section>
    );
}

function ReportForm({
    rfqId,
    responseId,
    reportedUserId,
}: {
    rfqId: string;
    responseId?: string;
    reportedUserId?: string;
}) {
    return (
        <details className="w-full md:w-auto">
            <summary className="cursor-pointer rounded border border-potomac-gold/50 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                Report
            </summary>
            <form action={reportRfq} className="mt-3 space-y-3">
                <input type="hidden" name="rfq_id" value={rfqId} />
                <input type="hidden" name="response_id" value={responseId ?? ""} />
                <input
                    type="hidden"
                    name="reported_user_id"
                    value={reportedUserId ?? ""}
                />
                <select
                    name="reason"
                    required
                    className="w-full rounded border border-white/10 bg-potomac-primary px-3 py-3 text-sm text-white"
                >
                    <option value="spam">Spam or solicitation</option>
                    <option value="sensitive_content">
                        Sensitive or controlled content
                    </option>
                    <option value="misleading">Misleading opportunity</option>
                    <option value="other">Other moderation issue</option>
                </select>
                <textarea
                    name="reporter_note"
                    rows={3}
                    className="w-full rounded border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white"
                    placeholder="Optional note for moderators."
                />
                <button className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5">
                    Submit report
                </button>
            </form>
        </details>
    );
}

async function loadRfqData({
    selectedRfqId,
    currentUserId,
}: {
    selectedRfqId: string | null;
    currentUserId: string;
}): Promise<RfqData> {
    const supabase = await createClient();
    const [rfqResult, organizationResult] = await Promise.all([
        supabase
            .from("rfq_posts")
            .select(
                "id,title,summary,description,category,procurement_stage,location,budget_range,due_at,question_deadline_at,visibility,status,created_by,organization_id,contact_name,contact_email,published_at,created_at"
            )
            .order("due_at", { ascending: true, nullsFirst: false })
            .order("published_at", { ascending: false })
            .limit(100),
        supabase
            .from("organization_members")
            .select("organization_id,role,organizations(id,name)")
            .eq("user_id", currentUserId)
            .eq("status", "active")
            .limit(50),
    ]);

    if (rfqResult.error) {
        throw new Error(rfqResult.error.message);
    }

    if (organizationResult.error) {
        throw new Error(organizationResult.error.message);
    }

    const rfqs = (rfqResult.data ?? []) as RfqPost[];
    const selectedRfq =
        rfqs.find((rfq) => rfq.id === selectedRfqId) ?? rfqs[0] ?? null;
    const rfqIds = rfqs.map((rfq) => rfq.id);
    const responseCountResult = rfqIds.length
        ? await supabase
              .from("rfq_responses")
              .select("rfq_id")
              .in("rfq_id", rfqIds)
              .limit(500)
        : { data: [], error: null };

    if (responseCountResult.error) {
        throw new Error(responseCountResult.error.message);
    }

    const responsesResult = selectedRfq
        ? await supabase
              .from("rfq_responses")
              .select(
                  "id,rfq_id,responder_user_id,organization_id,status,response_summary,response_body,estimated_price,delivery_timeline,contact_name,contact_email,submitted_at,created_at"
              )
              .eq("rfq_id", selectedRfq.id)
              .order("submitted_at", { ascending: false, nullsFirst: false })
              .order("created_at", { ascending: false })
              .limit(50)
        : { data: [], error: null };

    if (responsesResult.error) {
        throw new Error(responsesResult.error.message);
    }

    const responseCountsByRfqId = new Map<string, number>();

    for (const row of (responseCountResult.data ?? []) as Array<{ rfq_id: string }>) {
        responseCountsByRfqId.set(
            row.rfq_id,
            (responseCountsByRfqId.get(row.rfq_id) ?? 0) + 1
        );
    }

    const organizations = ((organizationResult.data ?? []) as unknown as Array<{
        role: string;
        organizations: { id: string; name: string } | Array<{ id: string; name: string }> | null;
    }>)
        .map((row) => {
            const organization = Array.isArray(row.organizations)
                ? row.organizations[0]
                : row.organizations;

            return organization
                ? {
                      id: organization.id,
                      name: organization.name,
                      role: row.role,
                  }
                : null;
        })
        .filter((organization): organization is Organization =>
            Boolean(organization)
        );

    return {
        rfqs,
        selectedRfq,
        responses: (responsesResult.data ?? []) as RfqResponse[],
        responseCountsByRfqId,
        organizations,
    };
}

export default async function MemberRfqsPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getRfqAccessContext({
        supabase,
        nextPath: "/member/rfqs",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canUseRfqs || !access.userId) {
        return <LockedGate />;
    }

    const params = (await searchParams) ?? {};
    const rfqParam = params.rfq;
    const selectedRfqId = Array.isArray(rfqParam)
        ? rfqParam[0] ?? null
        : rfqParam ?? null;
    const data = await loadRfqData({
        selectedRfqId,
        currentUserId: access.userId,
    });

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)_24rem]">
                    <RfqSidebar
                        rfqs={data.rfqs}
                        selectedRfq={data.selectedRfq}
                        responseCountsByRfqId={data.responseCountsByRfqId}
                    />
                    <RfqDetail
                        rfq={data.selectedRfq}
                        responses={data.responses}
                        organizations={data.organizations}
                        currentUserId={access.userId}
                        canModerate={access.canModerateRfqs}
                    />
                    <PostRfqForm organizations={data.organizations} />
                </div>
            </div>
        </section>
    );
}
