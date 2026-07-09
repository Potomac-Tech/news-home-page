import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "../auth/login/LoginForm";
import { tierConfig } from "../_data/tiers";

export const metadata: Metadata = {
    title: "Request Access",
    description:
        "Sign in or request free Explorer access to Cabeus Explorer lunar intelligence.",
    alternates: {
        canonical: "/request-access",
    },
};

export default function RequestAccessPage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-8">
                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Sign in / Sign up
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Start with free {tierConfig.explorer.publicName} access
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                        Explorer is the default free membership path. Use a
                        secure sign-in link if you already have access, or
                        submit the free Explorer request for review.
                    </p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <Link
                            href="/apply"
                            className="bg-potomac-gold px-5 py-3 text-center font-mono text-[0.68rem] font-bold uppercase text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Request Explorer
                        </Link>
                        <Link
                            href="/upgrade"
                            className="border border-potomac-regolith/45 px-5 py-3 text-center font-mono text-[0.68rem] font-bold uppercase text-potomac-cream transition hover:border-potomac-gold hover:text-potomac-gold"
                        >
                            Premium options
                        </Link>
                    </div>
                </div>
                <LoginForm />
            </div>
        </section>
    );
}
