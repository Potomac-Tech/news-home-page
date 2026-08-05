import { type NextRequest, NextResponse } from "next/server";
import {
    NEXUS_AUTH_URL,
    loadNexusAccessStatus,
} from "../../../../../lib/auth/nexus";
import { getProfileGateContext } from "../../../../../lib/auth/profile-completion";
import { POTOMAC_SUPABASE_URL } from "../../../../../lib/supabase/config";
import { createClient } from "../../../../../lib/supabase/server";
import { createServiceClient } from "../../../../../lib/supabase/service";

export const dynamic = "force-dynamic";

function noStoreRedirect(url: URL | string) {
    const response = NextResponse.redirect(url, 302);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
}

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const profileGate = await getProfileGateContext({
        supabase,
        nextPath: "/api/member/nexus/handoff",
    });

    if (profileGate.state !== "ready" || !profileGate.userId) {
        const destination =
            profileGate.profileHref ?? profileGate.loginHref ?? "/request-access";
        return noStoreRedirect(new URL(destination, request.url));
    }

    const access = await loadNexusAccessStatus(supabase, profileGate.userId);
    if (!access.canOpenNexus) {
        return noStoreRedirect(new URL("/member?nexus=access-pending", request.url));
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (userError || !email || !userData.user?.email_confirmed_at) {
        return noStoreRedirect(new URL("/account/verify", request.url));
    }

    try {
        const service = createServiceClient();
        const { data, error } = await service.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: {
                redirectTo: NEXUS_AUTH_URL,
            },
        });
        const actionLink = data.properties?.action_link;
        if (error || !actionLink) throw new Error("Nexus handoff unavailable.");

        const actionUrl = new URL(actionLink);
        if (
            actionUrl.protocol !== "https:" ||
            actionUrl.origin !== new URL(POTOMAC_SUPABASE_URL).origin ||
            actionUrl.pathname !== "/auth/v1/verify"
        ) {
            throw new Error("Unexpected Nexus handoff destination.");
        }

        return noStoreRedirect(actionUrl);
    } catch {
        return noStoreRedirect(
            new URL("/member?nexus=handoff-unavailable", request.url)
        );
    }
}
