import Link from "next/link";

type RouteScaffoldProps = {
    title: string;
    description: string;
    status: string;
    primaryHref?: string;
    primaryLabel?: string;
};

export function RouteScaffold({
    title,
    description,
    status,
    primaryHref = "/news",
    primaryLabel = "View news",
}: RouteScaffoldProps) {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-7xl flex-col justify-center px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        {status}
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        {title}
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                        {description}
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link
                            href={primaryHref}
                            className="rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            {primaryLabel}
                        </Link>
                        <Link
                            href="/"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Home
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
