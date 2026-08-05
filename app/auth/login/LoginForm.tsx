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

function getSignInErrorMessage(caughtError: unknown) {
    const fallback = "Sign-in failed. Please try again.";
    if (!(caughtError instanceof Error)) return fallback;

    if (caughtError.message.toLowerCase().includes("invalid login credentials")) {
        return "That email and password did not match. Use a magic link or reset your password to continue.";
    }

    return caughtError.message || fallback;
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
                    redirectTo: getCallbackUrl("/account/update-password").toString(),
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
            setError(getSignInErrorMessage(caughtError));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-7 border-t border-cabeus-line pt-7">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setMode("magic-link")}
                    className={`border px-4 py-2 font-mono text-xs font-bold uppercase transition ${
                        mode === "magic-link"
                            ? "border-cabeus-ink bg-cabeus-ink text-cabeus-paper"
                            : "border-cabeus-line text-cabeus-ink hover:border-cabeus-bronze"
                    }`}
                >
                    Magic link
                </button>
                <button
                    type="button"
                    onClick={() => setMode("recovery")}
                    className={`border px-4 py-2 font-mono text-xs font-bold uppercase transition ${
                        mode === "recovery"
                            ? "border-cabeus-ink bg-cabeus-ink text-cabeus-paper"
                            : "border-cabeus-line text-cabeus-ink hover:border-cabeus-bronze"
                    }`}
                >
                    Reset password
                </button>
                <button
                    type="button"
                    onClick={() => setMode("password")}
                    className={`border px-4 py-2 font-mono text-xs font-bold uppercase transition ${
                        mode === "password"
                            ? "border-cabeus-ink bg-cabeus-ink text-cabeus-paper"
                            : "border-cabeus-line text-cabeus-ink hover:border-cabeus-bronze"
                    }`}
                >
                    Password
                </button>
            </div>

            {mode !== "reset" ? (
                <label className="mt-6 block font-mono text-xs font-bold uppercase text-cabeus-bronze">
                    Email
                    <input
                        required
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="mt-2 w-full border border-cabeus-line bg-cabeus-smoke px-4 py-3 font-sans text-base font-normal normal-case text-cabeus-ink outline-none transition focus:border-cabeus-bronze"
                    />
                </label>
            ) : null}

            {mode === "password" || mode === "reset" ? (
                <label className="mt-5 block font-mono text-xs font-bold uppercase text-cabeus-bronze">
                    {mode === "reset" ? "New password" : "Password"}
                    <input
                        required
                        minLength={8}
                        name="password"
                        type="password"
                        autoComplete={mode === "reset" ? "new-password" : "current-password"}
                        className="mt-2 w-full border border-cabeus-line bg-cabeus-smoke px-4 py-3 font-sans text-base font-normal normal-case text-cabeus-ink outline-none transition focus:border-cabeus-bronze"
                    />
                </label>
            ) : null}

            <button
                disabled={isSubmitting}
                type="submit"
                className="brand-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
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
                <p className="mt-4 text-sm leading-6 text-cabeus-muted">
                    {status}
                </p>
            ) : null}
            {error ? (
                <div
                    role="alert"
                    className="mt-4 border-l-2 border-red-700 bg-red-50 px-4 py-3"
                >
                    <p className="text-sm leading-6 text-red-800">{error}</p>
                    {mode === "password" ? (
                        <div className="mt-3 flex flex-wrap gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setMode("magic-link");
                                }}
                                className="font-mono text-xs font-bold uppercase text-cabeus-bronze transition hover:text-cabeus-ink"
                            >
                                Use magic link
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setMode("recovery");
                                }}
                                className="font-mono text-xs font-bold uppercase text-cabeus-bronze transition hover:text-cabeus-ink"
                            >
                                Reset password
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </form>
    );
}
