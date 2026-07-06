export type CalculatorInput = {
    key: string;
    label: string;
    unit: string;
    defaultValue: number;
    min: number;
    max: number;
    step: number;
};

export type CalculatorCitation = {
    label: string;
    source: string;
    url: string;
};

export type LunarCalculator = {
    id: string;
    name: string;
    category: string;
    summary: string;
    outputLabel: string;
    outputUnit: string;
    confidence: "Medium" | "Experimental";
    tier: "Explorer" | "Scout";
    limitation: string;
    formula: string;
    inputs: CalculatorInput[];
    citations: CalculatorCitation[];
};

export const lunarCalculators: LunarCalculator[] = [
    {
        id: "mission-cost",
        name: "Lunar mission cost",
        category: "Cost",
        summary:
            "Builds a rough mission budget from delivered mass, transport price, integration, operations, and reserve assumptions.",
        outputLabel: "Estimated mission budget",
        outputUnit: "USD millions",
        confidence: "Experimental",
        tier: "Explorer",
        limitation:
            "This is an order-of-magnitude planning model, not a bid estimate. It excludes financing, insurance, export-control review, and provider-specific nonrecurring terms.",
        formula:
            "mass kg * transport $/kg + integration + operations, then reserve percentage.",
        inputs: [
            {
                key: "payloadMassKg",
                label: "Delivered payload mass",
                unit: "kg",
                defaultValue: 40,
                min: 1,
                max: 2000,
                step: 1,
            },
            {
                key: "transportCostPerKg",
                label: "Transport price",
                unit: "USD/kg",
                defaultValue: 1200000,
                min: 10000,
                max: 5000000,
                step: 10000,
            },
            {
                key: "integrationCostM",
                label: "Integration and payload ops",
                unit: "USD M",
                defaultValue: 18,
                min: 0,
                max: 500,
                step: 1,
            },
            {
                key: "missionOpsCostM",
                label: "Mission operations",
                unit: "USD M",
                defaultValue: 9,
                min: 0,
                max: 300,
                step: 1,
            },
            {
                key: "reservePercent",
                label: "Management reserve",
                unit: "%",
                defaultValue: 25,
                min: 0,
                max: 100,
                step: 1,
            },
        ],
        citations: [
            {
                label: "NASA CLPS context",
                source: "NASA Commercial Lunar Payload Services",
                url: "https://www.nasa.gov/commercial-lunar-payload-services/",
            },
            {
                label: "Cost-estimating practice",
                source: "NASA Cost Estimating Handbook",
                url: "https://www.nasa.gov/ocfo/ppc-corner/cost-estimating-handbook/",
            },
        ],
    },
    {
        id: "launch-window",
        name: "Launch-window screen",
        category: "Trajectory",
        summary:
            "Scores rough launch-window pressure from desired cadence, coast duration, lighting, and allowed delay.",
        outputLabel: "Window pressure score",
        outputUnit: "0-100",
        confidence: "Experimental",
        tier: "Explorer",
        limitation:
            "This does not solve trajectories. It is a planning screen for schedule pressure before dedicated mission design analysis.",
        formula:
            "Cadence, coast, lighting, and delay constraints are normalized into a 0-100 pressure score.",
        inputs: [
            {
                key: "synodicCadenceDays",
                label: "Candidate cadence",
                unit: "days",
                defaultValue: 29.5,
                min: 5,
                max: 90,
                step: 0.5,
            },
            {
                key: "coastDays",
                label: "Earth-Moon coast",
                unit: "days",
                defaultValue: 5,
                min: 2,
                max: 45,
                step: 0.5,
            },
            {
                key: "lightingDays",
                label: "Required site lighting",
                unit: "days",
                defaultValue: 7,
                min: 0,
                max: 15,
                step: 0.5,
            },
            {
                key: "maxDelayDays",
                label: "Allowed launch delay",
                unit: "days",
                defaultValue: 10,
                min: 1,
                max: 60,
                step: 1,
            },
        ],
        citations: [
            {
                label: "Lunar phase cycle",
                source: "NASA Moon fact sheet",
                url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
            },
            {
                label: "Mission analysis context",
                source: "NASA General Mission Analysis Tool",
                url: "https://software.nasa.gov/software/GSC-17177-1",
            },
        ],
    },
    {
        id: "rf-link-budget",
        name: "RF link budget",
        category: "Communications",
        summary:
            "Estimates received carrier-to-noise density margin for a lunar-distance radio link.",
        outputLabel: "Estimated link margin",
        outputUnit: "dB",
        confidence: "Medium",
        tier: "Explorer",
        limitation:
            "This simplified link budget omits modulation, coding, weather, pointing dynamics, polarization mismatch, and network scheduling.",
        formula:
            "EIRP + receive gain - free-space path loss - implementation losses - required C/N0.",
        inputs: [
            {
                key: "eirpDbw",
                label: "Transmitter EIRP",
                unit: "dBW",
                defaultValue: 18,
                min: -20,
                max: 80,
                step: 1,
            },
            {
                key: "receiveGainDbi",
                label: "Receive antenna gain",
                unit: "dBi",
                defaultValue: 58,
                min: 0,
                max: 90,
                step: 1,
            },
            {
                key: "frequencyGhz",
                label: "Frequency",
                unit: "GHz",
                defaultValue: 8.4,
                min: 0.1,
                max: 40,
                step: 0.1,
            },
            {
                key: "distanceKm",
                label: "Link distance",
                unit: "km",
                defaultValue: 384400,
                min: 1000,
                max: 500000,
                step: 1000,
            },
            {
                key: "lossesDb",
                label: "Implementation losses",
                unit: "dB",
                defaultValue: 4,
                min: 0,
                max: 30,
                step: 0.5,
            },
            {
                key: "requiredCn0Dbhz",
                label: "Required C/N0",
                unit: "dB-Hz",
                defaultValue: 47,
                min: 10,
                max: 90,
                step: 1,
            },
        ],
        citations: [
            {
                label: "DSN telecommunications",
                source: "NASA Deep Space Network",
                url: "https://www.nasa.gov/directorates/somd/space-communications-navigation-program/deep-space-network/",
            },
            {
                label: "Lunar distance",
                source: "NASA Moon fact sheet",
                url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
            },
        ],
    },
    {
        id: "thermal-budget",
        name: "Thermal balance",
        category: "Environment",
        summary:
            "Estimates a simple radiative equilibrium temperature from solar input, absorptivity, emissivity, area, and internal heat.",
        outputLabel: "Equilibrium temperature",
        outputUnit: "C",
        confidence: "Experimental",
        tier: "Scout",
        limitation:
            "This is a single-node estimate. It excludes conduction paths, lunar IR/albedo detail, duty cycles, thermal mass, eclipses, and radiator geometry.",
        formula:
            "((absorbed solar plus internal heat) / (emissivity * sigma * area)) ^ 0.25.",
        inputs: [
            {
                key: "solarFlux",
                label: "Solar flux",
                unit: "W/m2",
                defaultValue: 1361,
                min: 100,
                max: 1500,
                step: 1,
            },
            {
                key: "absorptivity",
                label: "Solar absorptivity",
                unit: "ratio",
                defaultValue: 0.35,
                min: 0.01,
                max: 1,
                step: 0.01,
            },
            {
                key: "emissivity",
                label: "IR emissivity",
                unit: "ratio",
                defaultValue: 0.82,
                min: 0.01,
                max: 1,
                step: 0.01,
            },
            {
                key: "areaM2",
                label: "Radiating area",
                unit: "m2",
                defaultValue: 2.5,
                min: 0.1,
                max: 100,
                step: 0.1,
            },
            {
                key: "internalHeatW",
                label: "Internal heat",
                unit: "W",
                defaultValue: 60,
                min: 0,
                max: 5000,
                step: 5,
            },
        ],
        citations: [
            {
                label: "Solar constant",
                source: "NASA Earth fact sheet",
                url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
            },
            {
                label: "Thermal design context",
                source: "NASA Systems Engineering Handbook",
                url: "https://www.nasa.gov/reference/nasa-systems-engineering-handbook/",
            },
        ],
    },
    {
        id: "radiation-exposure",
        name: "Radiation exposure",
        category: "Environment",
        summary:
            "Approximates total ionizing dose exposure from surface duration, baseline dose rate, event factor, and shielding reduction.",
        outputLabel: "Estimated accumulated dose",
        outputUnit: "mSv",
        confidence: "Experimental",
        tier: "Scout",
        limitation:
            "This is not a radiation transport model. It does not substitute for particle environment modeling, shielding geometry, or biological risk analysis.",
        formula:
            "surface days * baseline daily dose * event factor * shielding factor.",
        inputs: [
            {
                key: "surfaceDays",
                label: "Surface duration",
                unit: "days",
                defaultValue: 14,
                min: 1,
                max: 730,
                step: 1,
            },
            {
                key: "dailyDoseMsv",
                label: "Baseline daily dose",
                unit: "mSv/day",
                defaultValue: 1.3,
                min: 0.01,
                max: 20,
                step: 0.1,
            },
            {
                key: "solarEventFactor",
                label: "Solar event factor",
                unit: "multiplier",
                defaultValue: 1.5,
                min: 1,
                max: 20,
                step: 0.1,
            },
            {
                key: "shieldingFactor",
                label: "Shielding factor",
                unit: "multiplier",
                defaultValue: 0.65,
                min: 0.05,
                max: 1,
                step: 0.05,
            },
        ],
        citations: [
            {
                label: "Artemis radiation context",
                source: "NASA Human Research Program",
                url: "https://www.nasa.gov/hrp/",
            },
            {
                label: "Space weather events",
                source: "NOAA Space Weather Prediction Center",
                url: "https://www.swpc.noaa.gov/",
            },
        ],
    },
    {
        id: "power-budget",
        name: "Surface power budget",
        category: "Power",
        summary:
            "Compares solar array generation against daytime load, nighttime load, storage efficiency, and eclipse/night duration.",
        outputLabel: "Daily energy margin",
        outputUnit: "kWh",
        confidence: "Medium",
        tier: "Explorer",
        limitation:
            "This simplified budget excludes thermal power draw changes, dust loss, array pointing, battery depth-of-discharge constraints, and peak transient loads.",
        formula:
            "Array area * solar flux * efficiency * daylight hours minus daytime and stored nighttime energy demand.",
        inputs: [
            {
                key: "arrayAreaM2",
                label: "Solar array area",
                unit: "m2",
                defaultValue: 6,
                min: 0.1,
                max: 200,
                step: 0.1,
            },
            {
                key: "arrayEfficiency",
                label: "Array efficiency",
                unit: "%",
                defaultValue: 28,
                min: 1,
                max: 45,
                step: 1,
            },
            {
                key: "sunlightHours",
                label: "Sunlight per cycle",
                unit: "hours",
                defaultValue: 12,
                min: 0,
                max: 336,
                step: 1,
            },
            {
                key: "dayLoadW",
                label: "Daytime load",
                unit: "W",
                defaultValue: 450,
                min: 1,
                max: 20000,
                step: 10,
            },
            {
                key: "nightHours",
                label: "Night or eclipse duration",
                unit: "hours",
                defaultValue: 12,
                min: 0,
                max: 336,
                step: 1,
            },
            {
                key: "nightLoadW",
                label: "Nighttime load",
                unit: "W",
                defaultValue: 120,
                min: 0,
                max: 10000,
                step: 10,
            },
            {
                key: "storageEfficiency",
                label: "Storage efficiency",
                unit: "%",
                defaultValue: 86,
                min: 1,
                max: 100,
                step: 1,
            },
        ],
        citations: [
            {
                label: "Solar flux baseline",
                source: "NASA Earth fact sheet",
                url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
            },
            {
                label: "Lunar day context",
                source: "NASA Moon fact sheet",
                url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
            },
        ],
    },
];
