"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type AccountProfileFormProps = {
    email: string;
    fullName: string;
    title: string;
    company: string;
};

function normalizedEmail(value: string) {
    return value.trim().toLowerCase();
}

export function AccountProfileForm({
    email,
    fullName,
    title,
    company,
}: AccountProfileFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaving(true);
        setStatus(null);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const nextEmail = normalizedEmail(String(formData.get("email") ?? ""));
        const nextFullName = String(formData.get("full_name") ?? "").trim();
        const nextTitle = String(formData.get("title") ?? "").trim();
        const nextCompany = String(formData.get("company") ?? "").trim();

        if (!nextEmail || !nextFullName || !nextTitle || !nextCompany) {
            setError("Email, name, title, and company are required.");
            setIsSaving(false);
            return;
        }

        try {
            const supabase = createClient();
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user?.id) {
                throw userError ?? new Error("Sign in is required.");
            }

            const { error: profileError } = await supabase
                .from("member_profile_completions")
                .update({
                    full_name: nextFullName,
                    affiliation: nextCompany,
                    role_title: nextTitle,
                })
                .eq("user_id", userData.user.id);

            if (profileError) throw profileError;

            const emailChanged = normalizedEmail(email) !== nextEmail;
            const { error: authError } = await supabase.auth.updateUser(
                {
                    ...(emailChanged ? { email: nextEmail } : {}),
                    data: {
                        ...userData.user.user_metadata,
                        full_name: nextFullName,
                        company: nextCompany,
                        title: nextTitle,
                    },
                },
                {
                    emailRedirectTo: new URL(
                        "/auth/callback?next=/member",
                        window.location.origin
                    ).toString(),
                }
            );

            if (authError) {
                setError(`Profile saved, but the account email could not be updated: ${authError.message}`);
            } else if (emailChanged) {
                setStatus(
                    "Profile saved. Confirm the email-change messages sent by Supabase before using the new address to sign in."
                );
            } else {
                setStatus("Account information saved.");
            }

            router.refresh();
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : "Account information could not be saved."
            );
        } finally {
            setIsSaving(false);
        }
    }

    const inputClassName =
        "mt-2 w-full border border-cabeus-line bg-white px-4 py-3 font-sans text-base text-cabeus-ink outline-none transition focus:border-cabeus-bronze";
    const labelClassName =
        "font-sans text-xs font-semibold uppercase tracking-[0.12em] text-cabeus-muted";

    return (
        <form onSubmit={handleSubmit} className="border-t border-cabeus-line pt-5">
            <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClassName}>
                    Email
                    <input
                        required
                        type="email"
                        name="email"
                        autoComplete="email"
                        defaultValue={email}
                        maxLength={320}
                        className={inputClassName}
                    />
                </label>
                <label className={labelClassName}>
                    Full name
                    <input
                        required
                        name="full_name"
                        autoComplete="name"
                        defaultValue={fullName}
                        maxLength={120}
                        className={inputClassName}
                    />
                </label>
                <label className={labelClassName}>
                    Title
                    <input
                        required
                        name="title"
                        autoComplete="organization-title"
                        defaultValue={title}
                        maxLength={160}
                        className={inputClassName}
                    />
                </label>
                <label className={labelClassName}>
                    Company
                    <input
                        required
                        name="company"
                        autoComplete="organization"
                        defaultValue={company}
                        maxLength={180}
                        className={inputClassName}
                    />
                </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="brand-button inline-flex disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? "Saving" : "Save changes"}
                </button>
                <p className="max-w-xl text-sm leading-6 text-cabeus-muted">
                    Changing your email requires confirmation before the new address becomes active.
                </p>
            </div>

            {status ? (
                <p role="status" className="mt-5 border-l-2 border-cabeus-bronze pl-4 text-sm leading-6 text-cabeus-ink">
                    {status}
                </p>
            ) : null}
            {error ? (
                <p role="alert" className="mt-5 border-l-2 border-red-700 pl-4 text-sm leading-6 text-red-800">
                    {error}
                </p>
            ) : null}
        </form>
    );
}
