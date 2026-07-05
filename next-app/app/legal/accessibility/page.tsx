import type { Metadata } from "next";
import { LegalPageShell } from "../_components/LegalPageShell";

export const metadata: Metadata = {
    title: "Accessibility",
    description:
        "Cabeus Explorer accessibility commitment, testing baseline, and support path.",
    alternates: {
        canonical: "/legal/accessibility",
    },
};

export default function AccessibilityPage() {
    return (
        <LegalPageShell
            eyebrow="Accessibility"
            title="Accessibility"
            description="Cabeus Explorer aims to make public and member intelligence workflows usable with keyboard navigation, readable contrast, semantic structure, and clear support paths."
            sections={[
                {
                    title: "Baseline",
                    body: "Public pages and member tools should use semantic headings, keyboard-reachable controls, visible focus states, descriptive labels, and responsive layouts that avoid horizontal overflow.",
                },
                {
                    title: "Testing",
                    body: "Production readiness should include automated accessibility checks and manual review of critical flows such as article access, login, billing, alerts, exports, chat, forums, RFQs, and admin workflows.",
                },
                {
                    title: "Support",
                    body: "Members who encounter an accessibility barrier can contact support with the page, browser, assistive technology, and task they were trying to complete.",
                },
            ]}
        />
    );
}
