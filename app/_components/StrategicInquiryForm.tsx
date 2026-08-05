import Link from "next/link";
import { submitStrategicInquiry } from "../strategic-inquiry-actions";

type Product = "pathfinder" | "source";

const messages: Record<string, string> = {
    submitted: "Your inquiry was received and delivered to the Cabeus Explorer team.",
    "delivery-pending": "Your inquiry is recorded. Email delivery is delayed and the team can review it in the inquiry queue.",
    "missing-required": "Complete every required field and include a message of at least 20 characters.",
    "rate-limited": "This email has reached the inquiry limit. Try again after the current one-hour window.",
    "submit-error": "The inquiry could not be recorded. Please try again later.",
};

export function StrategicInquiryForm({
    product,
    status,
    sourceCta,
    attribution,
}: {
    product: Product;
    status?: string;
    sourceCta?: string;
    attribution: Record<string, string>;
}) {
    const message = status ? messages[status] : undefined;
    const success = status === "submitted" || status === "delivery-pending";
    const label = product === "pathfinder" ? "Pathfinder" : "Source";

    return (
        <form action={submitStrategicInquiry} className="glass-card rounded p-6">
            <input type="hidden" name="product" value={product} />
            <input type="hidden" name="source_cta" value={sourceCta ?? `${product}-inquiry`} />
            <input type="hidden" name="attribution" value={JSON.stringify(attribution)} />
            <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label>Company website<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                    Name
                    <input required name="contact_name" autoComplete="name" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white" />
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                    Email
                    <input required name="contact_email" type="email" autoComplete="email" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white" />
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                    Organization
                    <input required name="organization_name" autoComplete="organization" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white" />
                </label>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                    Role / title
                    <input name="role_title" autoComplete="organization-title" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white" />
                </label>
            </div>
            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                Product interest
                <select required name="product_interest" defaultValue="" className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white">
                    <option value="" disabled>Select an area</option>
                    {product === "pathfinder" ? (
                        <><option value="landing-site-assessment">Landing-site assessment</option><option value="sensor-payload">Sensor or payload integration</option><option value="mission-partnership">Mission partnership</option></>
                    ) : (
                        <><option value="site-characterization">Site characterization</option><option value="data-collection">Lunar data collection</option><option value="construction-preparation">Construction preparation</option></>
                    )}
                </select>
            </label>
            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                Message
                <textarea required minLength={20} maxLength={4000} name="message" rows={6} className="mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-base font-normal normal-case tracking-normal text-white" />
            </label>
            <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-potomac-cream/75">
                <input required type="checkbox" name="communication_preference" value="product_follow_up_approved" className="mt-1 h-4 w-4 accent-potomac-gold" />
                <span>I agree that Cabeus Explorer may contact me about {label}.</span>
            </label>
            <button type="submit" className="mt-6 w-full bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream">
                Submit {label} inquiry
            </button>
            {message ? <p role="status" className={`mt-4 text-sm leading-6 ${success ? "text-potomac-cream/80" : "text-red-300"}`}>{message}</p> : null}
            <p className="mt-5 text-sm text-potomac-cream/60">
                Need member access instead? <Link href="/request-access" className="font-bold text-potomac-gold">Join Explorer</Link>
            </p>
        </form>
    );
}
