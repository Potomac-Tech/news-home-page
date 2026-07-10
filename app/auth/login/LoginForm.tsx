"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type LoginMode = "magic-link" | "password" | "recovery" | "reset";

function getSafeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("next");

    if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
        return nextPath;
    }

    return "/member";
}

export function LoginForm({
    initialMode = "magic-link",
}: {
    initialMode?: LoginMode;
}) {
    const [mode, setMode] = useState<LoginMode>(initialMode);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function getCallbackUrl(nextPath: string) {
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = new URL("/auth/callback", window.location.origin);
        callbackUrl.searchParams.set("next", nextPath);

        for (const key of ["source", "campaign", "content", "tier"]) {
            const value = params.get(key);
            if (value) callbackUrl.searchParams.set(key, value);
        }

        return callbackUrl;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatus(null);
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const nextPath = getSafeNextPath();

        try {
            const supabase = createClient();
            if (mode === "reset") {
                const { error: updateError } = await supabase.auth.updateUser({
                    password,
                });

                if (updateError) throw updateError;
                window.location.assign(nextPath);
                return;
            }

            if (mode === "recovery") {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: getCallbackUrl("/request-access?tab=signin&mode=reset").toString(),
                });

                if (resetError) throw resetError;
                setStatus("Check your email for a secure password-reset link.");
                return;
            }

            if (mode === "password") {
                const { error: signInError } =
                    await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                if (signInError) {
                    throw signInError;
                }

                window.location.assign(nextPath);
                return;
            }

            const callbackUrl = getCallbackUrl(nextPath);

            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: callbackUrl.toString(),
                },
            });

            if (otpError) {
                throw otpError;
            }

            setStatus("Check your email for the secure sign-in link.");
        } catch (caughtError) {
            const message =
                caughtError instanceof Error
                    ? caughtError.message
                    : "Sign-in failed.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card rounded p-6">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setMode("magic-link")}
                    className={`rounded px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                        mode === "magic-link"
                            ? "bg-potomac-gold text-potomac-primary"
                            : "border border-potomac-gold/40 text-potomac-gold hover:border-potomac-gold"
                    }`}
                >
                    Magic link
                </button>
                <button
                    type="button"
                    onClick={() => setMode("recovery")}
                    className={`rounded px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                        mode === "recovery"
                            ? "bg-potomac-gold text-potomac-primary"
                            : "border border-potomac-gold/40 text-potomac-gold hover:border-potomac-gold"
                    }`}
                >
                    Reset password
                </button>
                <button
                    type="button"
                    onClick={() => setMode("password")}
                    className={`rounded px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                        mode === "password"
                            ? "bg-potomac-gold text-potomac-primary"
                            : "border border-potomac-gold/40 text-potomac-gold hover:border-potomac-gold"
                    }`}
                >
                    Password
                </button>
            </div>

            {mode !== "reset" ? (
                <label className="mt-6 block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Email
                    <input
                        required
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
            ) : null}

            {mode === "password" || mode === "reset" ? (
                <label className="mt-5 block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    {mode === "reset" ? "New password" : "Password"}
                    <input
                        required
                        minLength={8}
                        name="password"
                        type="password"
                        autoComplete={mode === "reset" ? "new-password" : "current-password"}
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
            ) : null}

            <button
                disabled={isSubmitting}
                type="submit"
                className="mt-6 w-full rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting
                    ? "Working"
                    : mode === "reset"
                      ? "Save new password"
                      : mode === "recovery"
                      ? "Send reset link"
                      : "Sign in"}
            </button>

            {status ? (
                <p className="mt-4 text-sm leading-6 text-potomac-cream/80">
                    {status}
                </p>
            ) : null}
            {error ? (
                <p className="mt-4 text-sm leading-6 text-red-300">{error}</p>
            ) : null}
        </form>
    );
}
