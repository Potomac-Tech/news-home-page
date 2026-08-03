import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("homepage requests and renders the market-cap-ranked top ten ticker", () => {
    const homepage = read("app/page.tsx");
    const loader = read("app/_data/marketQuotes.ts");
    const ticker = read("app/_components/StockTicker.tsx");
    const styles = read("app/globals.css");

    assert.match(homepage, /loadPublicTickerItems\(10\)/);
    assert.match(homepage, /<StockTicker items=\{tickerItems\}/);
    assert.ok(homepage.indexOf("<StockTicker items={tickerItems}") < homepage.indexOf("<ApolloMoonBackdrop />"));
    assert.match(loader, /ranking_metric.*market_cap_usd/s);
    assert.match(loader, /order\("rank_number", \{ ascending: true \}\)/);
    assert.match(loader, /quotesByCompany/);
    for (const token of [
        "Space Market 10",
        "Market-cap leaders",
        "Delayed |",
        "Source: Alpha Vantage end-of-day quote",
        "min-h-12",
        "grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]",
        "stock-ticker-track",
        "stock-ticker-duplicate",
        "aria-label",
    ]) {
        assert.ok(ticker.includes(token), `ticker should include ${token}`);
    }
    assert.match(styles, /@keyframes stock-ticker-right-to-left/);
    assert.match(styles, /from\s*{\s*transform: translateX\(0\)/);
    assert.match(styles, /to\s*{\s*transform: translateX\(-50%\)/);
    assert.match(styles, /prefers-reduced-motion: reduce/);
    assert.match(styles, /animation-play-state: paused/);
});

test("production snapshot contains exactly ten sourced space companies and prices", () => {
    const migration = [
        read("supabase/migrations/20260722133852_seed_top10_space_stock_ticker.sql"),
        read("supabase/migrations/20260722160400_add_spacex_to_stock_ticker.sql"),
    ].join("\n");
    const expectedSymbols = [
        "SPCX",
        "RKLB",
        "ECHO",
        "ASTS",
        "VSAT",
        "GSAT",
        "PL",
        "KRMN",
        "IRDM",
        "FLY",
    ];

    for (const symbol of expectedSymbols) {
        assert.match(migration, new RegExp(`'${symbol}'`));
        assert.match(migration, new RegExp(`finance\\.yahoo\\.com/quote/${symbol}`));
    }
    assert.match(migration, /to anon, authenticated/);
    assert.match(migration, /publication_status = 'published'/);
    assert.match(migration, /is_displayable[\s\S]*true/);
    assert.match(migration, /Yahoo Finance delayed market snapshot/);
});
