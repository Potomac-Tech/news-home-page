"use client";

import { useMemo, useState } from "react";
import {
    lunarCalculators,
    type CalculatorInput,
    type LunarCalculator,
} from "../_data/lunarCalculators";

type InputValues = Record<string, number>;

function defaultsFor(calculator: LunarCalculator): InputValues {
    return Object.fromEntries(
        calculator.inputs.map((input) => [input.key, input.defaultValue])
    );
}

function clampInput(input: CalculatorInput, rawValue: string) {
    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed)) {
        return input.defaultValue;
    }

    return Math.min(input.max, Math.max(input.min, parsed));
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
    }).format(value);
}

function calculate(id: string, values: InputValues) {
    if (id === "mission-cost") {
        const directCostM =
            (values.payloadMassKg * values.transportCostPerKg) / 1_000_000;
        const subtotal =
            directCostM + values.integrationCostM + values.missionOpsCostM;
        return subtotal * (1 + values.reservePercent / 100);
    }

    if (id === "launch-window") {
        const cadencePressure = Math.min(
            35,
            (values.synodicCadenceDays / Math.max(values.maxDelayDays, 1)) * 9
        );
        const coastPressure = Math.min(25, values.coastDays * 0.9);
        const lightingPressure = Math.min(25, values.lightingDays * 1.8);
        const delayRelief = Math.min(20, values.maxDelayDays * 0.35);
        return Math.max(
            0,
            Math.min(
                100,
                35 + cadencePressure + coastPressure + lightingPressure - delayRelief
            )
        );
    }

    if (id === "rf-link-budget") {
        const frequencyMhz = values.frequencyGhz * 1000;
        const pathLoss =
            32.44 +
            20 * Math.log10(Math.max(values.distanceKm, 1)) +
            20 * Math.log10(Math.max(frequencyMhz, 1));
        const receivedCn0 =
            values.eirpDbw +
            values.receiveGainDbi -
            pathLoss -
            values.lossesDb +
            228.6;
        return receivedCn0 - values.requiredCn0Dbhz;
    }

    if (id === "thermal-budget") {
        const stefanBoltzmann = 5.670374419e-8;
        const absorbed =
            values.solarFlux * values.absorptivity * values.areaM2 +
            values.internalHeatW;
        const denominator =
            Math.max(values.emissivity, 0.01) *
            stefanBoltzmann *
            Math.max(values.areaM2, 0.01);
        return (absorbed / denominator) ** 0.25 - 273.15;
    }

    if (id === "radiation-exposure") {
        return (
            values.surfaceDays *
            values.dailyDoseMsv *
            values.solarEventFactor *
            values.shieldingFactor
        );
    }

    const generatedKwh =
        (values.arrayAreaM2 *
            1361 *
            (values.arrayEfficiency / 100) *
            values.sunlightHours) /
        1000;
    const dayUseKwh = (values.dayLoadW * values.sunlightHours) / 1000;
    const nightUseKwh =
        (values.nightLoadW * values.nightHours) /
        1000 /
        Math.max(values.storageEfficiency / 100, 0.01);

    return generatedKwh - dayUseKwh - nightUseKwh;
}

export function LunarCalculatorWorkspace() {
    const [selectedId, setSelectedId] = useState(lunarCalculators[0].id);
    const selected = useMemo(
        () =>
            lunarCalculators.find((calculator) => calculator.id === selectedId) ??
            lunarCalculators[0],
        [selectedId]
    );
    const [valuesByCalculator, setValuesByCalculator] = useState<
        Record<string, InputValues>
    >(() =>
        Object.fromEntries(
            lunarCalculators.map((calculator) => [
                calculator.id,
                defaultsFor(calculator),
            ])
        )
    );
    const values = valuesByCalculator[selected.id] ?? defaultsFor(selected);
    const result = calculate(selected.id, values);

    function updateValue(input: CalculatorInput, rawValue: string) {
        setValuesByCalculator((current) => ({
            ...current,
            [selected.id]: {
                ...(current[selected.id] ?? defaultsFor(selected)),
                [input.key]: clampInput(input, rawValue),
            },
        }));
    }

    return (
        <section className="bg-potomac-primary">
            <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                    <aside className="space-y-3">
                        {lunarCalculators.map((calculator) => (
                            <button
                                key={calculator.id}
                                type="button"
                                onClick={() => setSelectedId(calculator.id)}
                                className={`w-full rounded border p-4 text-left transition ${
                                    calculator.id === selected.id
                                        ? "border-potomac-gold bg-potomac-gold/10"
                                        : "border-white/10 bg-white/[0.03] hover:border-potomac-gold/50"
                                }`}
                            >
                                <span className="flex items-start justify-between gap-3">
                                    <span>
                                        <span className="block text-sm font-bold text-white">
                                            {calculator.name}
                                        </span>
                                        <span className="mt-2 block text-xs leading-5 text-potomac-cream/60">
                                            {calculator.summary}
                                        </span>
                                    </span>
                                    <span className="shrink-0 rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                                        {calculator.tier}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </aside>

                    <div className="rounded border border-potomac-gold/20 bg-white/[0.04] p-5 md:p-7">
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-potomac-gold">
                                    {selected.category} calculator
                                </p>
                                <h1 className="mt-3 font-serif text-3xl leading-tight text-white md:text-5xl">
                                    {selected.name}
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-6 text-potomac-cream/70">
                                    {selected.summary}
                                </p>
                            </div>
                            <div className="rounded border border-white/10 bg-potomac-secondary/70 p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-potomac-cream/50">
                                    {selected.outputLabel}
                                </p>
                                <p className="mt-2 text-3xl font-bold text-white">
                                    {formatNumber(result)}
                                </p>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-potomac-gold">
                                    {selected.outputUnit}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            {selected.inputs.map((input) => (
                                <label
                                    key={input.key}
                                    className="rounded border border-white/10 bg-potomac-secondary/50 p-4"
                                >
                                    <span className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-bold text-white">
                                            {input.label}
                                        </span>
                                        <span className="text-xs text-potomac-cream/50">
                                            {input.unit}
                                        </span>
                                    </span>
                                    <input
                                        className="mt-3 w-full rounded border border-white/10 bg-potomac-primary px-3 py-2 text-sm text-white outline-none transition focus:border-potomac-gold"
                                        type="number"
                                        min={input.min}
                                        max={input.max}
                                        step={input.step}
                                        value={values[input.key]}
                                        onChange={(event) =>
                                            updateValue(input, event.target.value)
                                        }
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            <div className="rounded border border-white/10 p-4">
                                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                    Formula
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                    {selected.formula}
                                </p>
                            </div>
                            <div className="rounded border border-white/10 p-4">
                                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                    Limits
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                    {selected.limitation}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded border border-white/10 p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded border border-white/10 px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-potomac-cream/60">
                                    Confidence: {selected.confidence}
                                </span>
                                <span className="rounded border border-white/10 px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-potomac-cream/60">
                                    Saved runs: Scout+
                                </span>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {selected.citations.map((citation) => (
                                    <a
                                        key={citation.url}
                                        href={citation.url}
                                        className="rounded border border-white/10 p-3 text-sm text-potomac-cream/70 transition hover:border-potomac-gold hover:text-white"
                                    >
                                        <span className="block font-bold text-white">
                                            {citation.label}
                                        </span>
                                        <span className="mt-1 block text-xs">
                                            {citation.source}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
