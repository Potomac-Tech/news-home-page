import type { Metadata } from "next";
import { ConveningPage } from "../_components/ConveningPage";

export const metadata: Metadata = {
    title: "Space Investment Forum",
    description:
        "A forum on capital, industry, and strategic competition in the space economy.",
    alternates: { canonical: "/space-investment-forum" },
};

export default function SpaceInvestmentForumPage() {
    return (
        <ConveningPage
            eyebrow="Leadership / capital / innovation / orbit"
            title="Space Investment Forum."
            introduction="Cabeus Explorer and its partners convened senior leaders in investment, government, industry, and national security to examine the capital, partnerships, and strategic choices shaping American leadership in space."
            imageUrl="/potomac-space-investment-forum.jpg"
            imageAlt="Invitation artwork for the 2026 Space Investment Forum"
            dateLabel="July 21, 2026"
            locationLabel="The Cosmos Club / Washington, D.C."
            primaryCta={{ href: "/archives", label: "Read forum coverage" }}
            secondaryCta={{ href: "/contact", label: "Contact the team" }}
            sections={[
                {
                    number: "01",
                    title: "American strength in space",
                    description:
                        "A featured conversation on capital, industry, and strategic competition with leaders from the civil, commercial, and national-security communities.",
                },
                {
                    number: "02",
                    title: "Infrastructure and investment",
                    description:
                        "Discussion spanning Artemis, integrated space defense, lunar and cislunar infrastructure, workforce, and capital allocation.",
                },
                {
                    number: "03",
                    title: "Intelligence for decision-makers",
                    description:
                        "A clear view of how trusted data and independent analysis improve investment, policy, and mission decisions.",
                },
            ]}
            statement="A consequential gathering for the people financing and building the space economy."
            statementDetail="The 2026 forum has concluded. Explore Cabeus Explorer coverage and future convenings for the insights, people, and decisions continuing this conversation."
        />
    );
}
