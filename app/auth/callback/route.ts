import { NextResponse } from "next/server";
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
    }

    return NextResponse.redirect(redirectUrl);
}
