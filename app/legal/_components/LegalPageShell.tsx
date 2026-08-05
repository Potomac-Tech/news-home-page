import Link from "next/link";
import { supportEmail, trustRoutes } from "../../_data/trust";

export type LegalSection = {
    title: string;
    body: string;
    bullets?: string[];
};

export function LegalPageShell({
    eyebrow,
    title,
    description,
    sections,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    sections: LegalSection[];
    children?: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-cabeus-paper text-cabeus-ink">
            <header className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
                    <div>
                        <p className="brand-kicker">{eyebrow}</p>
                        <h1 className="mt-5 font-serif text-6xl font-medium leading-[0.9] md:text-8xl">
                            {title}
                        </h1>
                    </div>
                    <p className="max-w-3xl text-base leading-8 text-cabeus-muted md:text-lg">
                        {description}
                    </p>
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-[92rem] lg:grid-cols-[19rem_minmax(0,1fr)]">
                <aside className="border-b border-cabeus-line bg-cabeus-smoke px-5 py-10 md:px-10 lg:border-b-0 lg:border-r lg:px-8 lg:py-14">
                    <div className="lg:sticky lg:top-32">
                        <p className="brand-kicker">Trust center</p>
                        <nav
                            className="mt-6 border-t border-cabeus-line"
                            aria-label="Trust pages"
                        >
                            {trustRoutes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className="flex items-center justify-between gap-4 border-b border-cabeus-line py-4 text-sm text-cabeus-muted transition hover:text-cabeus-ink"
                                >
                                    <span>{route.label}</span>
                                    <span aria-hidden="true" className="font-mono text-cabeus-bronze">
                                        &#8594;
                                    </span>
                                </Link>
                            ))}
                        </nav>
                        <p className="mt-8 text-xs leading-6 text-cabeus-muted">
                            For support, privacy, billing, accessibility, or safety
                            requests, contact{" "}
                            <a
                                href={`mailto:${supportEmail}`}
                                className="break-words border-b border-cabeus-gold text-cabeus-ink transition hover:text-cabeus-bronze"
                            >
                                {supportEmail}
                            </a>
                            .
                        </p>
                    </div>
                </aside>

                <main className="px-5 py-6 md:px-10 md:py-10 lg:px-14 lg:py-12">
                    <div className="border-t border-cabeus-line">
                        {sections.map((section, index) => (
                            <article
                                key={section.title}
                                className="grid gap-5 border-b border-cabeus-line py-9 md:grid-cols-[4rem_minmax(0,1fr)] md:py-12"
                            >
                                <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                    {String(index + 1).padStart(2, "0")}
                                </p>
                                <div>
                                    <h2 className="font-serif text-3xl font-medium leading-tight md:text-4xl">
                                        {section.title}
                                    </h2>
                                    <p className="mt-4 max-w-3xl text-sm leading-7 text-cabeus-muted md:text-base md:leading-8">
                                        {section.body}
                                    </p>
                                    {section.bullets ? (
                                        <ul className="mt-5 grid max-w-3xl gap-3 text-sm leading-7 text-cabeus-muted md:text-base">
                                            {section.bullets.map((bullet) => (
                                                <li
                                                    key={bullet}
                                                    className="grid grid-cols-[1rem_1fr] gap-3"
                                                >
                                                    <span aria-hidden="true" className="text-cabeus-bronze">
                                                        /
                                                    </span>
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                    </div>
                    {children ? <div className="mt-10">{children}</div> : null}
                </main>
            </div>
        </div>
    );
}
