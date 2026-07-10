import { redirect } from "next/navigation";
import { hasPotomacSupabasePublicConfig } from "../../../../lib/supabase/config";
import { createClient } from "../../../../lib/supabase/server";
import { safeReturnPath } from "../../../../lib/auth/profile-completion";
import { ProfileCompletionForm } from "./ProfileCompletionForm";

export const dynamic = "force-dynamic";

export default async function ProfileCompletePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const params = await searchParams;
    const nextPath = safeReturnPath(params.next);
    if (!hasPotomacSupabasePublicConfig()) redirect(`/request-access?tab=signin&next=${encodeURIComponent(nextPath)}`);

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id) redirect(`/request-access?tab=signin&next=${encodeURIComponent(nextPath)}`);
    if (!data.user.email_confirmed_at) redirect(`/request-access?tab=signin&next=${encodeURIComponent(nextPath)}`);

    return <section className="bg-grid-pattern"><div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl gap-10 px-4 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">Member profile</p><h1 className="mt-4 font-serif text-4xl text-white md:text-6xl">Complete your operating profile</h1><p className="mt-6 text-lg leading-8 text-potomac-cream/75">This information keeps the member workspace relevant and is required before non-public intelligence becomes available.</p></div><ProfileCompletionForm email={data.user.email ?? "your verified email"} fullName={String(data.user.user_metadata.full_name ?? "")} /></div></section>;
}
