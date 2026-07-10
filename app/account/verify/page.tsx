import Link from "next/link";
import { redirect } from "next/navigation";
import {
    getProfileGateContext,
    safeReturnPath,
} from "../../../lib/auth/profile-completion";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const nextPath = safeReturnPath((await searchParams).next);

    if (!hasPotomacSupabasePublicConfig()) {
        redirect(`/request-access?tab=signin&next=${encodeURIComponent(nextPath)}`);
    }

    const supabase = await createClient();
    const profileGate = await getProfileGateContext({ supabase, nextPath });

    if (profileGate.state === "signed_out") {
        redirect(profileGate.loginHref);
    }

    if (profileGate.state === "profile_incomplete" && profileGate.profileHref) {
        redirect(profileGate.profileHref);
    }

    if (profileGate.state === "ready") {
        redirect(nextPath);
    }

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-3xl items-center px-4 py-16 md:px-8">
                <div className="glass-card w-full rounded p-6 md:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Verification required
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-5xl">
                        Confirm your email to continue
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-potomac-cream/75">
                        Member intelligence is available after the email address on your account is verified. Check your inbox and spam folder for the confirmation message, then return here to continue.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href={`/request-access?tab=signin&next=${encodeURIComponent(nextPath)}`}
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Check sign-in status
                        </Link>
                        <Link
                            href="/request-access"
                            className="rounded border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-cream transition hover:border-potomac-gold hover:text-potomac-gold"
                        >
                            Need a new link?
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
