import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { build } from "esbuild";

const result = await build({
    entryPoints: ["lib/email/release-policy.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
const { emailReleaseBlockers } = await import(moduleUrl);

const valid = {
    apiKeyPresent: true,
    fromEmail: "info@potomacdb.com",
    toEmail: "info@potomacdb.com",
    plan: "free",
    inboundReceiving: "disabled",
    sendingDomainCount: "1",
    domainStatus: "verified",
    senderStatus: "verified",
};

test("verified Resend Free configuration passes the release gate", () => {
    assert.deepEqual(emailReleaseBlockers(valid), []);
});

for (const [name, override, expected] of [
    ["missing API key", { apiKeyPresent: false }, "api_key_missing"],
    ["wrong sender", { fromEmail: "onboarding@resend.dev" }, "sender_invalid"],
    ["wrong destination", { toEmail: "sales@example.com" }, "recipient_invalid"],
    ["paid plan", { plan: "pro" }, "plan_not_free"],
    ["inbound receiving", { inboundReceiving: "enabled" }, "inbound_enabled"],
    ["extra domain", { sendingDomainCount: "2" }, "domain_count_invalid"],
    ["unverified domain", { domainStatus: "pending" }, "domain_unverified"],
    ["unverified sender", { senderStatus: "failed" }, "sender_unverified"],
]) {
    test(`${name} blocks release`, () => {
        assert.ok(emailReleaseBlockers({ ...valid, ...override }).includes(expected));
    });
}

test("duplicate submissions remain idempotent and no workflow grants Command automatically", () => {
    const migration = readFileSync("supabase/migrations/20260710185238_meridian_authenticated_inquiry_workflow.sql", "utf8");
    const action = readFileSync("app/command/actions.ts", "utf8");
    assert.match(migration, /on conflict \(idempotency_key\)[\s\S]*do update/i);
    assert.doesNotMatch(`${migration}\n${action}`, /grant[^\n]*(?:command|entitlement)|activate[^\n]*(?:command|entitlement)/i);
});
