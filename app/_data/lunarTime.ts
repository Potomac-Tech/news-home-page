export const CABEUS_MEAN_TIME_REFERENCE_NEW_MOON_ISO =
    "2026-07-14T09:43:00.000Z";
export const MEAN_SYNODIC_PERIOD_EARTH_DAYS = 29.5305888531;
export const CABEUS_LONGITUDE_DEGREES_EAST = -35.5;

const EARTH_MILLISECONDS_PER_DAY = 86_400_000;
const CMT_HOURS_PER_LUNAR_DAY = 24;
const DEGREES_PER_CMT_HOUR = 15;
const meanSynodicPeriodMilliseconds =
    MEAN_SYNODIC_PERIOD_EARTH_DAYS * EARTH_MILLISECONDS_PER_DAY;
const referenceNewMoonMilliseconds = Date.parse(
    CABEUS_MEAN_TIME_REFERENCE_NEW_MOON_ISO
);

export type CabeusMeanTime = {
    hours: number;
    minutes: number;
    seconds: number;
    decimalHours: number;
    cycleFraction: number;
    isMeanDaylight: boolean;
    solarPhase: "Before dawn" | "Lunar morning" | "Lunar afternoon" | "After dusk";
    nextTransition: "Dawn" | "Dusk";
    earthMillisecondsUntilTransition: number;
};

function positiveModulo(value: number, divisor: number) {
    return ((value % divisor) + divisor) % divisor;
}

export function calculateCabeusMeanTime(
    utc: Date | number
): CabeusMeanTime | null {
    const utcMilliseconds = utc instanceof Date ? utc.getTime() : utc;

    if (!Number.isFinite(utcMilliseconds)) {
        return null;
    }

    const elapsedCycles =
        (utcMilliseconds - referenceNewMoonMilliseconds) /
        meanSynodicPeriodMilliseconds;
    const cycleFraction = positiveModulo(elapsedCycles, 1);
    const primeMeridianHours = cycleFraction * CMT_HOURS_PER_LUNAR_DAY;
    const longitudeOffsetHours =
        CABEUS_LONGITUDE_DEGREES_EAST / DEGREES_PER_CMT_HOUR;
    const rawDecimalHours = positiveModulo(
        primeMeridianHours + longitudeOffsetHours,
        CMT_HOURS_PER_LUNAR_DAY
    );
    const solarBoundary = [0, 6, 12, 18, 24].find(
        (boundary) => Math.abs(rawDecimalHours - boundary) < 1e-9
    );
    const decimalHours =
        solarBoundary === 24 ? 0 : (solarBoundary ?? rawDecimalHours);
    const totalSeconds =
        Math.round(decimalHours * 60 * 60) %
        (CMT_HOURS_PER_LUNAR_DAY * 60 * 60);
    const hours = Math.floor(totalSeconds / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    const isMeanDaylight = decimalHours >= 6 && decimalHours < 18;
    const nextTransition = isMeanDaylight ? "Dusk" : "Dawn";
    const nextTransitionHour = isMeanDaylight ? 18 : 6;
    const cmtHoursUntilTransition = positiveModulo(
        nextTransitionHour - decimalHours,
        CMT_HOURS_PER_LUNAR_DAY
    );
    const earthMillisecondsUntilTransition =
        (cmtHoursUntilTransition / CMT_HOURS_PER_LUNAR_DAY) *
        meanSynodicPeriodMilliseconds;

    const solarPhase =
        decimalHours < 6
            ? "Before dawn"
            : decimalHours < 12
              ? "Lunar morning"
              : decimalHours < 18
                ? "Lunar afternoon"
                : "After dusk";

    return {
        hours,
        minutes,
        seconds,
        decimalHours,
        cycleFraction,
        isMeanDaylight,
        solarPhase,
        nextTransition,
        earthMillisecondsUntilTransition,
    };
}

export function formatCabeusMeanTime(value: CabeusMeanTime | null): string {
    if (!value) return "Unavailable";

    return [value.hours, value.minutes, value.seconds]
        .map((part) => String(part).padStart(2, "0"))
        .join(":");
}

export function formatEarthDuration(milliseconds: number): string {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) {
        return "time unavailable";
    }

    const totalHours = Math.max(0, Math.round(milliseconds / 3_600_000));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days && hours) return `${days}d ${hours}h`;
    if (days) return `${days}d`;
    return `${hours}h`;
}
