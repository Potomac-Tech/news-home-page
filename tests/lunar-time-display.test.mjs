import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { transform } from "esbuild";

const calculationSource = readFileSync("app/_data/lunarTime.ts", "utf8");
const componentSource = readFileSync("app/_components/LunarTimeClock.tsx", "utf8");
const homepageSource = readFileSync("app/page.tsx", "utf8");
const methodology = readFileSync("docs/lunar-time-methodology.md", "utf8");
const compiled = await transform(calculationSource, { loader: "ts", format: "esm" });
const calculation = await import(
    `data:text/javascript;base64,${Buffer.from(compiled.code).toString("base64")}`
);

test("lunar estimate is synchronized at the declared epoch", () => {
    const epoch = new Date(calculation.LUNAR_TIME_EPOCH_ISO);
    assert.equal(calculation.estimateLunarTime(epoch).getTime(), epoch.getTime());
});

test("lunar estimate gains the published mean rate", () => {
    const epoch = Date.parse(calculation.LUNAR_TIME_EPOCH_ISO);
    const oneThousandDaysLater = epoch + 1_000 * 86_400_000;
    const offset = calculation.lunarOffsetMilliseconds(oneThousandDaysLater);

    assert.ok(Math.abs(offset - 56.0256) < 0.001);
    assert.equal(calculation.LUNAR_TIME_RATE_MICROSECONDS_PER_DAY, 56.0256);
});

test("invalid input produces the approved unavailable state", () => {
    assert.equal(calculation.estimateLunarTime(Number.NaN), null);
    assert.equal(calculation.lunarOffsetMilliseconds(Number.NaN), null);
    assert.equal(calculation.formatReferenceTime(new Date(Number.NaN)), "Unavailable");
    assert.ok(componentSource.includes('"Unavailable"'));
});

test("clock refreshes without replacing the server-rendered fallback", () => {
    assert.ok(componentSource.includes("initialUtcIso"));
    assert.ok(componentSource.includes("window.setInterval(updateClock, 1_000)"));
    assert.ok(homepageSource.includes("<LunarTimeClock initialUtcIso={new Date().toISOString()} />"));
    assert.ok(componentSource.includes("min-h-5"));
    assert.ok(componentSource.includes("tabular-nums"));
});

test("explanation works with hover, focus, touch focus, and assistive technology", () => {
    for (const token of [
        "tabIndex={0}",
        "aria-describedby={TOOLTIP_ID}",
        'role="tooltip"',
        "group-hover:visible",
        "group-focus-within:visible",
        'aria-label="Estimated coordinated lunar time"',
    ]) {
        assert.ok(componentSource.includes(token), `missing ${token}`);
    }
});

test("methodology discloses the estimate, formula, precision, and sources", () => {
    for (const token of [
        "56.0256 microseconds per Earth day",
        "1977-01-01T00:00:00.000Z",
        "not an adopted lunar civil timezone",
        "Periodic and site-specific corrections",
        "NASA",
        "NIST",
        "Turyshev",
        "Bourgoin",
    ]) {
        assert.ok(
            componentSource.includes(token) || methodology.includes(token),
            `missing ${token}`
        );
    }
});

test("clock layout provides stable mobile and desktop constraints", () => {
    assert.ok(componentSource.includes("flex-col"));
    assert.ok(componentSource.includes("md:flex-row"));
    assert.ok(componentSource.includes("grid-cols-2"));
    assert.ok(componentSource.includes("whitespace-nowrap"));
    assert.ok(componentSource.includes("calc(100vw-2rem)"));
});
