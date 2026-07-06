import type { Metadata } from "next";
import Link from "next/link";
import { supportEmail } from "../../_data/trust";

export const metadata: Metadata = {
    title: "Account Deletion",
    description:
        "Request Cabeus Explorer account deletion, export review, and membership cancellation support.",
    alternates: {
        canonical: "/account/delete",
    },
};

const deletionMailto = `mailto:${supportEmail}?subject=Cabeus%20Explorer%20account%20deletion%20request`;

export default function AccountDeletionPage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="max-w-4xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                        Account lifecycle
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                        Account Deletion Request
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Request deletion review for your Cabeus Explorer account,
                        membership records, saved work, and paid workflow data.
                        Some records may need to be retained for billing,
                        security, legal, audit, or organization-administration
                        reasons.
                    </p>
                </div>
                <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className="glass-card rounded p-6">
                        <h2 className="font-serif text-2xl text-white">
                            Request Checklist
                        </h2>
                        <ul className="mt-5 grid gap-3 text-sm leading-6 text-potomac-cream/70">
                            <li>Use the email address associated with your account.</li>
                            <li>Include your organization name if you use Command access.</li>
                            <li>State whether Scout billing should be cancelled.</li>
                            <li>Ask for export review before deletion if needed.</li>
                            <li>Do not include passwords, API secrets, or private keys.</li>
                        </ul>
                        <a
                            href={deletionMailto}
                            className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Email deletion request
                        </a>
                    </section>
                    <aside className="rounded border border-white/10 p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Related pages
                        </p>
                        <div className="mt-4 grid gap-3">
                            <Link
                                href="/legal/privacy"
                                className="text-sm text-potomac-cream/70 transition hover:text-potomac-gold"
                            >
                                Privacy
                            </Link>
                            <Link
                                href="/legal/data-safety"
                                className="text-sm text-potomac-cream/70 transition hover:text-potomac-gold"
                            >
                                Data Safety
                            </Link>
                            <Link
                                href="/account"
                                className="text-sm text-potomac-cream/70 transition hover:text-potomac-gold"
                            >
                                Account center
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}
