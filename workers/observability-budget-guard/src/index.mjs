import {
  nextUtcMonthEpochSeconds,
  samplingPolicyFor,
  utcDayWindow,
  utcMonthKey,
} from "./policy.mjs";

const API_ROOT = "https://api.cloudflare.com/client/v4";
const MONTHLY_PAUSE_KEY = "monthly-pause";
const STATUS_KEY = "last-status";

function headers(env) {
  if (!env.CLOUDFLARE_OBSERVABILITY_TOKEN) {
    throw new Error("Missing CLOUDFLARE_OBSERVABILITY_TOKEN");
  }

  return {
    Authorization: `Bearer ${env.CLOUDFLARE_OBSERVABILITY_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function cloudflareRequest(env, path, init = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { ...headers(env), ...init.headers },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success === false) {
    const message = body?.errors?.map((error) => error.message).join("; ");
    throw new Error(message || `Cloudflare API returned ${response.status}`);
  }

  return body?.result;
}

function findEventCount(result) {
  const calculations = result?.calculations;
  if (!Array.isArray(calculations)) return null;

  for (const calculation of calculations) {
    if (!Array.isArray(calculation?.aggregates)) continue;
    const total = calculation.aggregates.reduce(
      (sum, aggregate) => sum + (Number(aggregate?.value) || 0),
      0,
    );
    if (Number.isFinite(total)) return total;
  }

  return null;
}

async function queryDailyEvents(env, now) {
  const timeframe = utcDayWindow(now);
  const result = await cloudflareRequest(
    env,
    `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/observability/telemetry/query`,
    {
      method: "POST",
      body: JSON.stringify({
        queryId: `cabeus-budget-${timeframe.from}`,
        timeframe,
        view: "calculations",
        ignoreSeries: true,
        parameters: {
          datasets: ["cloudflare-workers"],
          calculations: [{ operator: "count", alias: "events" }],
          filterCombination: "and",
          filters: [
            {
              key: "$metadata.service",
              operation: "eq",
              type: "string",
              value: env.TARGET_SCRIPT_NAME,
            },
          ],
        },
      }),
    },
  );
  const eventCount = findEventCount(result);

  if (eventCount === null) {
    throw new Error("Cloudflare telemetry query did not return an event count");
  }

  return eventCount;
}

function observabilitySettings(rate) {
  const enabled = rate > 0;
  return {
    enabled,
    logs: {
      enabled,
      invocation_logs: enabled,
      head_sampling_rate: rate,
    },
    traces: {
      enabled,
      head_sampling_rate: rate,
    },
  };
}

function samplingRateMatches(settings, rate) {
  const expected = observabilitySettings(rate);
  const actual = settings?.observability;

  return (
    actual?.enabled === expected.enabled &&
    actual?.logs?.enabled === expected.logs.enabled &&
    Number(actual?.logs?.head_sampling_rate) === rate &&
    actual?.traces?.enabled === expected.traces.enabled &&
    Number(actual?.traces?.head_sampling_rate) === rate
  );
}

async function applySamplingRate(env, rate) {
  const path = `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${env.TARGET_SCRIPT_NAME}/script-settings`;
  const current = await cloudflareRequest(env, path);

  if (samplingRateMatches(current, rate)) {
    return { changed: false };
  }

  await cloudflareRequest(env, path, {
    method: "PATCH",
    body: JSON.stringify({ observability: observabilitySettings(rate) }),
  });

  return { changed: true };
}

async function isPausedForMonth(env, now) {
  const pause = await env.OBSERVABILITY_STATE.get(MONTHLY_PAUSE_KEY, "json");
  return pause?.month === utcMonthKey(now);
}

async function saveStatus(env, status) {
  await env.OBSERVABILITY_STATE.put(
    STATUS_KEY,
    JSON.stringify({ ...status, checkedAt: new Date().toISOString() }),
  );
}

export async function enforceBudget(env, now = new Date()) {
  try {
    if (await isPausedForMonth(env, now)) {
      const update = await applySamplingRate(env, 0);
      const result = { eventCount: null, rate: 0, state: "monthly-pause", ...update };
      await saveStatus(env, { healthy: true, ...result });
      return result;
    }

    const eventCount = await queryDailyEvents(env, now);
    const policy = samplingPolicyFor(eventCount);

    if (policy.state === "paused") {
      await env.OBSERVABILITY_STATE.put(
        MONTHLY_PAUSE_KEY,
        JSON.stringify({ month: utcMonthKey(now), triggeredAt: now.toISOString() }),
        { expiration: nextUtcMonthEpochSeconds(now) },
      );
    }

    const update = await applySamplingRate(env, policy.rate);
    const result = { eventCount, ...policy, ...update };
    await saveStatus(env, { healthy: true, ...result });
    return result;
  } catch (error) {
    // Fail closed: a telemetry-query failure must not leave billable sampling on.
    let pauseError = null;
    try {
      await applySamplingRate(env, 0);
    } catch (caught) {
      pauseError = caught;
    }

    await saveStatus(env, {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
      pauseError: pauseError instanceof Error ? pauseError.message : null,
    });
    throw error;
  }
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(enforceBudget(env));
  },
};
