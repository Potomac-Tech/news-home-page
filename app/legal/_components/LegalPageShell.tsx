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
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl gap-10 px-4 py-16 md:px-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                        {eyebrow}
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                        {title}
                    </h1>
                    <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                        {description}
                    </p>
                    <div className="mt-10 grid gap-5">
                        {sections.map((section) => (
                            <article
                                key={section.title}
                                className="rounded border border-white/10 p-5"
                            >
                                <h2 className="font-serif text-2xl text-white">
                                    {section.title}
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                    {section.body}
                                </p>
                                {section.bullets ? (
                                    <ul className="mt-4 grid gap-2 text-sm leading-6 text-potomac-cream/65">
                                        {section.bullets.map((bullet) => (
                                            <li key={bullet}>{bullet}</li>
                                        ))}
                                    </ul>
                                ) : null}
                            </article>
                        ))}
                    </div>
                    {children ? <div className="mt-8">{children}</div> : null}
                </div>
                <aside className="glass-card h-fit rounded p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Trust center
                    </p>
                    <nav className="mt-4 grid gap-2" aria-label="Trust pages">
                        {trustRoutes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className="rounded border border-white/10 p-3 text-sm text-potomac-cream/70 transition hover:border-potomac-gold hover:text-potomac-gold"
                            >
                                {route.label}
                            </Link>
                        ))}
                    </nav>
                    <p className="mt-5 text-xs leading-5 text-potomac-cream/50">
                        For support, privacy, billing, accessibility, or safety
                        requests, contact{" "}
                        <a
                            href={`mailto:${supportEmail}`}
                            className="text-potomac-gold"
                        >
                            {supportEmail}
                        </a>
                        .
                    </p>
                </aside>
            </div>
        </section>
    );
}
