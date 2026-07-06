import type { Metadata } from "next";
import {
    createCommandPerk,
    grantCommandEntitlement,
    updateCommandPerk,
    updateCommandRequestStatus,
} from "./actions";
import { requireAdmin } from "../../../lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Command Interest",
};

type CommandRequest = {
    id: string;
    contact_name: string;
    contact_email: string;
    organization_name: string;
    title: string | null;
    estimated_seats: number | null;
    use_case: string | null;
    status: string;
    created_at: string;
};

type CommandEntitlement = {
    id: string;
    organization_id: string;
    organizations: {
        name: string;
        slug: string;
        status: string;
    } | Array<{
        name: string;
        slug: string;
        status: string;
    }> | null;
};

type CommandPerk = {
    id: string;
    organization_id: string;
    entitlement_id: string | null;
    perk_type: string;
    status: string;
    priority: string;
    title: string;
    request_summary: string | null;
    fulfillment_summary: string | null;
    next_step: string | null;
    internal_note: string | null;
    due_at: string | null;
    fulfilled_at: string | null;
    blocked_reason: string | null;
    sponsorship_inventory_note: string | null;
    updated_at: string;
};

const perkTypes = [
    ["analyst_support", "Analyst support"],
    ["proposal_support", "Proposal support"],
    ["mission_brief", "Mission brief"],
    ["custom_alert", "Custom alert"],
    ["executive_perk", "Executive perk"],
    ["free_sponsorship", "Free sponsorship"],
];

const perkStatuses = [
    ["promised", "Promised"],
    ["requested", "Requested"],
    ["in_progress", "In progress"],
    ["fulfilled", "Fulfilled"],
    ["blocked", "Blocked"],
    ["canceled", "Canceled"],
];

const perkPriorities = [
    ["low", "Low"],
    ["normal", "Normal"],
    ["high", "High"],
    ["urgent", "Urgent"],
];

function labelFor(options: string[][], value: string) {
    return options.find((option) => option[0] === value)?.[1] ?? value;
}

function organizationName(entitlement: CommandEntitlement) {
    const organization = Array.isArray(entitlement.organizations)
        ? entitlement.organizations[0]
        : entitlement.organizations;

    return organization?.name ?? entitlement.organization_id;
}

function dateTimeLocalValue(value: string | null) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 16);
}

