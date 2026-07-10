"use client";

import { useState } from "react";

export function VerificationResendButton({ nextPath }: { nextPath: string }) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function requestResend() {
        setIsPending(true);
        setStatus(null);

        try {
            const response = await fetch(
                `/api/auth/resend-verification?next=${encodeURIComponent(nextPath)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );
            const body = (await response.json()) as {
                error?: string;
                message?: string;
                retryAfterSeconds?: number;
            };

            if (!response.ok) {
                const retryMessage = body.retryAfterSeconds
                    ? ` Try again in ${body.retryAfterSeconds} seconds.`
                    : "";
                setStatus(`${body.error ?? "Verification resend failed."}${retryMessage}`);
                return;
            }

            setStatus(body.message ?? "A verification email has been sent.");
        } catch {
            setStatus("Verification resend failed. Check your connection and try again.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="space-y-3">
            <label className="block max-w-xl text-sm text-potomac-cream/75">
                <span className="mb-2 block">Account email</span>
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    className="min-h-11 w-full rounded border border-white/15 bg-potomac-secondary px-3 text-white outline-none focus:border-potomac-gold"
                />
            </label>
            <button
                type="button"
                onClick={requestResend}
                disabled={isPending || !email.trim()}
                className="rounded border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-cream transition hover:border-potomac-gold hover:text-potomac-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isPending ? "Sending" : "Resend verification email"}
            </button>
            {status ? (
                <p className="max-w-xl text-sm leading-6 text-potomac-cream/75" role="status">
                    {status}
                </p>
            ) : null}
        </div>
    );
}
