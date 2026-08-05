export const POTOMAC_SUPABASE_PROJECT_REF = "xlpkdoeldtlhearqajat";
export const POTOMAC_SUPABASE_URL = `https://${POTOMAC_SUPABASE_PROJECT_REF}.supabase.co`;
// These values are intentionally public and are protected by Supabase RLS.
// Defaults keep browser builds functional when a host only injects runtime secrets.
export const POTOMAC_SUPABASE_PUBLISHABLE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGtkb2VsZHRsaGVhcnFhamF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDE3OTYsImV4cCI6MjA3MTg3Nzc5Nn0.tb0WfA5RO2fJU2NILJ3HacOvW2_Ky1voGZlZoYvYgZc";

export function assertPotomacSupabaseUrl(supabaseUrl: string) {
    if (supabaseUrl !== POTOMAC_SUPABASE_URL) {
        throw new Error(
            `Supabase URL must target ${POTOMAC_SUPABASE_PROJECT_REF}.`
        );
    }
}

export function getSupabasePublicConfig() {
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? POTOMAC_SUPABASE_URL;
    const supabasePublishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        POTOMAC_SUPABASE_PUBLISHABLE_KEY;

    assertPotomacSupabaseUrl(supabaseUrl);

    return {
        supabaseUrl,
        supabasePublishableKey,
        projectRef: POTOMAC_SUPABASE_PROJECT_REF,
    };
}

export function hasPotomacSupabasePublicConfig() {
    const { supabaseUrl } = getSupabasePublicConfig();

    assertPotomacSupabaseUrl(supabaseUrl);

    return true;
}
