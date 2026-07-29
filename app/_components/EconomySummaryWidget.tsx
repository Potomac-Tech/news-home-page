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
        <article className="mt-8 border-y border-cabeus-line py-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                        Lunar economy tracker
                    </p>
                    <h3 className="mt-4 font-serif text-5xl font-medium leading-tight text-cabeus-ink md:text-7xl">
                        {formatMoney(summary.headlineValue, summary.currencyCode)}
                    </h3>
                    <p className="mt-3 font-mono text-xs font-semibold uppercase text-cabeus-muted">
                        {summary.scenarioLabel}
                    </p>
                </div>
                <div className="border-l border-cabeus-line p-4 lg:min-w-56">
                    <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                        Public range
                    </p>
                    <p className="mt-2 text-lg font-semibold text-cabeus-ink">
                        {rangeLabel(summary)}
                    </p>
                    <p className="mt-2 font-mono text-xs uppercase text-cabeus-muted">
                        {formatDate(summary.outputDate)}
                    </p>
                </div>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-6 text-cabeus-muted">
                {summary.methodologyNote}
            </p>

            <dl className="mt-6 grid gap-4 text-sm text-cabeus-muted sm:grid-cols-3">
                <div className="border-l border-cabeus-gold pl-4">
                    <dt className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                        Confidence
                    </dt>
                    <dd className="mt-1">
                        {statusLabel(summary.confidenceLabel)} |{" "}
                        {summary.confidenceScore}%
                    </dd>
                </div>
                <div className="border-l border-cabeus-line pl-4">
                    <dt className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                        Sources
                    </dt>
                    <dd className="mt-1">{summary.sourceCount} reviewed</dd>
                </div>
                <div className="border-l border-cabeus-line pl-4">
                    <dt className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                        Freshness
                    </dt>
                    <dd className="mt-1">{formatDate(summary.freshnessAt)}</dd>
                </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
                <Link
                    href="/member/economy"
                    className="brand-button inline-flex"
                >
                    Unlock methodology
                </Link>
                <Link
                    href="/news"
                    className="brand-button brand-button-outline inline-flex"
                >
                    Related briefs
                </Link>
            </div>
        </article>
    );
}
