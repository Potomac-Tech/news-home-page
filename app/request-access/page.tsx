import type { Metadata } from "next";
import { tierConfig } from "../_data/tiers";
import { RequestAccessClient } from "./RequestAccessClient";

export const metadata: Metadata = {
    title: "Request Access",
    description:
        "Sign in or request free Explorer access to Cabeus Explorer lunar intelligence.",
    alternates: {
        canonical: "/request-access",
    },
};

export default async function RequestAccessPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; mode?: string }>;
}) {
    const params = await searchParams;

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
                </div>
                <RequestAccessClient initialTab={params.tab} mode={params.mode} />
            </div>
        </section>
    );
}
