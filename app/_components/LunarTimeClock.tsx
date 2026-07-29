"use client";

import { useEffect, useMemo, useState } from "react";
import {
    estimateLunarTime,
    formatReferenceTime,
    LUNAR_TIME_EPOCH_ISO,
    LUNAR_TIME_RATE_MICROSECONDS_PER_DAY,
    lunarOffsetMilliseconds,
} from "../_data/lunarTime";

const TOOLTIP_ID = "estimated-lunar-time-method";

function formatOffset(value: number | null) {
    if (value === null) {
        return "offset unavailable";
    }

    const sign = value >= 0 ? "+" : "";
    return `${sign}${(value / 1_000).toFixed(3)} s vs UTC`;
}

export function LunarTimeClock({ initialUtcIso }: { initialUtcIso: string }) {
    const [utcTime, setUtcTime] = useState(() => new Date(initialUtcIso));

    useEffect(() => {
        const updateClock = () => setUtcTime(new Date());
        updateClock();
        const timer = window.setInterval(updateClock, 1_000);

        return () => window.clearInterval(timer);
    }, []);

    const lunarTime = useMemo(() => estimateLunarTime(utcTime), [utcTime]);
    const available = !Number.isNaN(utcTime.getTime()) && lunarTime !== null;
    const utcDisplay = available ? formatReferenceTime(utcTime) : "Unavailable";
    const lunarDisplay = lunarTime ? formatReferenceTime(lunarTime) : "Unavailable";
    const offsetDisplay = formatOffset(lunarOffsetMilliseconds(utcTime));

    return (
        <section
            aria-label="Estimated coordinated lunar time"
            className="border-b border-cabeus-line bg-cabeus-smoke"
        >
            <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
                <div className="flex items-center gap-3">
                    <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 bg-cabeus-gold"
                    />
                    <div>
                        <p className="font-mono text-[0.62rem] font-bold uppercase text-cabeus-bronze">
                            Cislunar reference
                        </p>
                        <p className="text-xs text-cabeus-muted">
                            Provisional research estimate, not an adopted lunar civil timezone
                        </p>
                    </div>
                </div>

                <div
                    tabIndex={0}
                    aria-describedby={TOOLTIP_ID}
                    className="group relative grid min-w-0 cursor-help grid-cols-2 border border-cabeus-line bg-cabeus-paper outline-none focus-visible:border-cabeus-gold sm:min-w-[34rem]"
                >
                    <div className="min-w-0 border-r border-cabeus-line px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[0.6rem] font-bold uppercase text-cabeus-bronze">
                                Estimated LTC
                            </span>
                            <span className="hidden font-mono text-[0.56rem] uppercase text-cabeus-muted sm:inline">
                                {offsetDisplay}
                            </span>
                        </div>
                        <time
                            aria-label={`Estimated coordinated lunar time ${lunarDisplay}`}
                            className="mt-1 block min-h-5 whitespace-nowrap font-mono text-[0.68rem] font-bold tabular-nums text-cabeus-ink sm:text-xs"
                        >
                            {lunarDisplay}
                        </time>
                    </div>
                    <div className="min-w-0 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[0.6rem] font-bold uppercase text-cabeus-muted">
                                UTC
                            </span>
                            <span
                                aria-hidden="true"
                                className="flex h-4 w-4 items-center justify-center border border-cabeus-line font-mono text-[0.58rem] font-bold text-cabeus-muted"
                            >
                                i
                            </span>
                        </div>
                        <time
                            dateTime={available ? utcTime.toISOString() : undefined}
                            aria-label={`Coordinated Universal Time ${utcDisplay}`}
                            className="mt-1 block min-h-5 whitespace-nowrap font-mono text-[0.68rem] font-bold tabular-nums text-cabeus-ink sm:text-xs"
                        >
                            {utcDisplay}
                        </time>
                    </div>

                    <div
                        id={TOOLTIP_ID}
                        role="tooltip"
                        className="invisible absolute right-0 top-full z-40 mt-2 w-[min(34rem,calc(100vw-2rem))] border border-cabeus-gold bg-cabeus-ink p-4 text-left opacity-0 shadow-2xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                    >
                        <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                            What estimated LTC means
                        </p>
                        <p className="mt-2 text-xs leading-5 text-cabeus-paper/80">
                            Coordinated Lunar Time is the proposed common reference for clocks near the Moon. We estimate a lunar-surface clock by synchronizing it with UTC at {LUNAR_TIME_EPOCH_ISO.slice(0, 10)} and then letting it gain {LUNAR_TIME_RATE_MICROSECONDS_PER_DAY} microseconds per Earth day, the mean relativistic rate published by NIST and JPL researchers.
                        </p>
                        <p className="mt-2 text-xs leading-5 text-cabeus-paper/60">
                            Formula: estimated LTC = UTC + elapsed Earth days since the epoch x {LUNAR_TIME_RATE_MICROSECONDS_PER_DAY}{" "}microseconds. Periodic and site-specific corrections are omitted because they are below this display&apos;s millisecond precision. The synchronization epoch is a Cabeus Explorer convention and will be replaced when the international LTC realization is adopted.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
