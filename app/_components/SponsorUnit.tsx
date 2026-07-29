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
                className="h-28 w-full object-cover"
            />
        );
    }

    return (
        <div className="flex h-28 items-center justify-center border border-cabeus-line bg-cabeus-smoke px-4 text-center">
            <span className="font-serif text-2xl leading-tight text-cabeus-ink">
                {unit.sponsorName}
            </span>
        </div>
    );
}

export function SponsorUnit({ unit, variant = "compact" }: SponsorUnitProps) {
    const content = (
        <>
            <p className="mb-3 font-mono text-[0.58rem] font-bold uppercase text-cabeus-muted">
                {unit.isDirectSold ? "Sponsored content" : "Publisher promotion"}
            </p>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-mono text-xs font-bold uppercase text-cabeus-bronze">
                        {unit.label}
                    </p>
                    <h3 className="mt-3 font-serif text-2xl leading-snug text-cabeus-ink">
                        {unit.sponsorName}
                    </h3>
                </div>
                <span className="shrink-0 border border-cabeus-line px-3 py-1 font-mono text-[0.62rem] font-bold uppercase text-cabeus-muted">
                    {unit.isDirectSold ? "Active" : "Approved"}
                </span>
            </div>
            <div className="mt-4">
                <CreativeFrame unit={unit} />
            </div>
            <p className="mt-4 font-mono text-xs uppercase text-cabeus-muted">
                {unit.surface}
            </p>
            <p className="mt-3 text-sm leading-6 text-cabeus-muted">
                {unit.note}
            </p>
            <p className="mt-4 font-mono text-xs font-bold uppercase text-cabeus-muted">
                {unit.campaignName}
            </p>
            {unit.sponsorWebsiteUrl && unit.ctaLabel ? (
                <span className="brand-button brand-button-outline mt-5 inline-flex">
                    {unit.ctaLabel}
                </span>
            ) : null}
        </>
    );
    const className =
        variant === "wide"
            ? "border border-cabeus-line bg-cabeus-paper p-5 md:grid md:grid-cols-[18rem_1fr] md:items-center md:gap-6"
            : "border border-cabeus-line bg-cabeus-paper p-5";

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
                className={`${className} block transition hover:border-cabeus-gold`}
            >
                {content}
            </a>
        );
    }

    return <aside className={className}>{content}</aside>;
}
