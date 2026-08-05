import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";

export const metadata: Metadata = {
    title: "Privacy",
    description:
        "Cabeus Explorer privacy baseline for account, usage, billing, and intelligence workflow data.",
    alternates: {
        canonical: "/legal/privacy",
    },
};

export default function PrivacyPage() {
    return (
        <LegalPageShell
            eyebrow="Privacy"
            title="Privacy"
            description="This baseline privacy notice documents what the platform expects to collect and how those records support membership, security, billing, and intelligence workflows."
            sections={[
                {
                    title: "Account Data",
                    body: "Cabeus Explorer uses Supabase Auth for login and session handling. Account records can include identity, application, organization, role, entitlement, approval, and audit details needed to operate member access.",
                },
                {
                    title: "Workflow Data",
                    body: "Member activity can create watchlists, alerts, saved searches, reading-list records, API usage logs, export jobs, webhook subscriptions, RFQs, forum posts, direct messages, and marketplace records.",
                },
                {
                    title: "Billing And Enterprise Data",
                    body: "Scout billing is handled through Stripe, and Cabeus Council access is handled through manual sales and administration. Billing contact, subscription, entitlement, and audit records are used to maintain paid access.",
                },
                {
                    title: "Use Of Data",
                    body: "Data is used to provide the service, enforce access controls, secure the platform, support members, improve workflows, and comply with legal or contractual obligations.",
                },
                {
                    title: "Choices",
                    body: "Members can use the cookie preference controls, request account deletion, contact support, and manage paid access through the linked account and trust surfaces.",
                },
            ]}
        />
    );
}
