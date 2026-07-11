import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const sponsorSource = readFileSync(new URL("app/_data/sponsorAds.ts", root), "utf8");
const contentLoader = readFileSync(new URL("app/_data/contentSubmissions.ts", root), "utf8");
const contentAssetRoute = readFileSync(new URL("app/api/content-assets/[id]/route.ts", root), "utf8");
const ctaAssetRoute = readFileSync(new URL("app/api/cta-assets/[id]/route.ts", root), "utf8");

const reviewedAt = sponsorSource.match(
    /fallbackPromotionalContentReviewedAt\s*=\s*\n?\s*"([^"]+)"/
)?.[1];
assert.ok(reviewedAt, "Fallback promotional review timestamp is required.");
const reviewedTime = new Date(reviewedAt).getTime();
const expirationValues = [...sponsorSource.matchAll(/expiresAt:\s*"([^"]+)"/g)].map(
    (match) => match[1]
);
assert.equal(expirationValues.length, 4, "All four reviewed strategic fallback units require expiration.");
for (const value of expirationValues) {
    const expiration = new Date(value).getTime();
    assert.ok(expiration > Date.now(), `Promotional fallback expired: ${value}`);
    assert.ok(
        expiration <= reviewedTime + 30 * 86_400_000,
        `Promotional fallback exceeds the 30-day window: ${value}`
    );
}

for (const [label, source] of [
    ["published content loader", contentLoader],
    ["published content asset route", contentAssetRoute],
    ["CTA asset route", ctaAssetRoute],
]) {
    assert.match(source, /expires_at/,
        `${label} must inspect expiration metadata.`);
    assert.match(source, /> now|\.gt\("expires_at"|<= new Date/,
        `${label} must suppress expired content.`);
}

console.log(`Promotional expiration check passed for ${expirationValues.length} fallback units.`);
