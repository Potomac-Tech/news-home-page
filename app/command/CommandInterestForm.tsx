import { submitMeridianInterest } from "./actions";
import { tierConfig } from "../_data/tiers";

type CommandInterestFormProps = {
    status?: string;
};

const statusMessages: Record<string, string> = {
    submitted: `${tierConfig.enterprise.publicName} interest received. Cabeus Explorer will follow up directly for contract discussion.`,
    "business-email-required":
        `Use a business or organization email for ${tierConfig.enterprise.publicName} contract discussion.`,
    "missing-required": "Complete the required contact, email, and organization fields.",
    "configuration-needed":
        "Inquiry storage is not configured in this environment. Try again after deployment configuration is complete.",
    "submit-error":
        "The inquiry could not be stored. Try again or contact Cabeus Explorer through an approved support path.",
};

export function CommandInterestForm({ status }: CommandInterestFormProps) {
    const message = status ? statusMessages[status] : undefined;
    const isError = status && status !== "submitted";

    return (
        <form action={submitMeridianInterest} className="glass-card rounded p-6">
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
                    Business email
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
                type="submit"
                className="mt-6 w-full rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
            >
                Request {tierConfig.enterprise.publicName} access
            </button>
            {message ? (
                <p
                    className={`mt-4 text-sm leading-6 ${
                        isError ? "text-red-300" : "text-potomac-cream/80"
                    }`}
                >
                    {message}
                </p>
            ) : null}
        </form>
    );
}
