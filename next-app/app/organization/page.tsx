import type { Metadata } from "next";
import { requireOrganizationAdmin } from "../../lib/auth/org-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Organization Portal",
};

type Organization = {
    id: string;
    name: string;
    slug: string;
    status: string;
    primary_billing_email: string | null;
    seat_limit: number | null;
    command_contract_reference: string | null;
    updated_at: string;
};

type OrganizationMember = {
    id: string;
    organization_id: string;
    user_id: string;
    role: string;
    status: string;
    joined_at: string | null;
    created_at: string;
};

type MemberProfile = {
    user_id: string;
    email: string;
    full_name: string | null;
    company: string | null;
    title: string | null;
    status: string;
    base_tier: string;
};

type Entitlement = {
    id: string;
    organization_id: string;
    tier: string;
    status: string;
    source: string;
    starts_at: string | null;
    ends_at: string | null;
    stripe_subscription_id: string | null;
    external_reference: string | null;
    updated_at: string;
};

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString();
}

function formatLabel(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function activeSeatCount(members: OrganizationMember[]) {
    return members.filter((member) => member.status === "active").length;
}

export default async function OrganizationPage() {
    const { supabase, organizationIds } = await requireOrganizationAdmin();

    const { data: organizationData, error: organizationError } =
        await supabase
            .from("organizations")
            .select(
                "id,name,slug,status,primary_billing_email,seat_limit,command_contract_reference,updated_at"
            )
            .in("id", organizationIds)
            .order("name", { ascending: true });

    if (organizationError) {
        throw new Error(organizationError.message);
    }

    const organizations = (organizationData ?? []) as Organization[];

    const { data: memberData, error: memberError } = await supabase
        .from("organization_members")
        .select("id,organization_id,user_id,role,status,joined_at,created_at")
        .in("organization_id", organizationIds)
        .order("created_at", { ascending: true });

    if (memberError) {
        throw new Error(memberError.message);
    }

    const members = (memberData ?? []) as OrganizationMember[];
    const memberUserIds = Array.from(
        new Set(members.map((member) => member.user_id))
    );

    const { data: profileData, error: profileError } = memberUserIds.length
        ? await supabase
              .from("member_profiles")
              .select("user_id,email,full_name,company,title,status,base_tier")
              .in("user_id", memberUserIds)
        : { data: [], error: null };

    if (profileError) {
        throw new Error(profileError.message);
    }

    const profiles = (profileData ?? []) as MemberProfile[];
    const profilesByUserId = new Map(
        profiles.map((profile) => [profile.user_id, profile])
    );

    const { data: entitlementData, error: entitlementError } = await supabase
        .from("entitlements")
        .select(
            "id,organization_id,tier,status,source,starts_at,ends_at,stripe_subscription_id,external_reference,updated_at"
        )
        .in("organization_id", organizationIds)
        .order("updated_at", { ascending: false });

    if (entitlementError) {
        throw new Error(entitlementError.message);
    }

    const entitlements = (entitlementData ?? []) as Entitlement[];

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Organization workspace
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Organization Portal
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Review seats, members, Command entitlements, and billing
                        contacts for the organizations you administer.
                    </p>
                </div>

                <div className="mt-12 space-y-8">
                    {organizations.map((organization) => {
                        const organizationMembers = members.filter(
                            (member) =>
                                member.organization_id === organization.id
                        );
                        const organizationEntitlements = entitlements.filter(
                            (entitlement) =>
                                entitlement.organization_id === organization.id
                        );
                        const activeSeats = activeSeatCount(
                            organizationMembers
                        );
                        const seatLimit =
                            organization.seat_limit?.toLocaleString() ??
                            "Unlimited";

                        return (
                            <article
                                key={organization.id}
                                className="glass-card rounded p-6"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-potomac-gold">
                                            {formatLabel(organization.status)}
                                        </p>
                                        <h2 className="mt-2 font-serif text-3xl text-white">
                                            {organization.name}
                                        </h2>
                                        <p className="mt-2 text-sm text-potomac-cream/65">
                                            {organization.slug}
                                        </p>
                                    </div>
                                    <dl className="grid gap-4 text-sm text-potomac-cream/75 sm:grid-cols-2 lg:min-w-[28rem]">
                                        <div>
                                            <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                Seats
                                            </dt>
                                            <dd className="mt-1 text-white">
                                                {activeSeats.toLocaleString()} /{" "}
                                                {seatLimit}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                Billing
                                            </dt>
                                            <dd className="mt-1 text-white">
                                                {organization.primary_billing_email ??
                                                    "Not set"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                Contract
                                            </dt>
                                            <dd className="mt-1 text-white">
                                                {organization.command_contract_reference ??
                                                    "Not set"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                                Updated
                                            </dt>
                                            <dd className="mt-1 text-white">
                                                {formatDate(
                                                    organization.updated_at
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_24rem]">
                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                            Members
                                        </h3>
                                        {organizationMembers.length === 0 ? (
                                            <p className="mt-4 text-sm text-potomac-cream/70">
                                                No members have been assigned.
                                            </p>
                                        ) : (
                                            <div className="mt-4 overflow-x-auto">
                                                <table className="min-w-full border-collapse text-left text-sm">
                                                    <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                        <tr>
                                                            <th className="py-3 pr-4">
                                                                Member
                                                            </th>
                                                            <th className="py-3 pr-4">
                                                                Role
                                                            </th>
                                                            <th className="py-3 pr-4">
                                                                Status
                                                            </th>
                                                            <th className="py-3 pr-4">
                                                                Joined
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/10 text-potomac-cream/75">
                                                        {organizationMembers.map(
                                                            (member) => {
                                                                const profile =
                                                                    profilesByUserId.get(
                                                                        member.user_id
                                                                    );

                                                                return (
                                                                    <tr
                                                                        key={
                                                                            member.id
                                                                        }
                                                                    >
                                                                        <td className="py-4 pr-4">
                                                                            <div className="font-semibold text-white">
                                                                                {profile?.full_name ??
                                                                                    profile?.email ??
                                                                                    member.user_id}
                                                                            </div>
                                                                            <div className="mt-1 text-xs text-potomac-cream/55">
                                                                                {profile?.title ??
                                                                                    profile?.base_tier ??
                                                                                    "Member"}
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-4 pr-4">
                                                                            {formatLabel(
                                                                                member.role
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 pr-4">
                                                                            {formatLabel(
                                                                                member.status
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 pr-4">
                                                                            {formatDate(
                                                                                member.joined_at
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                            Entitlements
                                        </h3>
                                        <div className="mt-4 space-y-4">
                                            {organizationEntitlements.length ===
                                            0 ? (
                                                <p className="text-sm text-potomac-cream/70">
                                                    No organization entitlements
                                                    are active.
                                                </p>
                                            ) : (
                                                organizationEntitlements.map(
                                                    (entitlement) => (
                                                        <div
                                                            key={entitlement.id}
                                                            className="border-l border-potomac-gold/40 pl-4"
                                                        >
                                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                                <p className="font-semibold text-white">
                                                                    {formatLabel(
                                                                        entitlement.tier
                                                                    )}
                                                                </p>
                                                                <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                                    {formatLabel(
                                                                        entitlement.status
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <dl className="mt-3 space-y-2 text-sm text-potomac-cream/70">
                                                                <div className="flex justify-between gap-4">
                                                                    <dt>
                                                                        Source
                                                                    </dt>
                                                                    <dd className="text-right text-white">
                                                                        {formatLabel(
                                                                            entitlement.source
                                                                        )}
                                                                    </dd>
                                                                </div>
                                                                <div className="flex justify-between gap-4">
                                                                    <dt>
                                                                        Starts
                                                                    </dt>
                                                                    <dd className="text-right text-white">
                                                                        {formatDate(
                                                                            entitlement.starts_at
                                                                        )}
                                                                    </dd>
                                                                </div>
                                                                <div className="flex justify-between gap-4">
                                                                    <dt>Ends</dt>
                                                                    <dd className="text-right text-white">
                                                                        {formatDate(
                                                                            entitlement.ends_at
                                                                        )}
                                                                    </dd>
                                                                </div>
                                                                <div className="flex justify-between gap-4">
                                                                    <dt>
                                                                        Reference
                                                                    </dt>
                                                                    <dd className="text-right text-white">
                                                                        {entitlement.stripe_subscription_id ??
                                                                            entitlement.external_reference ??
                                                                            "Not set"}
                                                                    </dd>
                                                                </div>
                                                            </dl>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
