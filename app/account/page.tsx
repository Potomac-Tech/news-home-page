import type { Metadata } from "next";
import Link from "next/link";
import { tierConfig } from "../_data/tiers";

export const metadata: Metadata = {
    title: "Account",
    description:
        "Cabeus Explorer account route for member workspace, organization admin, pricing, application, and sign-in paths.",
    alternates: {
        canonical: "/account",
    },
};

const accountLinks = [
    {
        href: "/request-access?tab=signin",
        label: "Sign in",
        detail: "Enter the protected member workspace.",
    },
    {
        href: "/member",
        label: "Member workspace",
        detail: "Open approved member modules and Scout checkout.",
    },
    {
        href: "/organization",
        label: "Organization",
        detail: `Review ${tierConfig.enterprise.publicName} organization seats and entitlements.`,
    },
    {
        href: "/pricing",
        label: "Pricing",
        detail: `Compare Explorer, Scout, and ${tierConfig.enterprise.publicName} access.`,
    },
    {
        href: "/request-access",
        label: "Request access",
        detail: "Request free Explorer access.",
    },
    {
        href: "/command",
        label: tierConfig.enterprise.publicName,
        detail: "Request organization-level access.",
    },
    {
        href: "/legal/cookies",
        label: "Cookie preferences",
        detail: "Review cookie categories and save local consent choices.",
    },
    {
        href: "/account/delete",
        label: "Account deletion",
        detail: "Request account deletion and paid-access cancellation review.",
    },
    {
        href: "/legal/data-safety",
        label: "Data safety",
        detail: "Review security, data handling, uploads, exports, and support paths.",
    },
];

export default function AccountPage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="max-w-4xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                        Account paths
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                        Access and account center
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        A single shell for sign-in, member workspace,
                        organization administration, pricing, Explorer
                        access, and {tierConfig.enterprise.publicName} inquiry paths.
                    </p>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accountLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="rounded border border-potomac-gold/35 p-5 transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            <span className="text-sm font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                {link.label}
                            </span>
                            <span className="mt-3 block text-sm leading-6 text-potomac-cream/70">
                                {link.detail}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
