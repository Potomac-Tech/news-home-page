import assert from "node:assert/strict";
import test from "node:test";

import {
  nextUtcMonthEpochSeconds,
  OBSERVABILITY_BUDGET,
  samplingPolicyFor,
  utcDayWindow,
  utcMonthKey,
} from "../workers/observability-budget-guard/src/policy.mjs";

test("uses one percent sampling below the reduction threshold", () => {
  assert.deepEqual(samplingPolicyFor(189_999), {
    rate: 0.01,
    state: "normal",
  });
});

test("reduces sampling in two stages before the hard stop", () => {
  assert.deepEqual(samplingPolicyFor(OBSERVABILITY_BUDGET.reduceAt), {
    rate: 0.005,
    state: "reduced",
  });
  assert.deepEqual(samplingPolicyFor(OBSERVABILITY_BUDGET.reduceFurtherAt), {
    rate: 0.001,
    state: "critical",
  });
});

test("pauses logs and traces at 199,000 events", () => {
  assert.deepEqual(samplingPolicyFor(OBSERVABILITY_BUDGET.pauseAt), {
    rate: 0,
    state: "paused",
  });
});

test("starts a new budget window at midnight UTC", () => {
  const now = new Date("2026-07-14T17:45:12.000Z");
  assert.deepEqual(utcDayWindow(now), {
    from: Date.parse("2026-07-14T00:00:00.000Z"),
    to: now.getTime(),
  });
});

test("monthly pause state expires at the next UTC month", () => {
  const now = new Date("2026-07-31T23:59:59.000Z");
  assert.equal(utcMonthKey(now), "2026-07");
  assert.equal(
    nextUtcMonthEpochSeconds(now),
    Date.parse("2026-08-01T00:00:00.000Z") / 1000,
  );
});

test("rejects invalid event counts", () => {
  assert.throws(() => samplingPolicyFor(-1), TypeError);
  assert.throws(() => samplingPolicyFor(Number.NaN), TypeError);
});
