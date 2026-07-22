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

    return (
        <section
            aria-label="Top ten publicly traded space companies by market value"
            className="border-b border-potomac-regolith/25 bg-[#090d10]"
        >
            <div className="mx-auto flex w-full max-w-[92rem] flex-col border-x border-potomac-regolith/15 lg:flex-row">
                <div className="flex shrink-0 items-center justify-between gap-6 border-b border-potomac-regolith/20 px-4 py-3 lg:w-56 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:border-r md:px-6">
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
                <ol className="stock-ticker-scroll flex min-w-0 flex-1 overflow-x-auto">
                    {items.map((item) => (
                        <li
                            key={item.symbol}
                            title={`${item.label}. Market capitalization ${formatMarketCap(item.marketCapUsd)}. ${item.detail}.`}
                            aria-label={`Rank ${item.rank}, ${item.label}, ${item.symbol}, ${item.value}. ${item.detail}.`}
                            className="flex min-h-20 min-w-40 flex-1 flex-col justify-center border-r border-potomac-regolith/15 px-4 py-3 last:border-r-0"
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
                    ))}
                </ol>
            </div>
        </section>
    );
}
