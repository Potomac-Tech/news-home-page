import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
    POTOMAC_SUPABASE_URL,
    assertPotomacSupabaseUrl,
} from "./config";

export function createServiceClient() {
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? POTOMAC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    assertPotomacSupabaseUrl(supabaseUrl);

    if (!secretKey) {
        throw new Error("Missing SUPABASE_SECRET_KEY.");
    }

    return createClient(supabaseUrl, secretKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
