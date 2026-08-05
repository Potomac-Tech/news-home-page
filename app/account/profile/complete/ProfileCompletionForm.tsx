"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "../../../../lib/supabase/client";

const interestAreas = ["Missions", "Procurement", "Regulatory", "Companies", "Data", "Economy"];

function safeReturnPath(value: string | null) {
    return value?.startsWith("/") && !value.startsWith("//") ? value : "/member";
}

export function ProfileCompletionForm({
    email,
    fullName,
}: {
    email: string;
    fullName: string;
}) {
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const timezone = useMemo(
        () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        []
    );

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaving(true);
        setStatus(null);
        setError(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const selectedInterests = formData.getAll("primary_interest_areas").map(String);

        if (!selectedInterests.length) {
            setIsSaving(false);
            setError("Choose at least one primary interest area.");
            return;
        }

        try {
            const supabase = createClient();
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user?.id) throw userError ?? new Error("Sign in is required.");

            const { error: saveError } = await supabase
                .from("member_profile_completions")
                .upsert(
                    {
                        user_id: userData.user.id,
                        full_name: String(formData.get("full_name") ?? "").trim(),
                        affiliation: String(formData.get("affiliation") ?? "").trim(),
                        role_title: String(formData.get("role_title") ?? "").trim(),
                        country_code: String(formData.get("country_code") ?? "").trim().toUpperCase(),
                        timezone: String(formData.get("timezone") ?? "UTC").trim(),
                        primary_interest_areas: selectedInterests,
                        communication_preference: String(formData.get("communication_preference") ?? "none"),
                        phone: String(formData.get("phone") ?? "").trim() || null,
                        budget_range: String(formData.get("budget_range") ?? "").trim() || null,
                        procurement_timeline: String(formData.get("procurement_timeline") ?? "").trim() || null,
                        use_case_detail: String(formData.get("use_case_detail") ?? "").trim() || null,
                    },
                    { onConflict: "user_id" }
                );

            if (saveError) throw saveError;
            setStatus("Profile saved. Returning to your requested workspace.");
            window.location.assign(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Profile could not be saved.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card rounded p-6">
            <p className="text-sm leading-6 text-potomac-cream/70">Signed in as {email}.</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Full name
                    <input required name="full_name" defaultValue={fullName} className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" />
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Organization or affiliation
                    <input required name="affiliation" autoComplete="organization" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" />
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Role or title
                    <input required name="role_title" autoComplete="organization-title" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" />
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Country code
                    <input required name="country_code" minLength={2} maxLength={3} placeholder="US" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" />
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Timezone
                    <input required name="timezone" defaultValue={timezone} className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" />
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Communication preference
                    <select name="communication_preference" defaultValue="research_digest" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold">
                        <option value="research_digest">Research digest</option><option value="product_updates">Product updates</option><option value="both">Both</option><option value="none">No email updates</option>
                    </select>
                </label>
            </div>
            <fieldset className="mt-6"><legend className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Primary interests</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{interestAreas.map((area) => <label key={area} className="flex items-center gap-3 text-sm text-potomac-cream/75"><input name="primary_interest_areas" type="checkbox" value={area} />{area}</label>)}</div></fieldset>
            <details className="mt-6"><summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Optional operating details</summary><div className="mt-4 grid gap-5 md:grid-cols-2"><label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Phone<input name="phone" type="tel" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" /></label><label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Budget range<input name="budget_range" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" /></label><label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Procurement timeline<input name="procurement_timeline" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" /></label><label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">Use-case detail<textarea name="use_case_detail" rows={3} className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-potomac-gold" /></label></div></details>
            <button disabled={isSaving} type="submit" className="mt-7 w-full rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream disabled:opacity-60">{isSaving ? "Saving" : "Save profile"}</button>
            {status ? <p className="mt-4 text-sm text-potomac-cream/80">{status}</p> : null}{error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </form>
    );
}
