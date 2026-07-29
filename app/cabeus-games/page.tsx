import type { Metadata } from "next";
import { ConveningPage } from "../_components/ConveningPage";
import { potomacBrand } from "../_data/brand";

export const metadata: Metadata = {
    title: "Cabeus Games",
    description:
        "Mission-oriented challenges for the teams and leaders preparing to operate beyond Earth.",
    alternates: { canonical: "/cabeus-games" },
};

export default function CabeusGamesPage() {
    return (
        <ConveningPage
            dark
            eyebrow="Mission training / September 2026"
            title="Train Like an Astronaut."
            introduction="The Cabeus Games turn the complexity of lunar operations into a demanding team experience built around communication, judgment, technical tradeoffs, and mission execution."
            imageUrl={potomacBrand.assets.gamesHero}
            imageAlt="Participant training in a lunar mission simulation facility"
            dateLabel="Fall 2026. Email info@cabeusexplorer.com to apply to compete."
            locationLabel="Washington, D.C."
            primaryCta={{
                href: "/request-access?source=cabeus-games",
                label: "Register interest",
            }}
            secondaryCta={{
                href: "/space-industrialist-week",
                label: "Explore the week",
            }}
            sections={[
                {
                    number: "01",
                    title: "Mission control",
                    description:
                        "Teams work through time-critical operating scenarios with incomplete information, shifting constraints, and shared objectives.",
                },
                {
                    number: "02",
                    title: "Surface operations",
                    description:
                        "Participants confront the coordination, resource, mobility, and communications decisions that define lunar field operations.",
                },
                {
                    number: "03",
                    title: "Leadership under pressure",
                    description:
                        "The competition rewards clear communication, disciplined tradeoffs, and the ability to keep a mission aligned when conditions change.",
                },
            ]}
            statement="Performance is the difference between a plan and a mission."
            statementDetail="The inaugural Cabeus Games will take place as part of Space Industrialist Week. Final challenge design and participant details will be shared with confirmed teams."
        />
    );
}
