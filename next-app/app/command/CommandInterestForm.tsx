"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type SubmissionState = "idle" | "submitting" | "submitted" | "error";

export function CommandInterestForm() {
    const [state, setState] = useState<SubmissionState>("idle");
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setState("submitting");
        setMessage(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const estimatedSeats = Number(formData.get("estimated_seats") ?? 0);

        const payload = {
            contact_name: String(formData.get("contact_name") ?? "").trim(),
            contact_email: String(formData.get("contact_email") ?? "").trim(),
            organization_name: String(
                formData.get("organization_name") ?? ""
            ).trim(),
            title: String(formData.get("title") ?? "").trim() || null,
            estimated_seats: estimatedSeats > 0 ? estimatedSeats : null,
            use_case: String(formData.get("use_case") ?? "").trim() || null,
            status: "new",
        };

        const { error } = await createClient()
            .from("command_interest_requests")
            .insert(payload);

        if (error) {
            setState("error");
            setMessage(error.message);
            return;
        }

        form.reset();
        setState("submitted");
        setMessage("Command interest received. Potomac will follow up directly.");
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card rounded p-6">
            <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Contact name
                    <input
                        required
                        name="contact_name"
                        type="text"
                        autoComplete="name"
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Contact email
                    <input
                        required
                        name="contact_email"
                        type="email"
                        autoComplete="email"
                        className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                    />
                </label>
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Organization
                    <input
                        required
                        name="organization_name"
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
                Estimated seats
                <input
                    name="estimated_seats"
                    type="number"
                    min="1"
                    className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                />
            </label>
            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                Mission need
                <textarea
                    name="use_case"
                    rows={5}
                    className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none transition focus:border-potomac-gold"
                />
            </label>
            <button
                disabled={state === "submitting"}
                type="submit"
                className="mt-6 w-full rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
                {state === "submitting" ? "Submitting" : "Request Command access"}
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
