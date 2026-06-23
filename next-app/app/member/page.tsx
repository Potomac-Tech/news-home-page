import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { ScoutCheckoutButton } from "./ScoutCheckoutButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Member Workspace",
};

type AuthClaims = {
    sub?: string;
    email?: string;
};

export default async function MemberPage() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims as AuthClaims | undefined;

    if (error || !claims?.sub) {
        redirect("/auth/login?next=/member");
    }

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Protected route
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Member Workspace
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        You are signed in as{" "}
                        <span className="text-potomac-gold">
                            {claims.email ?? claims.sub}
                        </span>
                        . Membership status and entitlements will appear here
                        after the access-control schema is added.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link
                            href="/news"
                            className="rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            News
                        </Link>
                        <Link
                            href="/auth/logout"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Sign out
                        </Link>
                    </div>
                    <ScoutCheckoutButton />
                </div>
            </div>
        </section>
    );
}
