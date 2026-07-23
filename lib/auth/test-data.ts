import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type TestDataAccessContext = {
    canUploadTestData: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const testDataUploaderRoles = [
    "scout",
    "meridian",
    "editor",
    "analyst",
    "admin",
];

export async function getTestDataAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<TestDataAccessContext> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canUploadTestData: false,
            state: profileGate.state,
            userId: profileGate.userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: profileGate.profileHref,
        };
    }
    const userId = profileGate.userId;

    const { data: role, error: roleError } = await supabase
        .from("member_role_assignments")
        .select("role_id")
        .eq("user_id", userId)
        .in("role_id", testDataUploaderRoles)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (roleError) {
        throw new Error(roleError.message);
    }

    if (!role) {
        return {
            canUploadTestData: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    return {
        canUploadTestData: true,
        state: "authorized",
        userId,
        roleId: role.role_id as string,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}
