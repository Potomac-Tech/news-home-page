import type { Metadata } from "next";
import { approveApplication, rejectApplication } from "./actions";
import { requireAdmin } from "../../../lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Membership Applications",
};

type PendingApplication = {
    id: string;
    email: string;
    full_name: string;
    company: string | null;
    title: string | null;
    intended_use: string | null;
    created_at: string;
    user_id: string | null;
};

export default async function AdminApplicationsPage() {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
        .from("membership_applications")
        .select("id,email,full_name,company,title,intended_use,created_at,user_id")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    const applications = (data ?? []) as PendingApplication[];

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Admin review
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Membership Applications
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Review pending free Member applications, record the
                        decision, and update member status for linked Supabase
                        Auth users.
                    </p>
                </div>

                <div className="mt-12 space-y-6">
                    {applications.length === 0 ? (
                        <div className="glass-card rounded p-6 text-potomac-cream/80">
                            No pending applications.
                        </div>
                    ) : (
                        applications.map((application) => (
                            <article
                                key={application.id}
                                className="glass-card rounded p-6"
                            >
                                <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                                    <div>
                                        <h2 className="font-serif text-2xl text-white">
                                            {application.full_name}
                                        </h2>
                                        <p className="mt-2 text-potomac-gold">
                                            {application.email}
                                        </p>
                                        <dl className="mt-5 grid gap-4 text-sm text-potomac-cream/75 md:grid-cols-2">
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Organization
                                                </dt>
                                                <dd className="mt-1">
                                                    {application.company ??
                                                        "Not provided"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Title
                                                </dt>
                                                <dd className="mt-1">
                                                    {application.title ??
                                                        "Not provided"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Identity
                                                </dt>
                                                <dd className="mt-1">
                                                    {application.user_id
                                                        ? "Linked Auth user"
                                                        : "Needs user link before access grant"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                    Submitted
                                                </dt>
                                                <dd className="mt-1">
                                                    {new Date(
                                                        application.created_at
                                                    ).toLocaleDateString()}
                                                </dd>
                                            </div>
                                        </dl>
                                        {application.intended_use ? (
                                            <p className="mt-5 text-sm leading-6 text-potomac-cream/75">
                                                {application.intended_use}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="space-y-4">
                                        <form action={approveApplication}>
                                            <input
                                                type="hidden"
                                                name="application_id"
                                                value={application.id}
                                            />
                                            <textarea
                                                name="decision_note"
                                                rows={3}
                                                placeholder="Decision note"
                                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                            />
                                            <button
                                                type="submit"
                                                className="mt-3 w-full rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                                            >
                                                Approve
                                            </button>
                                        </form>
                                        <form action={rejectApplication}>
                                            <input
                                                type="hidden"
                                                name="application_id"
                                                value={application.id}
                                            />
                                            <textarea
                                                required
                                                name="decision_note"
                                                rows={3}
                                                placeholder="Rejection reason"
                                                className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                                            />
                                            <button
                                                type="submit"
                                                className="mt-3 w-full rounded border border-red-300/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-300 hover:text-potomac-primary"
                                            >
                                                Reject
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
