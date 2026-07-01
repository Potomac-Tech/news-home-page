import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { getLunarMissionAccess } from "../../../lib/auth/lunar-missions";
import { LunarMissionTracker } from "../../_components/LunarMissionTracker";
import { loadLunarMissionTracker } from "../../_data/lunarMissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Member Mission Tracker",
};

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Member mission tracker
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Member mission details are read from the Potomac
                        Supabase project. Configure the public environment
                        variables and sign in with Explorer, Scout, Command, or
                        staff access to view gated tracker rows.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/launches"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Public launches
                        </Link>
                        <Link
                            href="/spacecraft"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Public spacecraft
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function LockedGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Member mission tracker
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Explorer access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Mission status timelines and gated object details are
                        available after membership approval. Public launch and
                        spacecraft tracker pages remain available.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/apply"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Apply
                        </Link>
                        <Link
                            href="/member"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default async function MemberMissionsPage({
    searchParams,
}: {
    searchParams?: Promise<{ filter?: string }>;
}) {
    const params = await searchParams;
    const allowedFilters = new Set([
        "launches",
        "landers",
        "satellites",
        "active",
    ]);
    const activeFilter =
        params?.filter && allowedFilters.has(params.filter)
            ? params.filter
            : "all";

    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getLunarMissionAccess({ supabase });

    if (access.state === "anonymous" && !access.userId) {
        redirect("/auth/login?next=/member/missions");
    }

    if (!access.canReadMemberDetails) {
        return <LockedGate />;
    }

    const missions = await loadLunarMissionTracker({
        supabase,
        includeMemberOnly: true,
    });

    return (
        <LunarMissionTracker
            missions={missions}
            mode="member"
            activeFilter={activeFilter}
            title="Member Mission Tracker"
            description="Explorer, Scout, Command, and staff views for lunar mission status, source freshness, object details, payload records, and mission detail pages."
            showTierNote={false}
        />
    );
}
