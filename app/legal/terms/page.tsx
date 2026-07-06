import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";

export const metadata: Metadata = {
    title: "Terms",
    description:
        "Cabeus Explorer membership, paid access, acceptable use, and platform terms.",
    alternates: {
        canonical: "/legal/terms",
    },
};

export default function TermsPage() {
    return (
        <LegalPageShell
            eyebrow="Legal"
            title="Terms"
            description="These baseline terms explain how Cabeus Explorer access, paid intelligence workflows, and member responsibilities are framed before production launch."
            sections={[
                {
                    title: "Membership And Access",
                    body: "Explorer access is manually approved, Scout is a paid individual tier, and Command is organization-level access approved through sales and administration. Access can be limited, suspended, or revoked when required for security, payment, policy, or misuse reasons.",
                },
                {
                    title: "Intelligence Content",
                    body: "Cabeus Explorer provides news, market data, citations, calculators, datasets, and workflow tools for informational and planning use. Members remain responsible for independent validation before relying on the material for business, legal, engineering, or procurement decisions.",
                },
                {
                    title: "Acceptable Use",
                    body: "Members may not abuse access controls, scrape gated content outside approved API/export workflows, upload unlawful material, interfere with platform operations, or use community surfaces to harass, impersonate, spam, or misrepresent affiliation.",
                },
                {
                    title: "Paid Features",
                    body: "Scout and Command features can include exports, API access, webhooks, alerts, RFQs, marketplace workflows, and higher limits. Quotas, availability, and delivery methods may change as the product matures.",
                },
                {
                    title: "Contact",
                    body: "Questions about these terms, billing, or enterprise access should go through the support and Command contact paths linked from the trust center.",
                },
            ]}
        />
    );
}
