import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const terminalAuth = fs.readFileSync("lib/auth/terminal.ts", "utf8");
const terminalProxy = fs.readFileSync(
  "app/api/terminal/[...path]/route.ts",
  "utf8",
);

test("Terminal membership uses server-controlled roles and active entitlements", () => {
  assert.match(terminalAuth, /member_role_assignments/);
  assert.match(terminalAuth, /organization_members/);
  assert.match(terminalAuth, /entitlements/);
  assert.match(terminalAuth, /\.eq\("status", "active"\)/);
  assert.match(terminalAuth, /tier === "command" \? "meridian" : tier/);
  assert.doesNotMatch(terminalAuth, /user_metadata/);
});

test("organization claims are active, bounded, validated, and server-produced", () => {
  assert.match(terminalAuth, /\.eq\("status", "active"\)/);
  assert.match(terminalAuth, /\.limit\(51\)/);
  assert.match(terminalAuth, /organizations\.length > 50/);
  assert.match(terminalAuth, /organizationRoleIds/);
  assert.match(terminalProxy, /organizations: viewer\.organizations/);
  assert.doesNotMatch(terminalProxy, /organizations: \[\]/);
});

test("staff and analyst roles cannot become commercial Terminal memberships", () => {
  const membershipLine = terminalAuth.match(
    /const membershipPrecedence = \[[^\]]+\]/,
  )?.[0];
  assert.equal(
    membershipLine,
    'const membershipPrecedence = ["meridian", "scout", "explorer"]',
  );
  assert.doesNotMatch(membershipLine, /analyst|admin/);
});
