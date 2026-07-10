import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CommandInterestForm } from "./CommandInterestForm";
import { tierConfig } from "../_data/tiers";
import { createClient } from "../../lib/supabase/server";
import { getProfileGateContext, safeReturnPath } from "../../lib/auth/profile-completion";

export const metadata: Metadata = {
    title: tierConfig.enterprise.publicName,
    description:
        `Register ${tierConfig.enterprise.publicName} interest for organization-level Cabeus Explorer lunar intelligence access.`,
    alternates: {
        canonical: "/command",
    },
};

type CommandPageProps = {
    searchParams: Promise<{
        status?: string;
        source?: string;
        content?: string;
        next?: string;
        campaign?: string;
    }>;
};

export default async function CommandPage({ searchParams }: CommandPageProps) {
    const { status, source, content, next, campaign } = await searchParams;
    const supabase = await createClient();
    const gate = await getProfileGateContext({ supabase, nextPath: "/command" });
    if (gate.state === "signed_out" || gate.state === "email_unverified") {
        redirect(gate.loginHref);
    }
    if (gate.state === "profile_incomplete" && gate.profileHref) {
        redirect(gate.profileHref);
    }

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-[0.85fr_1.15fr] md:px-8">
                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Organization-level intelligence
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        {tierConfig.enterprise.publicName} Access
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                        {tierConfig.enterprise.publicName} access is handled through direct review and
                        admin approval for organizations that need deeper lunar
                        intelligence, analyst support, and mission briefings.
                    </p>
                </div>
                <CommandInterestForm
                    status={status}
                    sourceCta={source}
                    sourceContent={content}
                    returnUrl={safeReturnPath(next, "/command")}
                    attribution={{ campaign: campaign ?? "", source: source ?? "" }}
                    defaultName={gate.profile?.full_name ?? ""}
                    defaultOrganization={gate.profile?.affiliation ?? ""}
                    defaultTitle={gate.profile?.role_title ?? ""}
                    communicationPreference={gate.profile?.communication_preference ?? ""}
                />
            </div>
        </section>
    );
}
