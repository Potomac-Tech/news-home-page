import Link from "next/link";
import type { PublicEconomySummary } from "../_data/economy";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
});

function formatDate(value: string) {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Latest";
    }

    return dateFormatter.format(date);
}

function formatMoney(value: number, currencyCode: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function statusLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function rangeLabel(summary: PublicEconomySummary) {
    if (summary.rangeLowValue == null || summary.rangeHighValue == null) {
        return "No public range";
    }

    return `${formatMoney(
        summary.rangeLowValue,
        summary.currencyCode
    )} - ${formatMoney(summary.rangeHighValue, summary.currencyCode)}`;
}

export function EconomySummaryWidget({
    summary,
}: {
    summary: PublicEconomySummary;
}) {
    return (
        <article className="glass-card rounded p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Lunar economy tracker
                    </p>
                    <h3 className="mt-4 font-serif text-4xl leading-tight text-white md:text-5xl">
                        {formatMoney(summary.headlineValue, summary.currencyCode)}
                    </h3>
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-potomac-cream/55">
                        {summary.scenarioLabel}
                    </p>
                </div>
                <div className="rounded border border-white/10 p-4 lg:min-w-56">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Public range
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                        {rangeLabel(summary)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-potomac-cream/45">
                        {formatDate(summary.outputDate)}
                    </p>
                </div>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-6 text-potomac-cream/75">
                {summary.methodologyNote}
            </p>

            <dl className="mt-6 grid gap-4 text-sm text-potomac-cream/70 sm:grid-cols-3">
                <div className="border-l border-potomac-gold/35 pl-4">
                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        Confidence
                    </dt>
                    <dd className="mt-1">
                        {statusLabel(summary.confidenceLabel)} |{" "}
                        {summary.confidenceScore}%
                    </dd>
                </div>
                <div className="border-l border-white/15 pl-4">
                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        Sources
                    </dt>
                    <dd className="mt-1">{summary.sourceCount} reviewed</dd>
                </div>
                <div className="border-l border-white/15 pl-4">
                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        Freshness
                    </dt>
                    <dd className="mt-1">{formatDate(summary.freshnessAt)}</dd>
                </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
                <Link
                    href="/apply"
                    className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Unlock methodology
                </Link>
                <Link
                    href="/news"
                    className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Related briefs
                </Link>
            </div>
        </article>
    );
}
