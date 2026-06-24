import type { Metadata } from "next";
import {
    grantCommandEntitlement,
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

export default async function AdminCommandPage() {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
        .from("command_interest_requests")
        .select(
            "id,contact_name,contact_email,organization_name,title,estimated_seats,use_case,status,created_at"
        )
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    const requests = (data ?? []) as CommandRequest[];

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
