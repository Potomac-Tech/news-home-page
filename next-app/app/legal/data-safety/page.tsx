import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";

export const metadata: Metadata = {
    title: "Data Safety",
    description:
        "Potomac data safety baseline for security, uploads, exports, webhooks, and incident contact paths.",
    alternates: {
        canonical: "/legal/data-safety",
    },
};

export default function DataSafetyPage() {
    return (
        <LegalPageShell
            eyebrow="Trust"
            title="Data Safety"
            description="This baseline documents how Potomac should handle member data, source files, uploads, exports, API access, and operational safety before production launch."
            sections={[
                {
                    title: "Access Control",
                    body: "Membership, organization, entitlement, and staff access should be enforced through Supabase Auth, normalized role tables, RLS policies, server-side checks, and audit records.",
                },
                {
                    title: "Uploads And Community Content",
                    body: "Uploads, direct messages, forums, RFQs, and marketplace content need moderation, reporting, blocking, audit trails, and export-control planning before broad production use.",
                },
                {
                    title: "Exports, APIs, And Webhooks",
                    body: "Paid exports, API keys, webhooks, and developer workflows should use scoped access, quota logs, secret-safe storage, delivery audits, and revocation controls.",
                },
                {
                    title: "Incidents",
                    body: "Suspected security, privacy, billing, or data-safety issues should be reported through support with relevant account, organization, route, and timestamp details.",
                },
            ]}
        />
    );
}
