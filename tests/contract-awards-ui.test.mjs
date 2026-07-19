import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/tracker/contracts/page.tsx", "utf8");
const loader = readFileSync("app/_data/contractAwards.ts", "utf8");
const nav = readFileSync("app/_components/MigrationShell.tsx", "utf8");
const member = readFileSync("app/member/page.tsx", "utf8");
const visibility = readFileSync("app/_data/launchVisibility.ts", "utf8");
const middleware = readFileSync("middleware.ts", "utf8");

test("contract awards route exposes required reviewed operational fields", () => {
    for (const token of ["New Contract Awards", "Awarded", "Effective date", "Option exercise", "Customer", "Vendor", "Program", "Award vehicle", "Amount / value state", "Confidence", "Reviewer:", "Last reviewed:", "citation.url"]) assert.ok(page.includes(token), `missing ${token}`);
});

test("loader relies on RLS and explicitly excludes unrelated awards", () => {
    for (const table of ["contract_awards", "contract_award_values", "contract_award_citations"]) assert.ok(loader.includes(`.from(\"${table}\")`), `missing ${table}`);
    assert.ok(loader.includes('.eq("is_space_or_lunar_relevant", true)'));
    assert.ok(loader.includes("return { rows: [] as ContractAwardRow[], unavailable: true }"));
});

test("auth and premium states route to required flows without leaking values", () => {
    assert.ok(page.includes('nextPath: "/tracker/contracts"'));
    assert.ok(page.includes('access.state === "profile_incomplete"'));
    assert.ok(page.includes("Email verification required"));
    assert.ok(page.includes("/request-access" ) || page.includes("access.loginHref"));
    assert.ok(page.includes("/upgrade?tier=scout&source=contract-awards"));
    assert.ok(page.includes("Sign up or Log In for More Details"));
});

test("contract awards stay hidden from launch navigation until reviewed content is published", () => {
    assert.ok(visibility.includes('"/tracker/contracts"'));
    assert.ok(visibility.includes('"contract-awards"'));
    assert.ok(middleware.includes("isHiddenLaunchPath"));
    assert.doesNotMatch(nav, /href:\s*"\/tracker\/contracts"/);
    assert.doesNotMatch(member, /href="\/tracker\/contracts"/);
});
