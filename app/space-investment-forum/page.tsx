import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Space Investment Forum",
    description:
        "A Cabeus Explorer forum on capital, industry, and strategic competition in the space economy.",
    alternates: { canonical: "/space-investment-forum" },
};

const program = [
    {
        number: "01",
        title: "American strength in space",
        description:
            "A featured conversation on capital, industry, and strategic competition across the civil, commercial, and national-security space communities.",
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
            "A direct examination of how trusted data and independent analysis improve investment, policy, and mission decisions.",
    },
] as const;

const partnerWordmarks = [
    { name: "Meet the Future", src: "/partner-mtf.png", dark: true },
    { name: "Space Force Association", src: "/partner-sfa.png", dark: true },
    { name: "Quantum Space", src: "/partner-quantum-space.svg", dark: true },
    { name: "Potomac Database Systems", src: "/Potomac Logo Transparent.png", dark: false },
    { name: "PSW Science", src: "/partner-psw-science.png", dark: false },
] as const;

const keynoteImage = {
    src: "https://xlpkdoeldtlhearqajat.supabase.co/storage/v1/object/public/editorial-media/62870429-f2fa-4c8e-b6c2-0175cf8ecc77/d905640d-98f3-4810-94ad-9d8bc1389cea/38629897-b400-4544-9c87-8b4e42d6ee83-dscf9143.jpg",
    alt: "Former NASA administrator Jim Bridenstine keynotes the Cabeus Explorer Space Investment Forum.",
} as const;

export default function SpaceInvestmentForumPage() {
    return (
        <div className="bg-cabeus-paper text-cabeus-ink">
            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid min-h-[39rem] w-full max-w-[92rem] lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="flex flex-col justify-center px-5 py-16 md:px-10 md:py-24">
                        <p className="brand-kicker">Leadership / capital / innovation / orbit</p>
                        <h1 className="mt-6 max-w-[10ch] text-balance font-serif text-[clamp(4rem,7vw,7.5rem)] font-medium leading-[0.9]">
                            Space Investment Forum.
                        </h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-cabeus-muted">
                            Cabeus Explorer convened senior leaders in investment,
                            government, industry, and national security to examine the
                            capital and partnerships shaping American leadership in
                            space.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/archives?section=space-investment-forum" className="brand-button inline-flex">
                                Read forum coverage
                            </Link>
                            <Link href="/contact" className="brand-button brand-button-outline inline-flex">
                                Contact the team
                            </Link>
                        </div>
                    </div>
                    <div className="flex min-h-[39rem] flex-col bg-cabeus-ink text-cabeus-paper">
                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5 pt-8 md:px-10 md:pt-12">
                            <img
                                src={keynoteImage.src}
                                alt={keynoteImage.alt}
                                className="h-full max-h-[25rem] w-full object-contain object-center"
                            />
                        </div>
                        <div className="px-5 pb-12 pt-8 md:px-10 md:pb-16">
                            <p className="font-mono text-xs font-bold uppercase text-cabeus-gold">
                                Keynote conversation
                            </p>
                            <p className="mt-5 font-serif text-5xl leading-[0.98]">
                                American Strength in Space
                            </p>
                            <p className="mt-5 text-sm leading-6 text-cabeus-paper/75">
                                Capital, industry, and strategic competition.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-cabeus-line bg-cabeus-smoke">
                <div className="mx-auto grid w-full max-w-[92rem] md:grid-cols-2">
                    <div className="px-5 py-6 md:px-10">
                        <p className="brand-kicker">When</p>
                        <p className="mt-2 font-serif text-3xl">July 21, 2026</p>
                    </div>
                    <div className="border-t border-cabeus-line px-5 py-6 md:border-l md:border-t-0 md:px-10">
                        <p className="brand-kicker">Where</p>
                        <p className="mt-2 font-serif text-3xl">
                            The Cosmos Club / Washington, D.C.
                        </p>
                    </div>
                </div>
            </section>

            <section className="border-b border-cabeus-line">
                <div className="mx-auto w-full max-w-[92rem] px-5 py-16 md:px-10 md:py-24">
                    <p className="brand-kicker">Keynoted by</p>
                    <div className="mt-6 grid border-y border-cabeus-line md:grid-cols-2">
                        <article className="py-8 md:pr-10">
                            <h2 className="font-serif text-5xl leading-none">
                                Jim Bridenstine
                            </h2>
                            <p className="mt-4 font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                Former NASA Administrator / CEO, Quantum Space
                            </p>
                        </article>
                        <article className="border-t border-cabeus-line py-8 md:border-l md:border-t-0 md:pl-10">
                            <h2 className="font-serif text-5xl leading-none">
                                Brig. Gen. (Ret.) Damon Feltman
                            </h2>
                            <p className="mt-4 font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                CEO, Space Force Association
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-[92rem] gap-12 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[0.72fr_1.28fr]">
                    <div>
                        <p className="brand-kicker">The program</p>
                        <h2 className="mt-4 max-w-[10ch] font-serif text-5xl leading-[0.94] md:text-7xl">
                            A consequential gathering.
                        </h2>
                    </div>
                    <div className="border-t border-cabeus-line">
                        {program.map((section) => (
                            <article
                                key={section.number}
                                className="grid gap-4 border-b border-cabeus-line py-7 sm:grid-cols-[4rem_1fr]"
                            >
                                <p className="font-mono text-xs font-semibold text-cabeus-bronze">
                                    {section.number}
                                </p>
                                <div>
                                    <h3 className="font-serif text-3xl">{section.title}</h3>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-cabeus-muted">
                                        {section.description}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-b border-cabeus-line bg-cabeus-smoke">
                <div className="mx-auto w-full max-w-[92rem] px-5 py-14 md:px-10 md:py-20">
                    <p className="brand-kicker">Presented in partnership with</p>
                    <div
                        className="mt-7 grid border-y border-cabeus-line sm:grid-cols-2 lg:grid-cols-5"
                        aria-label="Space Investment Forum sponsor logos"
                    >
                        {partnerWordmarks.map((partner, index) => (
                            <div
                                key={partner.name}
                                className={`flex min-h-36 items-center justify-center p-6 ${
                                    index ? "border-t border-cabeus-line sm:border-l sm:border-t-0" : ""
                                } ${partner.dark ? "bg-cabeus-ink" : "bg-cabeus-paper"}`}
                            >
                                <img
                                    src={partner.src}
                                    alt={`${partner.name} logo`}
                                    className="max-h-20 w-full max-w-[13rem] object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
