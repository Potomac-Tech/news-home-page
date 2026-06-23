const POTOMAC_SUPABASE_PROJECT_REF = "xlpkdoeldtlhearqajat";
const POTOMAC_SUPABASE_URL = `https://${POTOMAC_SUPABASE_PROJECT_REF}.supabase.co`;

export function getSupabasePublicConfig() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
    }

    if (!supabasePublishableKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    }

    if (supabaseUrl !== POTOMAC_SUPABASE_URL) {
        throw new Error(
            `Supabase URL must target ${POTOMAC_SUPABASE_PROJECT_REF}.`
        );
    }

    return {
        supabaseUrl,
        supabasePublishableKey,
        projectRef: POTOMAC_SUPABASE_PROJECT_REF,
    };
}
