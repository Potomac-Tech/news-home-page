import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getProfileGateContext } from "../../../lib/auth/profile-completion";
import { getSupabasePublicConfig } from "../../../lib/supabase/config";

function getSafeNextPath(nextPath: string | null) {
    if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
        return nextPath;
    }

    return "/member";
}

export async function GET(request: NextRequest) {
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
    let response = NextResponse.redirect(redirectUrl);

    if (code) {
        const { supabaseUrl, supabasePublishableKey } =
            getSupabasePublicConfig();
        const supabase = createServerClient(
            supabaseUrl,
            supabasePublishableKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );
        const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            return NextResponse.redirect(
                new URL(
                    "/request-access?tab=signin&mode=recovery&error=expired-reset-link",
                    requestUrl.origin
                )
            );
        }

        if (redirectUrl.pathname === "/account/update-password") {
            return response;
        }

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
            const profileResponse = NextResponse.redirect(profileUrl);
            response.cookies
                .getAll()
                .forEach((cookie) => profileResponse.cookies.set(cookie));
            return profileResponse;
        }

        if (profileGate.state === "email_unverified") {
            const loginResponse = NextResponse.redirect(
                new URL(profileGate.loginHref, requestUrl.origin)
            );
            response.cookies
                .getAll()
                .forEach((cookie) => loginResponse.cookies.set(cookie));
            return loginResponse;
        }
    }

    return response;
}
