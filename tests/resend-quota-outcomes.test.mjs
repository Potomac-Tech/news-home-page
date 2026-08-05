import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const result = await build({
    entryPoints: ["lib/email/resend-response.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
const { classifyResendQuotaHold } = await import(moduleUrl);

for (const reason of ["daily_quota_exceeded", "monthly_quota_exceeded", "rate_limit_exceeded"]) {
    test(`mocked ${reason} response is held`, () => {
        assert.equal(classifyResendQuotaHold(400, reason), reason);
    });
}

test("mocked HTTP 429 without a provider code is rate-limited", () => {
    assert.equal(classifyResendQuotaHold(429, null), "rate_limit_exceeded");
});

test("mocked non-quota provider failure is not held", () => {
    assert.equal(classifyResendQuotaHold(500, "validation_error"), null);
});
