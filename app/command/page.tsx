import type { Metadata } from "next";
import { CommandInterestForm } from "./CommandInterestForm";
import { tierConfig } from "../_data/tiers";

export const metadata: Metadata = {
    title: tierConfig.enterprise.publicName,
    description:
        `Register ${tierConfig.enterprise.publicName} interest for organization-level Cabeus Explorer lunar intelligence access.`,
    alternates: {
        canonical: "/command",
    },
};

type CommandPageProps = {
    searchParams: Promise<{
        status?: string;
    }>;
};

export default async function CommandPage({ searchParams }: CommandPageProps) {
    const { status } = await searchParams;

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-[0.85fr_1.15fr] md:px-8">
                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Organization-level intelligence
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        {tierConfig.enterprise.publicName} Access
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                        {tierConfig.enterprise.publicName} access is handled through direct review and
                        admin approval for organizations that need deeper lunar
                        intelligence, analyst support, and mission briefings.
                    </p>
                </div>
                <CommandInterestForm status={status} />
            </div>
        </section>
    );
}
