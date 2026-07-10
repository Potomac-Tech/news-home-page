import { NextResponse } from "next/server";
import { getProfileGateContext } from "../../../lib/auth/profile-completion";
import { createClient } from "../../../lib/supabase/server";

function getSafeNextPath(nextPath: string | null) {
    if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
        return nextPath;
    }

    return "/member";
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
    const redirectUrl = new URL(nextPath, requestUrl.origin);

    for (const key of ["source", "campaign", "content", "tier"]) {
        const value = requestUrl.searchParams.get(key);
        if (value && !redirectUrl.searchParams.has(key)) {
            redirectUrl.searchParams.set(key, value);
        }
    }

    if (code) {
        const supabase = await createClient();
        await supabase.auth.exchangeCodeForSession(code);

        const profileGate = await getProfileGateContext({
            supabase,
            nextPath: `${redirectUrl.pathname}${redirectUrl.search}`,
        });

        if (profileGate.state === "profile_incomplete" && profileGate.profileHref) {
            const profileUrl = new URL(profileGate.profileHref, requestUrl.origin);
            for (const key of ["source", "campaign", "content", "tier"]) {
                const value = requestUrl.searchParams.get(key);
                if (value) profileUrl.searchParams.set(key, value);
            }
            return NextResponse.redirect(profileUrl);
        }

        if (profileGate.state === "email_unverified") {
            return NextResponse.redirect(new URL(profileGate.loginHref, requestUrl.origin));
        }
    }

    return NextResponse.redirect(redirectUrl);
}
