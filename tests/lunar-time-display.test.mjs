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

const reference = Date.parse(
    calculation.CABEUS_MEAN_TIME_REFERENCE_NEW_MOON_ISO
);
const cycleMilliseconds =
    calculation.MEAN_SYNODIC_PERIOD_EARTH_DAYS * 86_400_000;
const cabeusLongitudeCycleFraction =
    Math.abs(calculation.CABEUS_LONGITUDE_DEGREES_EAST) / 360;

function atCmtHour(hour) {
    return (
        reference +
        (cabeusLongitudeCycleFraction + hour / 24) * cycleMilliseconds
    );
}

test("CMT anchors mean solar time to Cabeus longitude", () => {
    const atReferenceNewMoon = calculation.calculateCabeusMeanTime(reference);

    assert.equal(calculation.CABEUS_LONGITUDE_DEGREES_EAST, -35.5);
    assert.equal(calculation.formatCabeusMeanTime(atReferenceNewMoon), "21:38:00");

    const localMidnight = calculation.calculateCabeusMeanTime(atCmtHour(0));
    assert.ok(localMidnight.decimalHours < 0.000001);
    assert.equal(calculation.formatCabeusMeanTime(localMidnight), "00:00:00");
});

test("one 24-hour CMT cycle equals the mean lunar solar day", () => {
    const start = calculation.calculateCabeusMeanTime(atCmtHour(0));
    const oneCmtHourLater = calculation.calculateCabeusMeanTime(
        atCmtHour(0) + cycleMilliseconds / 24
    );
    const oneCycleLater = calculation.calculateCabeusMeanTime(
        atCmtHour(0) + cycleMilliseconds
    );

    assert.equal(calculation.MEAN_SYNODIC_PERIOD_EARTH_DAYS, 29.5305888531);
    assert.equal(calculation.formatCabeusMeanTime(start), "00:00:00");
    assert.equal(calculation.formatCabeusMeanTime(oneCmtHourLater), "01:00:00");
    assert.equal(calculation.formatCabeusMeanTime(oneCycleLater), "00:00:00");
});

test("CMT assigns dawn, noon, dusk, and midnight to familiar hours", () => {
    const dawn = calculation.calculateCabeusMeanTime(atCmtHour(6) + 1_000);
    const noon = calculation.calculateCabeusMeanTime(atCmtHour(12));
    const dusk = calculation.calculateCabeusMeanTime(atCmtHour(18) + 1_000);
    const midnight = calculation.calculateCabeusMeanTime(atCmtHour(0));

    assert.equal(dawn.solarPhase, "Lunar morning");
    assert.equal(dawn.isMeanDaylight, true);
    assert.equal(dawn.nextTransition, "Dusk");
    assert.equal(noon.solarPhase, "Lunar afternoon");
    assert.equal(noon.isMeanDaylight, true);
    assert.equal(dusk.solarPhase, "After dusk");
    assert.equal(dusk.isMeanDaylight, false);
    assert.equal(dusk.nextTransition, "Dawn");
    assert.equal(midnight.solarPhase, "Before dawn");
});

test("transition countdown uses the slowed mean lunar cycle", () => {
    const noon = calculation.calculateCabeusMeanTime(atCmtHour(12));
    const expectedEarthDays = calculation.MEAN_SYNODIC_PERIOD_EARTH_DAYS / 4;
    const actualEarthDays =
        noon.earthMillisecondsUntilTransition / 86_400_000;

    assert.ok(Math.abs(actualEarthDays - expectedEarthDays) < 0.000001);
    assert.match(
        calculation.formatEarthDuration(noon.earthMillisecondsUntilTransition),
        /^7d \d+h$/
    );
});

test("invalid input produces the approved unavailable state", () => {
    assert.equal(calculation.calculateCabeusMeanTime(Number.NaN), null);
    assert.equal(calculation.formatCabeusMeanTime(null), "Unavailable");
    assert.equal(calculation.formatEarthDuration(Number.NaN), "time unavailable");
    assert.ok(componentSource.includes('"Unavailable"'));
});

test("clock refreshes without replacing the server-rendered fallback", () => {
    assert.ok(componentSource.includes("initialUtcIso"));
    assert.ok(componentSource.includes("window.setInterval(updateClock, 1_000)"));
    assert.ok(homepageSource.includes("<LunarTimeClock initialUtcIso={new Date().toISOString()} />"));
    assert.ok(componentSource.includes("min-h-5"));
    assert.ok(componentSource.includes("tabular-nums"));
});

test("explanation works with hover, focus, and assistive technology", () => {
    for (const token of [
        "tabIndex={0}",
        "aria-describedby={TOOLTIP_ID}",
        'role="tooltip"',
        "group-hover:visible",
        "group-focus-within:visible",
        'aria-label="Cabeus Mean Time"',
    ]) {
        assert.ok(componentSource.includes(token), `missing ${token}`);
    }
});

test("methodology discloses the convention, formula, limits, and sources", () => {
    for (const token of [
        "29.5305888531",
        "2026-07-14T09:43:00.000Z",
        "35.5 degrees west",
        "not Coordinated Lunar Time",
        "Permanent shadow inside Cabeus crater",
        "U.S. Naval Observatory",
        "NASA Technical Reports Server",
        "must not be used",
    ]) {
        assert.ok(
            componentSource.includes(token) || methodology.includes(token),
            `missing ${token}`
        );
    }
    assert.doesNotMatch(componentSource, />\s*UTC\s*</);
    assert.doesNotMatch(componentSource, /Estimated LTC|Coordinated Lunar Time is/);
});

test("clock layout provides stable mobile and desktop constraints", () => {
    assert.ok(componentSource.includes("flex-col"));
    assert.ok(componentSource.includes("md:flex-row"));
    assert.ok(componentSource.includes("grid-cols-2"));
    assert.ok(componentSource.includes("whitespace-nowrap"));
    assert.ok(componentSource.includes("calc(100vw-2rem)"));
});
