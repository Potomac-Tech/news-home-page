import Link from "next/link";

type ConveningSection = {
    number: string;
    title: string;
    description: string;
};

type ConveningPageProps = {
    eyebrow: string;
    title: string;
    introduction: string;
    imageUrl: string;
    imageAlt: string;
    dateLabel: string;
    locationLabel: string;
    primaryCta: { href: string; label: string };
    secondaryCta?: { href: string; label: string };
    sections: ConveningSection[];
    statement: string;
    statementDetail: string;
    dark?: boolean;
};

export function ConveningPage({
    eyebrow,
    title,
    introduction,
    imageUrl,
    imageAlt,
    dateLabel,
    locationLabel,
    primaryCta,
    secondaryCta,
    sections,
    statement,
    statementDetail,
    dark = false,
}: ConveningPageProps) {
    const foreground = dark ? "text-cabeus-paper" : "text-cabeus-ink";
    const muted = dark ? "text-cabeus-paper/65" : "text-cabeus-muted";
    const rule = dark ? "border-cabeus-paper/20" : "border-cabeus-line";

    return (
        <main className={dark ? "bg-cabeus-ink" : "bg-cabeus-paper"}>
            <section className={`border-b ${rule}`}>
                <div className="mx-auto grid min-h-[42rem] w-full max-w-[92rem] lg:grid-cols-[0.88fr_1.12fr]">
                    <div className="flex flex-col justify-between px-5 py-14 md:px-10 md:py-20 lg:py-24">
                        <div>
                            <p className="brand-kicker">{eyebrow}</p>
                            <h1
                                className={`mt-7 max-w-[12ch] text-balance font-serif text-[clamp(3.7rem,6.5vw,7.25rem)] font-medium leading-[0.9] [overflow-wrap:anywhere] ${foreground}`}
                            >
                                {title}
                            </h1>
                            <p className={`mt-8 max-w-xl text-base leading-7 md:text-lg md:leading-8 ${muted}`}>
                                {introduction}
                            </p>
                        </div>
                        <div className="mt-12 flex flex-wrap gap-3">
                            <Link
                                href={primaryCta.href}
                                className={dark ? "brand-button inline-flex bg-cabeus-paper text-cabeus-ink hover:bg-cabeus-gold" : "brand-button inline-flex"}
                            >
                                {primaryCta.label}
                            </Link>
                            {secondaryCta ? (
                                <Link
                                    href={secondaryCta.href}
                                    className={dark ? "brand-button brand-button-outline inline-flex border-cabeus-paper/40 text-cabeus-paper hover:bg-cabeus-paper hover:text-cabeus-ink" : "brand-button brand-button-outline inline-flex"}
                                >
                                    {secondaryCta.label}
                                </Link>
                            ) : null}
                        </div>
                    </div>
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="order-first h-56 w-full object-cover sm:h-72 lg:order-none lg:h-full lg:min-h-[30rem]"
                        fetchPriority="high"
                    />
                </div>
            </section>

            <section className={`border-b ${rule}`}>
                <div className={`mx-auto grid w-full max-w-[92rem] divide-y md:grid-cols-2 md:divide-x md:divide-y-0 ${rule}`}>
                    <div className="px-5 py-6 md:px-10">
                        <p className="brand-kicker">When</p>
                        <p className={`mt-2 font-serif text-3xl ${foreground}`}>{dateLabel}</p>
                    </div>
                    <div className="px-5 py-6 md:px-10">
                        <p className="brand-kicker">Where</p>
                        <p className={`mt-2 font-serif text-3xl ${foreground}`}>{locationLabel}</p>
                    </div>
                </div>
            </section>

            <section className={`border-b ${rule}`}>
                <div className="mx-auto w-full max-w-[92rem] px-5 py-16 md:px-10 md:py-24">
                    <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
                        <div>
                            <p className="brand-kicker">The program</p>
                            <h2 className={`mt-4 max-w-[10ch] font-serif text-5xl font-medium leading-[0.92] md:text-7xl ${foreground}`}>
                                Built for people who move the industry.
                            </h2>
                        </div>
                        <div className={`border-t ${rule}`}>
                            {sections.map((section) => (
                                <article
                                    key={section.number}
                                    className={`grid gap-4 border-b py-7 sm:grid-cols-[4rem_1fr] ${rule}`}
                                >
                                    <p className={`font-mono text-xs font-semibold ${dark ? "text-cabeus-gold" : "text-cabeus-bronze"}`}>
                                        {section.number}
                                    </p>
                                    <div>
                                        <h3 className={`font-serif text-3xl font-medium ${foreground}`}>
                                            {section.title}
                                        </h3>
                                        <p className={`mt-3 max-w-2xl text-sm leading-6 ${muted}`}>
                                            {section.description}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className={dark ? "bg-cabeus-paper text-cabeus-ink" : "bg-cabeus-ink text-cabeus-paper"}>
                <div className="mx-auto grid w-full max-w-[92rem] gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                    <h2 className="max-w-[14ch] font-serif text-5xl font-medium leading-[0.92] md:text-7xl">
                        {statement}
                    </h2>
                    <div>
                        <p className="max-w-xl text-base leading-7 opacity-70">
                            {statementDetail}
                        </p>
                        <Link
                            href={primaryCta.href}
                            className={dark ? "brand-button mt-8 inline-flex" : "brand-button mt-8 inline-flex bg-cabeus-paper text-cabeus-ink hover:bg-cabeus-gold"}
                        >
                            {primaryCta.label}
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
