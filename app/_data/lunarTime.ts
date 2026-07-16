export const LUNAR_TIME_RATE_MICROSECONDS_PER_DAY = 56.0256;
export const LUNAR_TIME_EPOCH_ISO = "1977-01-01T00:00:00.000Z";

const MILLISECONDS_PER_DAY = 86_400_000;
const MICROSECONDS_PER_MILLISECOND = 1_000;
const lunarEpochMilliseconds = Date.parse(LUNAR_TIME_EPOCH_ISO);

export function estimateLunarTime(utc: Date | number): Date | null {
    const utcMilliseconds = utc instanceof Date ? utc.getTime() : utc;

    if (!Number.isFinite(utcMilliseconds)) {
        return null;
    }

    const elapsedDays =
        (utcMilliseconds - lunarEpochMilliseconds) / MILLISECONDS_PER_DAY;
    const offsetMilliseconds =
        (elapsedDays * LUNAR_TIME_RATE_MICROSECONDS_PER_DAY) /
        MICROSECONDS_PER_MILLISECOND;
    const lunarMilliseconds = utcMilliseconds + offsetMilliseconds;

    if (!Number.isFinite(lunarMilliseconds)) {
        return null;
    }

    const lunarTime = new Date(lunarMilliseconds);
    return Number.isNaN(lunarTime.getTime()) ? null : lunarTime;
}

export function formatReferenceTime(value: Date): string {
    if (Number.isNaN(value.getTime())) {
        return "Unavailable";
    }

    return value.toISOString().replace("T", " ").replace("Z", "");
}

export function lunarOffsetMilliseconds(utc: Date | number): number | null {
    const utcMilliseconds = utc instanceof Date ? utc.getTime() : utc;

    if (!Number.isFinite(utcMilliseconds)) {
        return null;
    }

    const elapsedDays =
        (utcMilliseconds - lunarEpochMilliseconds) / MILLISECONDS_PER_DAY;
    return (
        (elapsedDays * LUNAR_TIME_RATE_MICROSECONDS_PER_DAY) /
        MICROSECONDS_PER_MILLISECOND
    );
}
