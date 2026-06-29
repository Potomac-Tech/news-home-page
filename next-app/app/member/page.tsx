import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { ScoutCheckoutButton } from "./ScoutCheckoutButton";
import { loadPublicTickerItems } from "../_data/marketQuotes";

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

    const tickerItems = await loadPublicTickerItems(6);

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl gap-8 px-4 py-20 md:px-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
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
                        . Membership status, entitlements, and paid
                        intelligence modules appear here as access is approved.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link
                            href="/news"
                            className="rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            News
                        </Link>
                        <Link
                            href="/member/summits"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Summit tracker
                        </Link>
                        <Link
                            href="/member/economy"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Economy dashboard
                        </Link>
                        <Link
                            href="/member/marketplace"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Data marketplace
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
                <aside className="glass-card h-fit rounded p-6">
                    <div className="border-b border-white/10 pb-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Delayed quotes
                        </p>
                        <h2 className="mt-2 font-serif text-2xl text-white">
                            Company Ticker
                        </h2>
                    </div>
                    <div className="mt-5 space-y-4">
                        {tickerItems.map((item) => (
                            <div
                                key={`${item.symbol}-${item.label}`}
                                className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-mono text-sm font-bold text-potomac-gold">
                                            {item.symbol}
                                        </p>
                                        <p className="mt-1 text-sm text-potomac-cream/70">
                                            {item.label}
                                        </p>
                                    </div>
                                    <p
                                        className={
                                            item.trend === "down"
                                                ? "text-right text-sm font-bold text-red-200"
                                                : item.trend === "up"
                                                  ? "text-right text-sm font-bold text-potomac-gold"
                                                  : "text-right text-sm font-bold text-white"
                                        }
                                    >
                                        {item.value}
                                    </p>
                                </div>
                                <p className="mt-2 text-xs text-potomac-cream/45">
                                    {item.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </section>
    );
}
