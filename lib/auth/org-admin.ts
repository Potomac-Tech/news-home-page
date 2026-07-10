import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { getProfileGateContext } from "./profile-completion";

type OrganizationAdminContext = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
    organizationIds: string[];
};

type OrganizationReference = {
    organization_id: string | null;
};

function uniqueOrganizationIds(...groups: OrganizationReference[][]) {
    return Array.from(
        new Set(
            groups
                .flat()
                .map((item) => item.organization_id)
                .filter((id): id is string => Boolean(id))
        )
    );
}

export async function requireOrganizationAdmin(): Promise<OrganizationAdminContext> {
    const supabase = await createClient();
    const profileGate = await getProfileGateContext({
        supabase,
        nextPath: "/organization",
    });
    if (profileGate.state === "signed_out" || profileGate.state === "email_unverified") {
        redirect(profileGate.loginHref);
    }
    if (profileGate.state === "profile_incomplete" && profileGate.profileHref) {
        redirect(profileGate.profileHref);
    }
    const userId = profileGate.userId;

    const now = new Date().toISOString();

    const { data: roleAssignments, error: roleError } = await supabase
        .from("member_role_assignments")
        .select("organization_id")
        .eq("user_id", userId)
        .eq("role_id", "org_admin")
        .not("organization_id", "is", null)
        .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (roleError) {
        throw new Error(roleError.message);
    }

    const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .eq("role", "org_admin")
        .eq("status", "active");

    if (membershipError) {
        throw new Error(membershipError.message);
    }

    const organizationIds = uniqueOrganizationIds(
        (roleAssignments ?? []) as OrganizationReference[],
        (memberships ?? []) as OrganizationReference[]
    );

    if (organizationIds.length === 0) {
        redirect("/member");
    }

    return {
        supabase,
        userId,
        organizationIds,
    };
}
