import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

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
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        redirect("/auth/login?next=/organization");
    }

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
