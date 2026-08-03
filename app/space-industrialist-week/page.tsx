import type { Metadata } from "next";
import { ConveningPage } from "../_components/ConveningPage";

export const metadata: Metadata = {
    title: "Space Industrialist Week",
    description:
        "One week uniting the space industrialists securing, building, and financing humanity's permanent presence on the Moon.",
    alternates: { canonical: "/space-industrialist-week" },
};

export default function SpaceIndustrialistWeekPage() {
    return (
        <ConveningPage
            eyebrow="Fall 2026 // Washington D.C."
            title="Space Industrialist Week"
            introduction={
                <>
                    <strong className="font-bold text-cabeus-ink">
                        One week. One mission.
                    </strong>
                    <br />
                    Join the Cabeus Council&apos;s effort to unite space industrialists
                    who are securing, building, and financing humanity&apos;s permanent
                    presence on the Moon.
                </>
            }
            imageUrl="/artemis-ii-earthrise-nasa.jpg"
            imageAlt="Crescent Earth photographed from Orion during NASA's Artemis II mission"
            dateLabel="September 2026"
            locationLabel="Washington, D.C."
            primaryCta={{
                href: "/request-access?source=space-industrialist-week",
                label: "Request invitation",
            }}
            sections={[
                {
                    number: "01",
                    title: "Strategy and capital",
                    description:
                        "Focused sessions on commercial models, public investment, national strategy, and the decisions that turn ambitious programs into durable markets.",
                },
                {
                    number: "02",
                    title: "Lunar infrastructure",
                    description:
                        "Operator-level discussion of transport, power, communications, navigation, surface mobility, data, and the industrial base needed for permanence.",
                },
                {
                    number: "03",
                    title: "The inaugural Cabeus Games",
                    description:
                        "A mission-oriented competition that tests collaboration, judgment, and performance under the constraints of lunar operations.",
                },
            ]}
            statement="One week. The people who are building what comes next."
            statementDetail="Programming and participation are curated. Request an invitation to receive confirmed agenda, venue, and registration information as it is released."
            hideSchedule
            hideProgram
        />
    );
}
