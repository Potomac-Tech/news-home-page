"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type SubmissionState = "idle" | "submitting" | "submitted" | "error";

export function ApplicationForm() {
    const [state, setState] = useState<SubmissionState>("idle");
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setState("submitting");
        setMessage(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const supabase = createClient();
        const { data: claimsData } = await supabase.auth.getClaims();
        const userId = claimsData?.claims?.sub ?? null;

        const payload = {
            user_id: userId,
            email: String(formData.get("email") ?? "").trim(),
            full_name: String(formData.get("full_name") ?? "").trim(),
            company: String(formData.get("company") ?? "").trim() || null,
            title: String(formData.get("title") ?? "").trim() || null,
            intended_use:
                String(formData.get("intended_use") ?? "").trim() || null,
            status: "pending",
        };

        const { error } = await supabase
            .from("membership_applications")
            .insert(payload);

        if (error) {
            setState("error");
            setMessage(error.message);
            return;
        }

        form.reset();
        setState("submitted");
        setMessage(
            "Application received. Potomac will review it before member access is granted."
        );
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
        </form>
    );
}
