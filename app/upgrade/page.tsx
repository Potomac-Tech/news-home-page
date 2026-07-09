import type { Metadata } from "next";
import Link from "next/link";
import { tierConfig } from "../_data/tiers";

export const metadata: Metadata = {
    title: "Upgrade",
    description:
        "Choose Scout professional access or Meridian contract discussion for Cabeus Explorer.",
    alternates: {
        canonical: "/upgrade",
    },
};

export default function UpgradePage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="max-w-4xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                        Upgrade path
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                        Scout or {tierConfig.enterprise.publicName}
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Scout is self-serve professional access at{" "}
                        {tierConfig.scout.price}/user/year. Meridian is handled
                        through a submitted inquiry and manual contract discussion.
                    </p>
                </div>
                <div className="mt-10 grid gap-5 md:grid-cols-2">
                    <article className="glass-card rounded p-6">
                        <h2 className="font-serif text-3xl text-white">
                            {tierConfig.scout.publicName}
                        </h2>
                        <p className="mt-3 text-4xl font-bold text-white">
                            {tierConfig.scout.price}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-potomac-cream/45">
                            {tierConfig.scout.cadence}
                        </p>
                        <p className="mt-5 text-sm leading-6 text-potomac-cream/70">
                            {tierConfig.scout.description}
                        </p>
                        <Link
                            href="/member"
                            className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Continue to workspace
                        </Link>
                    </article>
                    <article className="glass-card rounded p-6">
                        <h2 className="font-serif text-3xl text-white">
                            {tierConfig.enterprise.publicName}
                        </h2>
                        <p className="mt-3 text-4xl font-bold text-white">
                            Contract
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-potomac-cream/45">
                            Manual review
                        </p>
                        <p className="mt-5 text-sm leading-6 text-potomac-cream/70">
                            Submit an organization inquiry. Cabeus Explorer will
                            follow up for contract discussion after review.
                        </p>
                        <Link
                            href="/command"
                            className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Request Meridian
                        </Link>
                    </article>
                </div>
            </div>
        </section>
    );
}
