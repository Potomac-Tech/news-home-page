import type { Metadata } from "next";
import { CookiePreferenceControl } from "../_components/CookiePreferenceControl";
import { LegalPageShell } from "../_components/LegalPageShell";

export const metadata: Metadata = {
    title: "Cookies",
    description:
        "Potomac cookie categories, Supabase session use, analytics choices, and local preference controls.",
    alternates: {
        canonical: "/legal/cookies",
    },
};

export default function CookiesPage() {
    return (
        <LegalPageShell
            eyebrow="Cookies"
            title="Cookies"
            description="Potomac uses essential cookies for authentication and security. Optional preference and analytics categories should only be enabled when the member chooses them."
            sections={[
                {
                    title: "Essential Cookies",
                    body: "Essential cookies support Supabase session refresh, sign-in state, security controls, and core navigation. They cannot be disabled without breaking protected member workflows.",
                },
                {
                    title: "Preference Cookies",
                    body: "Preference storage can remember local choices such as cookie settings and future interface defaults. These choices are designed to stay on the device when possible.",
                },
                {
                    title: "Analytics Cookies",
                    body: "Analytics is reserved for measuring product usage and performance after consent. Production analytics should avoid collecting sensitive member content or raw gated intelligence.",
                },
            ]}
        >
            <CookiePreferenceControl />
        </LegalPageShell>
    );
}
