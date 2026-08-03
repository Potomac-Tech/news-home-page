import { potomacBrand } from "../_data/brand";

export function ApolloMoonBackdrop() {
    return (
        <>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <img
                    src={potomacBrand.assets.editorialMoonHero}
                    alt="Full Moon photographed by the Apollo 11 crew during the trans-Earth journey home"
                    className="absolute right-0 top-1/2 h-auto w-[44rem] max-w-none translate-x-1/2 -translate-y-1/2 opacity-25 sm:w-[min(84rem,88vw)] sm:opacity-100"
                    style={{ clipPath: "circle(34.7% at 51% 45%)" }}
                    fetchPriority="high"
                />
            </div>
            <span className="absolute bottom-3 right-5 z-10 bg-cabeus-paper/85 px-2 py-1 font-mono text-[0.5rem] uppercase text-cabeus-muted md:right-10">
                NASA / Apollo 11 / AS11-44-6667
            </span>
        </>
    );
}
