import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
    getSupabasePublicConfig,
    hasPotomacSupabasePublicConfig,
} from "./config";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request,
    });

    if (!hasPotomacSupabasePublicConfig()) {
        return response;
    }

    const { supabaseUrl, supabasePublishableKey } = getSupabasePublicConfig();

    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );

                response = NextResponse.next({
                    request,
                });

                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
    });

    await supabase.auth.getClaims();

    return response;
}
