import { createClient } from "../supabase/server";

export type ProfileGateState =
    | "signed_out"
    | "email_unverified"
    | "profile_incomplete"
    | "ready";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ProfileCompletionRecord = {
    user_id: string;
    full_name: string;
    affiliation: string;
    role_title: string;
    country_code: string;
    timezone: string;
    primary_interest_areas: string[];
    communication_preference: string;
    phone: string | null;
    budget_range: string | null;
    procurement_timeline: string | null;
    use_case_detail: string | null;
    completed_at: string;
};

export function safeReturnPath(value: string | null | undefined, fallback = "/member") {
    return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function profileCompletionHref(nextPath: string) {
    return `/account/profile/complete?next=${encodeURIComponent(safeReturnPath(nextPath))}`;
}

export function verificationRequiredHref(nextPath: string) {
    return `/account/verify?next=${encodeURIComponent(safeReturnPath(nextPath))}`;
}

export async function getProfileGateContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}) {
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    const requestAccessHref = `/request-access?tab=signin&next=${encodeURIComponent(safeReturnPath(nextPath))}`;

    if (claimsError || !userId) {
        return {
            state: "signed_out" as const,
            userId: null,
            loginHref: requestAccessHref,
            profileHref: null,
            profile: null,
        };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email_confirmed_at) {
        return {
            state: "email_unverified" as const,
            userId,
            loginHref: verificationRequiredHref(nextPath),
            profileHref: null,
            profile: null,
        };
    }

    const { data, error } = await supabase
        .from("member_profile_completions")
        .select("user_id,full_name,affiliation,role_title,country_code,timezone,primary_interest_areas,communication_preference,phone,budget_range,procurement_timeline,use_case_detail,completed_at")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
        return {
            state: "profile_incomplete" as const,
            userId,
            loginHref: requestAccessHref,
            profileHref: profileCompletionHref(nextPath),
            profile: null,
        };
    }

    return {
        state: "ready" as const,
        userId,
        loginHref: requestAccessHref,
        profileHref: null,
        profile: data as ProfileCompletionRecord,
    };
}
