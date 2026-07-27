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
                className="flex min-h-14 w-36 shrink-0 flex-col justify-center border-r border-potomac-regolith/15 px-3 py-2"
            >
                <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[0.52rem] text-potomac-regolith">
                        {String(item.rank).padStart(2, "0")}
                    </span>
                    <strong className="font-mono text-[0.66rem] uppercase text-potomac-gold">
                        {item.symbol}
                    </strong>
                </div>
                <span className="mt-1 whitespace-nowrap font-mono text-[0.64rem] font-bold tabular-nums text-white">
                    {item.value}
                </span>
                <span className="truncate text-[0.52rem] uppercase text-potomac-regolith">
                    {item.label}
                </span>
            </li>
        ));

    return (
        <section
            aria-label="Top ten publicly traded space companies by market value"
            className="border-b border-potomac-regolith/25 bg-[#090d10]"
        >
            <div className="mx-auto grid w-full max-w-[92rem] grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 px-2 py-2 lg:flex lg:gap-0">
                <div className="flex min-h-12 shrink-0 flex-col justify-center border border-potomac-regolith/20 px-3 lg:min-h-14 lg:w-52 lg:px-4">
                    <p className="font-mono text-[0.58rem] font-bold uppercase text-potomac-gold">
                        Space Market 10
                    </p>
                    <p className="mt-0.5 font-serif text-sm uppercase text-white">
                        Market-cap leaders
                    </p>
                </div>
                <div className="stock-ticker-viewport col-span-2 row-start-2 min-w-0 flex-1 border-y border-potomac-regolith/20 lg:order-none lg:col-auto lg:row-auto">
                    <div className="stock-ticker-track">
                        <ol className="stock-ticker-list">{tickerItems("primary")}</ol>
                        <ol aria-hidden="true" className="stock-ticker-list stock-ticker-duplicate">
                            {tickerItems("duplicate")}
                        </ol>
                    </div>
                </div>
                <div className="col-start-2 row-start-1 flex min-h-12 shrink-0 flex-col justify-center border border-potomac-regolith/20 px-3 lg:col-auto lg:row-auto lg:min-h-14 lg:w-72 lg:px-4">
                    <time
                        dateTime={latestQuoteAt}
                        title="Companies are ranked by the latest published market-cap snapshot. Prices are delayed market observations, not real-time exchange quotes."
                        className="font-mono text-[0.52rem] uppercase leading-4 text-potomac-regolith"
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
                            className="font-mono text-[0.52rem] uppercase leading-4 text-potomac-gold hover:text-potomac-cream"
                        >
                            Source: Alpha Vantage end-of-day quote
                        </a>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
