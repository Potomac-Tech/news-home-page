import type { SponsorAdUnit } from "../_data/sponsorAds";

type SponsorUnitProps = {
    unit: SponsorAdUnit;
    variant?: "compact" | "wide";
};

function CreativeFrame({ unit }: { unit: SponsorAdUnit }) {
    if (unit.creativeUrl) {
        return (
            <img
                src={unit.creativeUrl}
                alt={unit.creativeAltText}
                className="h-28 w-full rounded object-cover"
            />
        );
    }

    return (
        <div className="flex h-28 items-center justify-center rounded border border-potomac-gold/25 bg-black/25 px-4 text-center">
            <span className="font-serif text-2xl leading-tight text-white">
                {unit.sponsorName}
            </span>
        </div>
    );
}

export function SponsorUnit({ unit, variant = "compact" }: SponsorUnitProps) {
    const content = (
        <>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        {unit.label}
                    </p>
                    <h3 className="mt-3 font-serif text-xl leading-snug text-white">
                        {unit.sponsorName}
                    </h3>
                </div>
                <span className="shrink-0 rounded border border-white/15 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/55">
                    {unit.isDirectSold ? "Active" : "Reserved"}
                </span>
            </div>
            <div className="mt-4">
                <CreativeFrame unit={unit} />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                {unit.surface}
            </p>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                {unit.note}
            </p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                {unit.campaignName}
            </p>
        </>
    );
    const className =
        variant === "wide"
            ? "glass-card rounded p-5 md:grid md:grid-cols-[18rem_1fr] md:items-center md:gap-6"
            : "glass-card rounded p-5";

    if (unit.sponsorWebsiteUrl) {
        return (
            <a
                href={unit.sponsorWebsiteUrl}
                target={unit.sponsorWebsiteUrl.startsWith("http") ? "_blank" : undefined}
                rel={
                    unit.sponsorWebsiteUrl.startsWith("http")
                        ? "noopener noreferrer sponsored"
                        : "sponsored"
                }
                className={`${className} block transition hover:border-potomac-gold/55 hover:bg-white/[0.04]`}
            >
                {content}
            </a>
        );
    }

    return <aside className={className}>{content}</aside>;
}
