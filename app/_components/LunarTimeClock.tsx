"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CABEUS_LONGITUDE_DEGREES_EAST,
    CABEUS_MEAN_TIME_REFERENCE_NEW_MOON_ISO,
    calculateCabeusMeanTime,
    formatCabeusMeanTime,
    formatEarthDuration,
    MEAN_SYNODIC_PERIOD_EARTH_DAYS,
} from "../_data/lunarTime";

const TOOLTIP_ID = "cabeus-mean-time-method";

export function LunarTimeClock({ initialUtcIso }: { initialUtcIso: string }) {
    const [referenceTime, setReferenceTime] = useState(
        () => new Date(initialUtcIso)
    );

    useEffect(() => {
        const updateClock = () => setReferenceTime(new Date());
        updateClock();
        const timer = window.setInterval(updateClock, 1_000);

        return () => window.clearInterval(timer);
    }, []);

    const cmt = useMemo(
        () => calculateCabeusMeanTime(referenceTime),
        [referenceTime]
    );
    const cmtDisplay = formatCabeusMeanTime(cmt);
    const transitionDisplay = cmt
        ? `${cmt.nextTransition} in ${formatEarthDuration(
              cmt.earthMillisecondsUntilTransition
          )}`
        : "Transition unavailable";

    return (
        <section
            aria-label="Cabeus Mean Time"
            className="border-b border-cabeus-line bg-cabeus-smoke"
        >
            <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
                <div className="flex items-center gap-3">
                    <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 ${
                            cmt?.isMeanDaylight
                                ? "bg-cabeus-gold"
                                : "bg-cabeus-ink"
                        }`}
                    />
                    <div>
                        <p className="font-mono text-[0.62rem] font-bold uppercase text-cabeus-bronze">
                            Cabeus solar reference
                        </p>
                        <p className="text-xs text-cabeus-muted">
                            A 24-hour clock across one 29.53-Earth-day lunar cycle
                        </p>
                    </div>
                </div>

                <div
                    tabIndex={0}
                    aria-describedby={TOOLTIP_ID}
                    className="group relative grid min-w-0 cursor-help grid-cols-2 border border-cabeus-line bg-cabeus-paper outline-none focus-visible:border-cabeus-gold sm:min-w-[34rem]"
                >
                    <div className="min-w-0 border-r border-cabeus-line px-3 py-2">
                        <span className="font-mono text-[0.6rem] font-bold uppercase text-cabeus-bronze">
                            Cabeus Mean Time
                        </span>
                        <time
                            aria-label={`Cabeus Mean Time ${cmtDisplay}`}
                            className="mt-1 block min-h-5 whitespace-nowrap font-mono text-base font-bold tabular-nums text-cabeus-ink sm:text-lg"
                        >
                            {cmtDisplay}
                            <span className="ml-2 text-[0.58rem] text-cabeus-muted">
                                CMT
                            </span>
                        </time>
                    </div>
                    <div className="min-w-0 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[0.6rem] font-bold uppercase text-cabeus-muted">
                                {cmt?.isMeanDaylight
                                    ? "Mean daylight"
                                    : "Mean lunar night"}
                            </span>
                            <span
                                aria-hidden="true"
                                className="flex h-4 w-4 items-center justify-center border border-cabeus-line font-mono text-[0.58rem] font-bold text-cabeus-muted"
                            >
                                i
                            </span>
                        </div>
                        <p
                            aria-live="off"
                            className="mt-1 min-h-5 truncate font-mono text-[0.68rem] font-bold tabular-nums text-cabeus-ink sm:text-xs"
                        >
                            {cmt ? `${cmt.solarPhase} / ${transitionDisplay}` : "Unavailable"}
                        </p>
                    </div>

                    <div
                        id={TOOLTIP_ID}
                        role="tooltip"
                        className="invisible absolute right-0 top-full z-40 mt-2 w-[min(36rem,calc(100vw-2rem))] border border-cabeus-gold bg-cabeus-ink p-4 text-left opacity-0 shadow-2xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                    >
                        <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                            What Cabeus Mean Time means
                        </p>
                        <p className="mt-2 text-xs leading-5 text-cabeus-paper/80">
                            CMT compresses the Moon&apos;s mean{" "}
                            {MEAN_SYNODIC_PERIOD_EARTH_DAYS.toFixed(5)}-Earth-day
                            solar cycle into a familiar 24-hour dial at Cabeus
                            longitude ({Math.abs(CABEUS_LONGITUDE_DEGREES_EAST)} W).
                            Mean dawn is 06:00, mean noon is 12:00, mean dusk is
                            18:00, and mean midnight is 00:00. One CMT hour lasts
                            about 29.53 Earth hours.
                        </p>
                        <p className="mt-2 text-xs leading-5 text-cabeus-paper/60">
                            The calculation advances from the U.S. Naval
                            Observatory new moon at{" "}
                            {CABEUS_MEAN_TIME_REFERENCE_NEW_MOON_ISO.replace(
                                ".000Z",
                                " UTC"
                            )}{" "}
                            and applies the Cabeus longitude offset. It is a Cabeus
                            Explorer convention, not an official lunar timezone.
                            It approximates the Sun&apos;s mean position and does
                            not model polar terrain, libration, eclipses, or the
                            permanently shadowed interior of Cabeus crater.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