function formatDate(value: string | null) {
    if (!value) {
        return "Not set";
    }

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

export default async function AdminCommandPage() {
    const { supabase } = await requireAdmin();
    const [requestsResult, entitlementsResult, perksResult] = await Promise.all([
        supabase
            .from("command_interest_requests")
            .select(
                "id,contact_name,contact_email,organization_name,title,estimated_seats,use_case,status,created_at"
            )
            .order("created_at", { ascending: false }),
        supabase
            .from("entitlements")
            .select("id,organization_id,organizations(name,slug,status)")
            .eq("tier", "command")
            .eq("status", "active")
            .order("starts_at", { ascending: false }),
        supabase
            .from("command_perk_commitments")
            .select(
                "id,organization_id,entitlement_id,perk_type,status,priority,title,request_summary,fulfillment_summary,next_step,internal_note,due_at,fulfilled_at,blocked_reason,sponsorship_inventory_note,updated_at"
            )
            .order("due_at", { ascending: true, nullsFirst: false })
            .order("updated_at", { ascending: false }),
    ]);

    if (requestsResult.error) {
        throw new Error(requestsResult.error.message);
    }

    if (entitlementsResult.error) {
        throw new Error(entitlementsResult.error.message);
    }

    if (perksResult.error) {
        throw new Error(perksResult.error.message);
    }

    const requests = (requestsResult.data ?? []) as CommandRequest[];
    const entitlements = (entitlementsResult.data ?? []) as CommandEntitlement[];
    const perks = (perksResult.data ?? []) as CommandPerk[];
    const organizationNames = new Map(
        entitlements.map((entitlement) => [
            entitlement.organization_id,
            organizationName(entitlement),
        ])
    );

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Command pipeline
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Command Interest
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Review enterprise interest, track sales status, and
                        manually grant organization-level Command access after
                        offline approval.
                    </p>
                </div>

                <section className="mt-12 glass-card rounded p-6">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                Command perks
                            </p>
                            <h2 className="mt-2 font-serif text-3xl text-white">
                                Service Delivery
                            </h2>
                            <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                                Track analyst support, proposal support, mission
                                briefs, custom alerts, executive perks, and free
                                sponsorship commitments for active Command
                                organizations.
                            </p>
                        </div>
                        <form action={createCommandPerk} className="space-y-3">
                            <select
                                name="organization_id"
                                required
                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                            >
                                <option value="">Select organization</option>
                                {entitlements.map((entitlement) => (
                                    <option
                                        key={entitlement.id}
                                        value={entitlement.organization_id}
                                    >
                                        {organizationName(entitlement)}
                                    </option>
                                ))}
                            </select>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <select
                                    name="perk_type"
                                    defaultValue="analyst_support"
                                    className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                >
                                    {perkTypes.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="status"
                                    defaultValue="promised"
                                    className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                >
                                    {perkStatuses.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="priority"
                                    defaultValue="normal"
                                    className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                >
                                    {perkPriorities.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <input
                                name="title"
                                required
                                placeholder="Perk title"
                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                            />
                            <textarea
                                name="request_summary"
                                rows={3}
                                placeholder="Request or promised benefit"
                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    name="due_at"
                                    type="datetime-local"
                                    className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                />
                                <input
                                    name="next_step"
                                    placeholder="Next step"
                                    className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                />
                            </div>
                            <textarea
                                name="blocked_reason"
                                rows={2}
                                placeholder="Blocked reason, if blocked"
                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                            />
                            <textarea
                                name="sponsorship_inventory_note"
                                rows={2}
                                placeholder="Sponsorship inventory note"
                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                            />
                            <textarea
                                name="internal_note"
                                rows={2}
                                placeholder="Internal delivery note"
                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                            />
                            <button
                                type="submit"
                                className="w-full rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Add perk
                            </button>
                        </form>
                    </div>
                </section>

                <div className="mt-8 space-y-5">
                    {perks.length === 0 ? (
                        <div className="glass-card rounded p-6 text-potomac-cream/80">
                            No Command perks are being tracked yet.
                        </div>
                    ) : (
                        perks.map((perk) => (
                            <article key={perk.id} className="glass-card rounded p-6">
                                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="font-serif text-2xl text-white">
                                                {perk.title}
                                            </h3>
                                            <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                {labelFor(
                                                    perkStatuses,
                                                    perk.status
                                                )}
                                            </span>
                                            <span className="rounded border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-cream/70">
                                                {labelFor(
                                                    perkPriorities,
                                                    perk.priority
                                                )}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-potomac-gold">
                                            {organizationNames.get(
                                                perk.organization_id
                                            ) ?? perk.organization_id}{" "}
                                            /{" "}
                                            {labelFor(
                                                perkTypes,
                                                perk.perk_type
                                            )}
                                        </p>
                                        <dl className="mt-5 grid gap-4 text-sm text-potomac-cream/70 md:grid-cols-3">
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Due
                                                </dt>
                                                <dd className="mt-1">
                                                    {formatDate(perk.due_at)}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Fulfilled
                                                </dt>
                                                <dd className="mt-1">
                                                    {formatDate(
                                                        perk.fulfilled_at
                                                    )}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Updated
                                                </dt>
                                                <dd className="mt-1">
                                                    {formatDate(
                                                        perk.updated_at
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>
                                        {perk.request_summary ? (
                                            <p className="mt-5 text-sm leading-6 text-potomac-cream/75">
                                                {perk.request_summary}
                                            </p>
                                        ) : null}
                                        {perk.next_step ? (
                                            <p className="mt-3 text-sm leading-6 text-potomac-cream/60">
                                                Next: {perk.next_step}
                                            </p>
                                        ) : null}
                                        {perk.blocked_reason ? (
                                            <p className="mt-3 text-sm leading-6 text-red-200">
                                                Blocked: {perk.blocked_reason}
                                            </p>
                                        ) : null}
                                    </div>
                                    <form action={updateCommandPerk} className="space-y-3">
                                        <input
                                            type="hidden"
                                            name="perk_id"
                                            value={perk.id}
                                        />
                                        <input
                                            type="hidden"
                                            name="organization_id"
                                            value={perk.organization_id}
                                        />
                                        <input
                                            name="title"
                                            defaultValue={perk.title}
                                            required
                                            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                        />
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <select
                                                name="status"
                                                defaultValue={perk.status}
                                                className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                            >
                                                {perkStatuses.map(
                                                    ([value, label]) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            <select
                                                name="priority"
                                                defaultValue={perk.priority}
                                                className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                            >
                                                {perkPriorities.map(
                                                    ([value, label]) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            <select
                                                name="perk_type"
                                                defaultValue={perk.perk_type}
                                                disabled
                                                className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/60 outline-none"
                                            >
                                                {perkTypes.map(
                                                    ([value, label]) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                        <textarea
                                            name="request_summary"
                                            rows={2}
                                            defaultValue={
                                                perk.request_summary ?? ""
                                            }
                                            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                        />
                                        <textarea
                                            name="fulfillment_summary"
                                            rows={2}
                                            defaultValue={
                                                perk.fulfillment_summary ?? ""
                                            }
                                            placeholder="Fulfillment summary"
                                            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                        />
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <input
                                                name="due_at"
                                                type="datetime-local"
                                                defaultValue={dateTimeLocalValue(
                                                    perk.due_at
                                                )}
                                                className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                            />
                                            <input
                                                name="fulfilled_at"
                                                type="datetime-local"
                                                defaultValue={dateTimeLocalValue(
                                                    perk.fulfilled_at
                                                )}
                                                className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                            />
                                        </div>
                                        <input
                                            name="next_step"
                                            defaultValue={perk.next_step ?? ""}
                                            placeholder="Next step"
                                            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                        />
                                        <textarea
                                            name="blocked_reason"
                                            rows={2}
                                            defaultValue={
                                                perk.blocked_reason ?? ""
                                            }
                                            placeholder="Blocked reason"
                                            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                        />
                                        <textarea
                                            name="sponsorship_inventory_note"
                                            rows={2}
                                            defaultValue={
                                                perk.sponsorship_inventory_note ??
                                                ""
                                            }
                                            placeholder="Sponsorship inventory note"
                                            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                        />
                                        <textarea
                                            name="internal_note"
                                            rows={2}
                                            defaultValue={
                                                perk.internal_note ?? ""
                                            }
                                            placeholder="Internal note"
                                            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                        />
                                        <button
                                            type="submit"
                                            className="w-full rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                        >
                                            Update perk
                                        </button>
                                    </form>
                                </div>
                            </article>
                        ))
                    )}
                </div>

                <div className="mt-12 space-y-6">
                    {requests.length === 0 ? (
                        <div className="glass-card rounded p-6 text-potomac-cream/80">
                            No Command interest requests.
                        </div>
                    ) : (
                        requests.map((request) => (
                            <article key={request.id} className="glass-card rounded p-6">
                                <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="font-serif text-2xl text-white">
                                                {request.organization_name}
                                            </h2>
                                            <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                {request.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-potomac-gold">
                                            {request.contact_name} ·{" "}
                                            {request.contact_email}
                                        </p>
                                        <dl className="mt-5 grid gap-4 text-sm text-potomac-cream/75 md:grid-cols-2">
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Title
                                                </dt>
                                                <dd className="mt-1">
                                                    {request.title ?? "Not provided"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Seats
                                                </dt>
                                                <dd className="mt-1">
                                                    {request.estimated_seats ??
                                                        "Not provided"}
                                                </dd>
                                            </div>
                                        </dl>
                                        {request.use_case ? (
                                            <p className="mt-5 text-sm leading-6 text-potomac-cream/75">
                                                {request.use_case}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="space-y-4">
                                        <form action={updateCommandRequestStatus}>
                                            <input
                                                type="hidden"
                                                name="request_id"
                                                value={request.id}
                                            />
                                            <select
                                                name="status"
                                                defaultValue={request.status}
                                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">
                                                    Contacted
                                                </option>
                                                <option value="qualified">
                                                    Qualified
                                                </option>
                                                <option value="rejected">
                                                    Rejected
                                                </option>
                                                <option value="archived">
                                                    Archived
                                                </option>
                                            </select>
                                            <textarea
                                                name="decision_note"
                                                rows={3}
                                                placeholder="Sales note"
                                                className="mt-3 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                            />
                                            <button
                                                type="submit"
                                                className="mt-3 w-full rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                            >
                                                Update status
                                            </button>
                                        </form>
                                        <form action={grantCommandEntitlement}>
                                            <input
                                                type="hidden"
                                                name="request_id"
                                                value={request.id}
                                            />
                                            <textarea
                                                name="decision_note"
                                                rows={3}
                                                placeholder="Approval note"
                                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                            />
                                            <button
                                                type="submit"
                                                className="mt-3 w-full rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                                            >
                                                Grant Command
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
