import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { tierConfig } from "../_data/tiers";
import { createClient } from "../../lib/supabase/server";
import { getProfileGateContext, safeReturnPath } from "../../lib/auth/profile-completion";
import { ScoutCheckoutButton } from "../member/ScoutCheckoutButton";
import { UpgradeAnalytics } from "./UpgradeAnalytics";

export const metadata: Metadata = {
    title: "Upgrade",
    description:
        `Choose Scout professional access or ${tierConfig.enterprise.publicName} contract discussion for Cabeus Explorer.`,
    alternates: {
        canonical: "/upgrade",
    },
};

type UpgradePageProps = {
    searchParams: Promise<{ tier?: string; source?: string; content?: string; object?: string; next?: string; campaign?: string }>;
};

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
    const { tier, source, content, object, next, campaign } = await searchParams;
    const requestedTier = tier === "meridian" ? "meridian" : "scout";
    const returnUrl = safeReturnPath(next, "/member");
    const upgradeUrl = `/upgrade?tier=${requestedTier}&next=${encodeURIComponent(returnUrl)}${source ? `&source=${encodeURIComponent(source)}` : ""}${content ? `&content=${encodeURIComponent(content)}` : ""}${object ? `&object=${encodeURIComponent(object)}` : ""}${campaign ? `&campaign=${encodeURIComponent(campaign)}` : ""}`;
    const supabase = await createClient();
    const gate = await getProfileGateContext({ supabase, nextPath: upgradeUrl });
    if (gate.state === "signed_out" || gate.state === "email_unverified") redirect(gate.loginHref);
    if (gate.state === "profile_incomplete" && gate.profileHref) redirect(gate.profileHref);
    const { data: commandRole } = await supabase.from("member_role_assignments").select("id").eq("user_id", gate.userId).eq("role_id", "command_user").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).limit(1).maybeSingle();
    if (requestedTier === "meridian" && commandRole) redirect(returnUrl);
    const commandHref = `/command?next=${encodeURIComponent(returnUrl)}${source ? `&source=${encodeURIComponent(source)}` : ""}${content ? `&content=${encodeURIComponent(content)}` : ""}${campaign ? `&campaign=${encodeURIComponent(campaign)}` : ""}`;

    return (
        <section className="bg-grid-pattern">
            <UpgradeAnalytics tier={requestedTier} source={source} content={content} objectId={object} campaign={campaign} />
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="max-w-4xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                        Upgrade path
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                        Scout or {tierConfig.enterprise.publicName}
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Continue from the intelligence item you selected. Scout is self-serve professional access; {tierConfig.enterprise.publicName} is handled through a submitted contract discussion.
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
                        {requestedTier === "scout" ? <div className="mt-6"><ScoutCheckoutButton returnUrl={returnUrl} /></div> : <Link href={upgradeUrl.replace("tier=meridian", "tier=scout")} className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream">Choose Scout</Link>}
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
                            href={commandHref}
                            className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            {requestedTier === "meridian" ? "Continue to contract discussion" : `Request ${tierConfig.enterprise.publicName}`}
                        </Link>
                    </article>
                </div>
            </div>
        </section>
    );
}
