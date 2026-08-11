import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileGateContext } from "../../lib/auth/profile-completion";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import { AccountProfileForm } from "./AccountProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Account",
    robots: { index: false, follow: false },
};

type AuthClaims = {
    sub?: string;
    email?: string;
};

type MemberProfile = {
    email: string;
    full_name: string | null;
    company: string | null;
    title: string | null;
    status: string;
    base_tier: string;
};

type RoleAssignment = {
    role_id: string;
    organization_id: string | null;
};

type OrganizationMembership = {
    organization_id: string;
    role: string;
    status: string;
};

type Organization = {
    id: string;
    name: string;
    status: string;
};

const membershipPriority = ["meridian", "scout", "explorer"];

function titleCase(value: string) {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function membershipLabel(profile: MemberProfile | null, roles: RoleAssignment[]) {
    const role = membershipPriority.find((candidate) =>
        roles.some((assignment) => assignment.role_id === candidate)
    );
    const tier = role ?? profile?.base_tier ?? "explorer";
    return tier === "member" ? "Explorer" : titleCase(tier);
}

function ConfigGate() {
    return (
        <section className="bg-cabeus-paper text-cabeus-ink">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-[92rem] px-5 py-16 md:px-10 md:py-24">
                <div className="max-w-3xl border-y border-cabeus-line py-10">
                    <p className="brand-kicker">Account</p>
                    <h1 className="mt-4 font-serif text-5xl font-medium leading-[0.95] md:text-7xl">
                        Member sign-in is being configured.
                    </h1>
                    <p className="mt-6 max-w-2xl text-base leading-7 text-cabeus-muted">
                        Account access will open after the secure sign-in service is
                        connected. Public reporting remains available in the meantime.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link href="/request-access" className="brand-button inline-flex">
                            Sign Up
                        </Link>
                        <Link href="/archives" className="brand-button brand-button-outline inline-flex">
                            Read the news
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default async function MemberPage() {
    if (!hasPotomacSupabasePublicConfig()) return <ConfigGate />;

    const supabase = await createClient();
    const profileGate = await getProfileGateContext({ supabase, nextPath: "/member" });
    if (profileGate.state === "signed_out" || profileGate.state === "email_unverified") {
        redirect(profileGate.loginHref);
    }
    if (profileGate.state === "profile_incomplete" && profileGate.profileHref) {
        redirect(profileGate.profileHref);
    }

    const claims = (await supabase.auth.getClaims()).data?.claims as AuthClaims | undefined;
    if (!claims?.sub) redirect("/request-access?tab=signin&next=%2Fmember");

    const [{ data: profileData }, { data: roleData }, { data: membershipData }] =
        await Promise.all([
            supabase
                .from("member_profiles")
                .select("email,full_name,company,title,status,base_tier")
                .eq("user_id", claims.sub)
                .maybeSingle(),
            supabase
                .from("member_role_assignments")
                .select("role_id,organization_id")
                .eq("user_id", claims.sub),
            supabase
                .from("organization_members")
                .select("organization_id,role,status")
                .eq("user_id", claims.sub),
        ]);

    const profile = profileData as MemberProfile | null;
    const roles = (roleData ?? []) as RoleAssignment[];
    const memberships = (membershipData ?? []) as OrganizationMembership[];
    const organizationIds = [...new Set([
        ...memberships.map((membership) => membership.organization_id),
        ...roles.flatMap((role) => role.organization_id ? [role.organization_id] : []),
    ])];
    const { data: organizationData } = organizationIds.length
        ? await supabase
              .from("organizations")
              .select("id,name,status")
              .in("id", organizationIds)
        : { data: [] };
    const organizations = (organizationData ?? []) as Organization[];
    const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));

    const accountEmail = claims.email ?? profile?.email ?? "";
    const editableProfile = profileGate.profile;
    const accountRows = [
        { label: "Membership", value: membershipLabel(profile, roles) },
        { label: "Account status", value: titleCase(profile?.status ?? "active") },
    ];

    return (
        <section className="bg-cabeus-paper text-cabeus-ink">
            <div className="mx-auto w-full max-w-[92rem] px-5 py-12 md:px-10 md:py-16">
                <header className="border-b border-cabeus-line pb-10">
                    <p className="brand-kicker">Cabeus Explorer / Account</p>
                    <h1 className="mt-4 max-w-4xl font-serif text-5xl font-medium leading-[0.9] md:text-7xl">
                        Your account.
                    </h1>
                    <p className="mt-6 max-w-2xl text-base leading-7 text-cabeus-muted">
                        Review the identity, organization, and membership information
                        connected to your Cabeus Explorer access.
                    </p>
                </header>

                <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="brand-kicker">Member information</p>
                        <h2 className="mt-3 font-serif text-4xl font-medium">Edit account information</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-cabeus-muted">
                            Keep the contact and professional details associated with your account current.
                        </p>
                        <div className="mt-6">
                            <AccountProfileForm
                                email={accountEmail}
                                fullName={editableProfile?.full_name || profile?.full_name || ""}
                                title={editableProfile?.role_title || profile?.title || ""}
                                company={editableProfile?.affiliation || profile?.company || ""}
                            />
                        </div>
                    </div>

                    <aside className="border-l border-cabeus-line pl-6">
                        <p className="brand-kicker">Membership</p>
                        <dl className="mt-5 border-t border-cabeus-line">
                            {accountRows.map((row) => (
                                <div key={row.label} className="border-b border-cabeus-line py-4">
                                    <dt className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-cabeus-muted">
                                        {row.label}
                                    </dt>
                                    <dd className="mt-1 text-base text-cabeus-ink">{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="brand-kicker mt-8">Account actions</p>
                        <div className="mt-5 grid gap-3">
                            <Link
                                href="/request-access?tab=signin&mode=recovery"
                                className="brand-button brand-button-outline inline-flex"
                            >
                                Reset password
                            </Link>
                            <form action="/auth/logout" method="post">
                                <button type="submit" className="brand-button inline-flex w-full justify-center">
                                    Sign out
                                </button>
                            </form>
                        </div>
                    </aside>
                </div>

                <section className="border-t border-cabeus-line py-10">
                    <p className="brand-kicker">Organization</p>
                    <h2 className="mt-3 font-serif text-4xl font-medium">Organization information</h2>
                    {organizationIds.length ? (
                        <div className="mt-7 grid border-l border-t border-cabeus-line md:grid-cols-2">
                            {organizationIds.map((organizationId) => {
                                const organization = organizationById.get(organizationId);
                                const membership = memberships.find((item) => item.organization_id === organizationId);
                                return (
                                    <article key={organizationId} className="border-b border-r border-cabeus-line p-6">
                                        <h3 className="font-serif text-3xl font-medium">
                                            {organization?.name ?? profile?.company ?? "Organization"}
                                        </h3>
                                        <dl className="mt-5 space-y-3 text-sm">
                                            <div className="flex justify-between gap-4 border-t border-cabeus-line pt-3">
                                                <dt className="text-cabeus-muted">Organization role</dt>
                                                <dd>{titleCase(membership?.role ?? "member")}</dd>
                                            </div>
                                            <div className="flex justify-between gap-4 border-t border-cabeus-line pt-3">
                                                <dt className="text-cabeus-muted">Membership status</dt>
                                                <dd>{titleCase(membership?.status ?? organization?.status ?? "active")}</dd>
                                            </div>
                                        </dl>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="mt-5 max-w-2xl text-base leading-7 text-cabeus-muted">
                            No organization is currently associated with this account.
                        </p>
                    )}
                </section>
            </div>
        </section>
    );
}
