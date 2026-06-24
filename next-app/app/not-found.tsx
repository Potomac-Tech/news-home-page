import Link from "next/link";

export default function NotFound() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-7xl flex-col justify-center px-4 py-20 md:px-8">
                <h1 className="font-serif text-4xl text-white md:text-6xl">
                    Page not found
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                    The requested route is not part of the current Potomac
                    migration scaffold.
                </p>
                <Link
                    href="/"
                    className="mt-10 inline-block w-fit rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Return home
                </Link>
            </div>
        </section>
    );
}
