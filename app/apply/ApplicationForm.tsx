"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type SubmissionState = "idle" | "submitting" | "submitted" | "error";

function getAccessContext() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
    const premiumTier = params.get("tier");
    const defaultNext = premiumTier ? `/upgrade?tier=${encodeURIComponent(premiumTier)}` : "/member";
    const callbackParams = new URLSearchParams();

    callbackParams.set("next", safeNext ?? defaultNext);
    for (const key of ["source", "campaign", "content", "tier"]) {
        const value = params.get(key);
        if (value) callbackParams.set(key, value);
    }

    return callbackParams;
}

export function ApplicationForm({
    onSwitchToSignIn,
}: {
    onSwitchToSignIn?: () => void;
}) {
    const [state, setState] = useState<SubmissionState>("idle");
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setState("submitting");
        setMessage(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const fullName = String(formData.get("full_name") ?? "").trim();
        const callbackUrl = new URL("/auth/callback", window.location.origin);
        callbackUrl.search = getAccessContext().toString();

        try {
            const supabase = createClient();
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: callbackUrl.toString(),
                    data: { full_name: fullName },
                },
            });

            if (signUpError) throw signUpError;

            const { error: applicationError } = await supabase
                .from("membership_applications")
                .insert({
                    // With email confirmation enabled Supabase returns a user but
                    // no authenticated session yet, so RLS requires this to stay
                    // null until the verified profile flow links the application.
                    user_id: signUpData.session ? signUpData.user?.id ?? null : null,
                    email,
                    full_name: fullName,
                    company: String(formData.get("company") ?? "").trim() || null,
                    title: String(formData.get("title") ?? "").trim() || null,
                    intended_use:
                        String(formData.get("intended_use") ?? "").trim() || null,
                    status: "pending",
                });

            if (applicationError && applicationError.code !== "23505") {
                throw applicationError;
            }

            form.reset();
            setState("submitted");
            setMessage(
                "Check your email to verify your account. Explorer access remains pending review after verification."
            );
        } catch (caughtError) {
            setState("error");
            setMessage(
                caughtError instanceof Error
                    ? caughtError.message
                    : "Explorer signup could not be completed."
            );
        }
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card rounded p-6">
            <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Full name
                    <input
                        required
                        name="full_name"
                        type="text"
                        autoComplete="name"
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Email
                    <input
                        required
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Password
                    <input
                        required
                        minLength={8}
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Organization
                    <input
                        name="company"
                        type="text"
                        autoComplete="organization"
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Title
                    <input
                        name="title"
                        type="text"
                        autoComplete="organization-title"
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
            </div>
            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                Intended use
                <textarea
                    name="intended_use"
                    rows={5}
                    className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                />
            </label>
            <button
                disabled={state === "submitting"}
                type="submit"
                className="mt-6 w-full rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
                {state === "submitting" ? "Submitting" : "Submit application"}
            </button>
            {message ? (
                <p
                    className={`mt-4 text-sm leading-6 ${
                        state === "error"
                            ? "text-red-300"
                            : "text-potomac-cream/80"
                    }`}
                >
                    {message}
                </p>
            ) : null}
            {onSwitchToSignIn ? (
                <button
                    type="button"
                    onClick={onSwitchToSignIn}
                    className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold transition hover:text-potomac-cream"
                >
                    Already have an account? Sign in
                </button>
            ) : null}
        </form>
    );
}
