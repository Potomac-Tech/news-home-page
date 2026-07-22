import type { TickerItem } from "../_data/marketQuotes";

function formatMarketCap(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

export function StockTicker({ items }: { items: TickerItem[] }) {
    if (!items.length) return null;

    const latestQuoteAt = items.reduce(
        (latest, item) =>
            Date.parse(item.quoteAsOfAt) > Date.parse(latest)
                ? item.quoteAsOfAt
                : latest,
        items[0].quoteAsOfAt
    );

    const tickerItems = (copy: "primary" | "duplicate") =>
        items.map((item) => (
            <li
                key={`${copy}-${item.symbol}`}
                title={`${item.label}. Market capitalization ${formatMarketCap(item.marketCapUsd)}. ${item.detail}.`}
                aria-label={`Rank ${item.rank}, ${item.label}, ${item.symbol}, ${item.value}. ${item.detail}.`}
                className="flex min-h-20 w-44 shrink-0 flex-col justify-center border-r border-potomac-regolith/15 px-4 py-3"
            >
                <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[0.58rem] text-potomac-regolith">
                        {String(item.rank).padStart(2, "0")}
                    </span>
                    <strong className="font-mono text-xs uppercase text-potomac-gold">
                        {item.symbol}
                    </strong>
                </div>
                <span className="mt-2 whitespace-nowrap font-mono text-[0.7rem] font-bold tabular-nums text-white">
                    {item.value}
                </span>
                <span className="mt-1 truncate text-[0.6rem] uppercase text-potomac-regolith">
                    {item.label}
                </span>
            </li>
        ));

    return (
        <section
            aria-label="Top ten publicly traded space companies by market value"
            className="border-b border-potomac-regolith/25 bg-[#090d10]"
        >
            <div className="mx-auto flex w-full max-w-[92rem] flex-col border-x border-potomac-regolith/15 lg:flex-row">
                <div className="flex shrink-0 flex-col items-start gap-3 border-b border-potomac-regolith/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-6 lg:w-56 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:border-r">
                    <div>
                        <p className="font-mono text-[0.6rem] font-bold uppercase text-potomac-gold">
                            Space Market 10
                        </p>
                        <p className="mt-1 font-serif text-lg uppercase text-white">
                            Market-cap leaders
                        </p>
                    </div>
                    <time
                        dateTime={latestQuoteAt}
                        title="Companies are ranked by the latest published market-cap snapshot. Prices are delayed market observations, not real-time exchange quotes."
                        className="font-mono text-[0.55rem] uppercase leading-4 text-potomac-regolith"
                    >
                        Delayed | {new Date(latestQuoteAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "America/New_York",
                            timeZoneName: "short",
                        })}
                    </time>
                    {items[0].sourceUrl ? (
                        <a
                            href={items[0].sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[0.55rem] uppercase text-potomac-gold hover:text-potomac-cream"
                        >
                            Source: {items[0].sourceName}
                        </a>
                    ) : null}
                </div>
                <div className="stock-ticker-viewport min-w-0 flex-1">
                    <div className="stock-ticker-track">
                        <ol className="stock-ticker-list">{tickerItems("primary")}</ol>
                        <ol aria-hidden="true" className="stock-ticker-list stock-ticker-duplicate">
                            {tickerItems("duplicate")}
                        </ol>
                    </div>
                </div>
            </div>
        </section>
    );
}
