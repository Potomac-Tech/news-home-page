export const OBSERVABILITY_BUDGET = Object.freeze({
  baselineRate: 0.01,
  reduceAt: 190_000,
  reduceFurtherAt: 195_000,
  pauseAt: 199_000,
});

export function samplingPolicyFor(eventCount) {
  if (!Number.isFinite(eventCount) || eventCount < 0) {
    throw new TypeError("eventCount must be a non-negative finite number");
  }

  if (eventCount >= OBSERVABILITY_BUDGET.pauseAt) {
    return { rate: 0, state: "paused" };
  }

  if (eventCount >= OBSERVABILITY_BUDGET.reduceFurtherAt) {
    return { rate: 0.001, state: "critical" };
  }

  if (eventCount >= OBSERVABILITY_BUDGET.reduceAt) {
    return { rate: 0.005, state: "reduced" };
  }

  return { rate: OBSERVABILITY_BUDGET.baselineRate, state: "normal" };
}

export function utcDayWindow(now = new Date()) {
  const from = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return { from, to: now.getTime() };
}

export function utcMonthKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function nextUtcMonthEpochSeconds(now = new Date()) {
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1000,
  );
}
