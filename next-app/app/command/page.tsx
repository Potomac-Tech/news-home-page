import type { Metadata } from "next";
import { CommandInterestForm } from "./CommandInterestForm";

export const metadata: Metadata = {
    title: "Command",
};

export default function CommandPage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-[0.85fr_1.15fr] md:px-8">
                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Organization-level intelligence
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Command Access
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                        Command access is handled through direct sales and
                        admin approval for organizations that need deeper lunar
                        intelligence, analyst support, and mission briefings.
                    </p>
                </div>
                <CommandInterestForm />
            </div>
        </section>
    );
}
