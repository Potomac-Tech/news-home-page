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
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: callbackUrl.toString(),
                    data: { full_name: fullName },
                },
            });

            if (signUpError) throw signUpError;

            const { error: applicationError } = await supabase.rpc(
                "submit_membership_application",
                {
                    p_email: email,
                    p_full_name: fullName,
                    p_company: String(formData.get("company") ?? "").trim() || null,
                    p_title: String(formData.get("title") ?? "").trim() || null,
                    p_intended_use:
                        String(formData.get("intended_use") ?? "").trim() || null,
                }
            );

            if (applicationError) throw applicationError;

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
        <form onSubmit={handleSubmit} className="mt-7 border-t border-cabeus-line pt-7">
            <div className="grid gap-5 md:grid-cols-2">
                <label className="block font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                    Full name
                    <input
                        required
                        name="full_name"
                        type="text"
                        autoComplete="name"
                        className="mt-2 w-full border border-cabeus-line bg-cabeus-smoke px-4 py-3 font-sans text-base font-normal normal-case text-cabeus-ink outline-none transition focus:border-cabeus-bronze"
                    />
                </label>
                <label className="block font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                    Email
                    <input
                        required
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="mt-2 w-full border border-cabeus-line bg-cabeus-smoke px-4 py-3 font-sans text-base font-normal normal-case text-cabeus-ink outline-none transition focus:border-cabeus-bronze"
                    />
                </label>
                <label className="block font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                    Password
                    <input
                        required
                        minLength={8}
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        className="mt-2 w-full border border-cabeus-line bg-cabeus-smoke px-4 py-3 font-sans text-base font-normal normal-case text-cabeus-ink outline-none transition focus:border-cabeus-bronze"
                    />
                </label>
                <label className="block font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                    Organization
                    <input
                        name="company"
                        type="text"
                        autoComplete="organization"
                        className="mt-2 w-full border border-cabeus-line bg-cabeus-smoke px-4 py-3 font-sans text-base font-normal normal-case text-cabeus-ink outline-none transition focus:border-cabeus-bronze"
                    />
                </label>
                <label className="block font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                    Title
                    <input
                        name="title"
                        type="text"
                        autoComplete="organization-title"
                        className="mt-2 w-full border border-cabeus-line bg-cabeus-smoke px-4 py-3 font-sans text-base font-normal normal-case text-cabeus-ink outline-none transition focus:border-cabeus-bronze"
                    />
                </label>
            </div>
            <label className="mt-5 block font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                Intended use
                <textarea
                    name="intended_use"
                    rows={5}
                    className="mt-2 w-full border border-cabeus-line bg-cabeus-smoke px-4 py-3 font-sans text-base font-normal normal-case text-cabeus-ink outline-none transition focus:border-cabeus-bronze"
                />
            </label>
            <button
                disabled={state === "submitting"}
                type="submit"
                className="brand-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
                {state === "submitting" ? "Submitting" : "Submit application"}
            </button>
            {message ? (
                <p
                    className={`mt-4 text-sm leading-6 ${
                        state === "error"
                            ? "text-red-700"
                            : "text-cabeus-muted"
                    }`}
                >
                    {message}
                </p>
            ) : null}
            {onSwitchToSignIn ? (
                <button
                    type="button"
                    onClick={onSwitchToSignIn}
                    className="mt-5 font-mono text-xs font-bold uppercase text-cabeus-bronze transition hover:text-cabeus-ink"
                >
                    Already have an account? Sign in
                </button>
            ) : null}
        </form>
    );
}
