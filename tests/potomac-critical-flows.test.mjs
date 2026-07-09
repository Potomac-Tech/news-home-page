import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);

function read(path) {
    return readFileSync(new URL(path, root), "utf8");
}

function readMigration(name) {
    return read(`supabase/migrations/${name}`);
}

function readAllMigrations() {
    const dir = new URL("supabase/migrations/", root);
    return readdirSync(dir)
        .filter(
            (file) =>
                file.endsWith(".sql") &&
                file !== "20260701201833_seed_local_test_users.sql"
        )
        .map((file) => readFileSync(new URL(file, dir), "utf8"))
        .join("\n\n");
}

function assertIncludes(haystack, needles, label) {
    for (const needle of needles) {
        assert.match(
            haystack,
            needle instanceof RegExp ? needle : new RegExp(escapeRegExp(needle)),
            `${label} should include ${needle.toString()}`
        );
    }
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("auth routes and proxy preserve Supabase login/session/logout behavior", () => {
    const loginPage = read("app/auth/login/page.tsx");
    const loginForm = read("app/auth/login/LoginForm.tsx");
    const callbackRoute = read("app/auth/callback/route.ts");
    const logoutRoute = read("app/auth/logout/route.ts");
    const middleware = read("middleware.ts");

    assertIncludes(loginPage + loginForm, [
        "Supabase Auth",
        "signInWithOtp",
        "emailRedirectTo",
    ], "login flow");
    assertIncludes(callbackRoute, [
        "exchangeCodeForSession",
        "getSafeNextPath",
        "/member",
    ], "auth callback");
    assertIncludes(logoutRoute, ["signOut", "/auth/login"], "logout route");
    assertIncludes(middleware, ["updateSession", "matcher"], "session middleware");
});

test("article gating and RBAC helpers use normalized role assignments", () => {
    const articleAccess = read("lib/auth/article-access.ts");
    const adminAccess = read("lib/auth/admin.ts");
    const orgAdminAccess = read("lib/auth/org-admin.ts");

    assertIncludes(articleAccess, [
        "getClaims",
        "member_role_assignments",
        "rolesByTier",
        "canReadFullStory",
        "signed_in_locked",
        "expires_at",
    ], "article access");
    assertIncludes(adminAccess + orgAdminAccess, [
        "member_role_assignments",
        "admin",
        "organization_members",
        "org_admin",
    ], "role restrictions");
    assert.doesNotMatch(
        articleAccess + adminAccess + orgAdminAccess,
        /user_metadata|raw_user_meta_data/,
        "authorization must not depend on user-editable metadata"
    );
});

test("Stripe billing webhook preserves Scout entitlement activation controls", () => {
    const webhook = read("app/api/stripe/webhook/route.ts");
    const checkout = read("app/api/stripe/scout-checkout/route.ts");
    const stripeServer = read("lib/stripe/server.ts");
    const migration = readMigration("20260623123101_stripe_webhook_events.sql");

    assertIncludes(checkout + stripeServer, [
        "STRIPE_SCOUT_PRICE_ID",
        "mode: \"subscription\"",
        "metadata",
        "tier: \"scout\"",
        "user_id",
    ], "Scout checkout");
    assertIncludes(webhook, [
        "constructEvent",
        "stripe-signature",
        "stripe_webhook_events",
        "23505",
        "grantScoutEntitlement",
        "entitlements",
        "member_role_assignments",
        "role_id: \"scout\"",
        "checkout.session.completed",
        "customer.subscription.deleted",
        "invoice.payment_failed",
    ], "Scout webhook");
    assertIncludes(migration, [
        "stripe_webhook_events",
        "event_id",
        "primary key",
        "enable row level security",
    ], "Stripe idempotency migration");
});

test("member chat, forums, and RFQs enforce member access and moderation contracts", () => {
    const chatAuth = read("lib/auth/member-chat.ts");
    const forumAuth = read("lib/auth/member-forum.ts");
    const rfqAuth = read("lib/auth/rfq.ts");
    const chatMigration = readMigration("20260630080656_member_chat_schema.sql");
    const forumMigration = readMigration("20260630131146_member_forum_schema.sql");
    const rfqMigration = readMigration("20260630180219_rfq_schema_rls_moderation.sql");

    assertIncludes(chatAuth, [
        "member_role_assignments",
        "member",
        "scout",
        "command_user",
        "Approved member chat access is required.",
    ], "member chat auth");
    assertIncludes(forumAuth, [
        "forumModeratorRoles",
        "canModerateMemberForums",
        "moderator",
        "Approved member forum access is required.",
    ], "member forum auth");
    assertIncludes(rfqAuth, [
        "rfqMemberRoles",
        "scout",
        "command_user",
        "canModerateRfqs",
        "Scout or Command RFQ access is required.",
    ], "RFQ auth");
    assertIncludes(chatMigration + forumMigration + rfqMigration, [
        "enable row level security",
        "member_chat_blocks",
        "member_chat_reports",
        "forum_reports",
        "rfq_reports",
        "moderation",
    ], "community RLS and moderation schema");
});

test("lunar terminal modules keep Explorer, Scout, Command, and staff gates", () => {
    const lunarAccess = read("lib/auth/lunar-market-intel.ts");
    const missionsAccess = read("lib/auth/lunar-missions.ts");
    const companiesPage = read("app/companies/page.tsx");
    const procurementPage = read("app/procurement/page.tsx");
    const regulatoryPage = read("app/regulatory/page.tsx");

    assertIncludes(lunarAccess, [
        "canReadMemberDetails",
        "canReadScoutDetails",
        "canReadCommandDetails",
        "command_user",
        "scout",
        "member",
    ], "lunar market access");
    assertIncludes(missionsAccess, [
        "member_role_assignments",
        "canReadMemberDetails",
        "canReadScoutDetails",
    ], "lunar mission access");
    assertIncludes(companiesPage + procurementPage + regulatoryPage, [
        "Unlock",
        "source",
        "freshness",
    ], "lunar module gated UI");
});

test("paid exports, API access, webhooks, and quota controls stay tier-aware", () => {
    const developerAuth = read("lib/auth/developer-platform.ts");
    const developerPage = read("app/member/developer/page.tsx");
    const explorer = read("app/_components/IntelligenceDataExplorer.tsx");
    const migration = readMigration("20260702161000_scout_command_developer_platform.sql");

    assertIncludes(developerAuth, [
        "canUseDeveloperPlatform",
        "canUseWebhooks",
        "command_user",
        "scout",
        "staff",
    ], "developer access");
    assertIncludes(developerPage + migration, [
        "api_keys",
        "usage_logs",
        "webhook_subscriptions",
        "webhook_deliveries",
        "export_jobs",
        "developer_tier_limits",
    ], "developer platform");
    assertIncludes(explorer, [
        "canExportCsv",
        "canExportPdf",
        "downloadCsv",
        "print",
    ], "export framework");
});

test("RLS migrations cover protected critical tables and avoid user-editable metadata auth", () => {
    const migrations = readAllMigrations();
    const protectedTables = [
        "member_profiles",
        "editorial_article_bodies",
        "entitlements",
        "member_chat_conversations",
        "member_forum_posts",
        "rfq_responses",
        "lunar_missions",
        "developer_api_keys",
    ];

    for (const table of protectedTables) {
        assert.match(
            migrations,
            new RegExp(`alter table public\\.${table}\\s+enable row level security`, "i"),
            `${table} should enable RLS`
        );
        assert.match(
            migrations,
            new RegExp(`create policy[\\s\\S]+?on public\\.${table}`, "i"),
            `${table} should define at least one RLS policy`
        );
    }

    assertIncludes(migrations, [
        "private.has_role",
        "private.has_any_role",
        "private.is_org_admin",
        "auth.uid()",
    ], "RLS helpers");
    assert.doesNotMatch(
        migrations,
        /raw_user_meta_data|user_metadata/,
        "RLS must not authorize from user-editable metadata"
    );
});

test("workspace remains pinned to the canonical Potomac Supabase project", () => {
    const files = [
        read(".mcp.json"),
        read("docs/codex-automation-memory.md"),
        read("lib/supabase/config.ts"),
    ].join("\n");

    assert.match(files, /xlpkdoeldtlhearqajat/, "canonical project ref should be present");
    assert.doesNotMatch(
        read("lib/supabase/config.ts"),
        /nwoluvjdojzayozyzlob/,
        "runtime config should not reference the wrong Supabase project"
    );
});

test("member workspace degrades safely when Supabase public configuration is absent", () => {
    const memberPage = read("app/member/page.tsx");

    assertIncludes(memberPage, [
        "hasPotomacSupabasePublicConfig",
        "function ConfigGate",
        "Member sign-in is being configured",
        "if (!hasPotomacSupabasePublicConfig())",
        "return <ConfigGate />",
    ], "member workspace configuration gate");
});

test("the enterprise display label is configurable without changing internal Command access", () => {
    const tierConfig = read("app/_data/tiers.ts");
    const publicTierSurfaces = [
        read("app/page.tsx"),
        read("app/_data/homepage.ts"),
        read("app/pricing/page.tsx"),
        read("app/upgrade/page.tsx"),
        read("app/command/page.tsx"),
        read("app/account/page.tsx"),
        read("app/events/page.tsx"),
        read("app/news/[slug]/page.tsx"),
        read("app/companies/page.tsx"),
        read("app/member/page.tsx"),
        read("app/_components/SearchCommandPalette.tsx"),
        read("app/_data/search.ts"),
    ].join("\n");

    assertIncludes(tierConfig, [
        'enterprisePublicNames = ["Meridian", "Command"]',
        'enterprisePublicName: EnterprisePublicName = "Meridian"',
        'internalName: "Command"',
        "publicTierName",
        'tier === "command_user"',
    ], "enterprise tier configuration");
    assert.doesNotMatch(
        tierConfig,
        /enterprisePublicNames\s*=\s*\[[^\]]{0,120},[^\]]{0,120},[^\]]{0,120}\]/,
        "enterprise tier configuration must not introduce a fourth tier"
    );
    assertIncludes(publicTierSurfaces, [
        "tierConfig.enterprise.publicName",
        "publicTierName",
    ], "public tier surfaces");
    assert.doesNotMatch(
        publicTierSurfaces,
        /return "Meridian"|>Meridian|Meridian access|Meridian users|Meridian paths|Command access|Command detail|Command users|Command attendees/,
        "public tier surfaces must use the configured enterprise display name"
    );
});
