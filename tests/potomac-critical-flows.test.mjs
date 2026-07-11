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
    const requestAccessPage = read("app/request-access/page.tsx");
    const requestAccessClient = read("app/request-access/RequestAccessClient.tsx");
    const callbackRoute = read("app/auth/callback/route.ts");
    const logoutRoute = read("app/auth/logout/route.ts");
    const middleware = read("middleware.ts");

    assertIncludes(loginPage + loginForm + requestAccessPage + requestAccessClient, [
        "signInWithOtp",
        "emailRedirectTo",
        "Sign up",
        "Sign in",
        "Explorer",
        'tab: "signin"',
    ], "login flow");
    assertIncludes(callbackRoute, [
        "exchangeCodeForSession",
        "getSafeNextPath",
        "/member",
        "source",
        "redirectUrl",
    ], "auth callback");
    assertIncludes(logoutRoute, ["signOut", "/auth/login"], "logout route");
    assertIncludes(middleware, ["updateSession", "matcher"], "session middleware");
});

test("article gating and RBAC helpers use normalized role assignments", () => {
    const articleAccess = read("lib/auth/article-access.ts");
    const adminAccess = read("lib/auth/admin.ts");
    const orgAdminAccess = read("lib/auth/org-admin.ts");

    assertIncludes(articleAccess, [
        "getProfileGateContext",
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

test("request access keeps Explorer signup, recovery, and return context in one gateway", () => {
    const requestAccessPage = read("app/request-access/page.tsx");
    const requestAccessClient = read("app/request-access/RequestAccessClient.tsx");
    const applicationForm = read("app/apply/ApplicationForm.tsx");
    const loginForm = read("app/auth/login/LoginForm.tsx");
    const legacyApply = read("app/apply/page.tsx");
    const legacyLogin = read("app/auth/login/page.tsx");

    assertIncludes(
        requestAccessPage + requestAccessClient + applicationForm + loginForm,
        [
            "Sign up",
            "Sign in",
            "Free membership selected",
            "Explorer",
            "signUp",
            "membership_applications",
            "signUpData.session",
            "emailRedirectTo",
            "resetPasswordForEmail",
            "updateUser",
            '"source", "campaign", "content", "tier"',
            "upgrade?tier=",
        ],
        "request access gateway"
    );
    assertIncludes(
        legacyApply + legacyLogin,
        ["redirect(\"/request-access\")", "tab: \"signin\""],
        "legacy access routes"
    );
});

test("profile completion uses normalized member-owned data and gates the workspace", () => {
    const migration = readMigration("20260710053251_profile_completion_gate.sql");
    const profileGate = read("lib/auth/profile-completion.ts");
    const profilePage = read("app/account/profile/complete/page.tsx");
    const profileForm = read("app/account/profile/complete/ProfileCompletionForm.tsx");
    const verificationPage = read("app/account/verify/page.tsx");
    const memberPage = read("app/member/page.tsx");
    const protectedHelpers = [
        "lib/auth/article-access.ts",
        "lib/auth/event-access.ts",
        "lib/auth/member-chat.ts",
        "lib/auth/member-forum.ts",
        "lib/auth/rfq.ts",
        "lib/auth/saved-work.ts",
        "lib/auth/member-alerts.ts",
        "lib/auth/data-marketplace.ts",
        "lib/auth/test-data.ts",
        "lib/auth/developer-platform.ts",
        "lib/auth/economy.ts",
        "lib/auth/lunar-missions.ts",
        "lib/auth/lunar-market-intel.ts",
        "lib/auth/admin.ts",
        "lib/auth/org-admin.ts",
        "lib/auth/company-universe.ts",
        "lib/auth/editorial.ts",
        "lib/auth/data-sources.ts",
        "lib/auth/events.ts",
        "lib/auth/sponsors.ts",
        "app/api/stripe/scout-checkout/route.ts",
    ].map(read).join("\n");

    assertIncludes(
        migration + profileGate + profilePage + profileForm + verificationPage + memberPage,
        [
            "member_profile_completions",
            "enable row level security",
            "member_profile_completions_update_own",
            "full_name",
            "affiliation",
            "role_title",
            "country_code",
            "timezone",
            "primary_interest_areas",
            "communication_preference",
            "profile_incomplete",
            "/account/profile/complete",
            "upsert",
            "email_confirmed_at",
            "verificationRequiredHref",
            "Verification required",
            "Confirm your email to continue",
        ],
        "profile completion flow"
    );
    assert.doesNotMatch(
        profileGate + profileForm,
        /user_metadata|raw_user_meta_data/,
        "profile completion must not authorize from user-editable metadata"
    );
    assertIncludes(
        protectedHelpers,
        ["getProfileGateContext", "profile_incomplete", "email_unverified"],
        "protected access helpers"
    );
    assertIncludes(
        profileGate + verificationPage + read("app/auth/callback/route.ts"),
        ["email_unverified", "Check your inbox", "verificationRequiredHref", "/account/verify"],
        "email verification handoff"
    );
});

test("unverified and profile-incomplete users receive only public-safe search indexes", () => {
    const searchData = read("app/_data/search.ts");
    const searchPage = read("app/search/page.tsx");
    const shell = read("app/_components/MigrationShell.tsx");

    assertIncludes(
        searchData + searchPage + shell,
        [
            "publicOnly",
            'visibility_tier", "public"',
            'profileGate?.state !== "ready"',
            "getProfileGateContext",
        ],
        "public-safe search and command palette"
    );
});

test("the shared shell remains available when optional Supabase navigation data fails", () => {
    const shell = read("app/_components/MigrationShell.tsx");
    const layout = read("app/layout.tsx");

    assertIncludes(shell, [
        "fallbackCommandEntries",
        "try {",
        "catch {",
        "Navigation remains public and usable",
    ], "navigation fallback");
    assert.match(
        layout,
        /export const dynamic = "force-dynamic"/,
        "the session-aware shared layout must not be statically rendered"
    );
});

test("verification resend is rate-limited, audited, and does not persist raw email", () => {
    const migration = readMigration("20260710151437_email_verification_resend_controls.sql");
    const resendRoute = read("app/api/auth/resend-verification/route.ts");
    const resendButton = read("app/account/verify/VerificationResendButton.tsx");
    const verificationPage = read("app/account/verify/page.tsx");

    assertIncludes(
        migration + resendRoute + resendButton + verificationPage,
        [
            "email_verification_resend_rate_limits",
            "email_verification_resend_events",
            "email_hash",
            "enable row level security",
            "security definer",
            "claim_email_verification_resend",
            "complete_email_verification_resend",
            "auth.resend",
            'type: "signup"',
            "Retry-After",
            "Resend verification email",
            "Account email",
            "crypto.subtle.digest",
        ],
        "verification resend controls"
    );
    assert.doesNotMatch(
        migration,
        /email\s+(text|varchar)/i,
        "verification resend audit records must not store raw email"
    );
});

test("operational Resend email stays server-only, auditable, and safe on delivery failure", () => {
    const transport = read("lib/email/resend.ts");
    const action = read("app/command/actions.ts");
    const migration = readMigration("20260710181949_outbound_email_delivery_audit.sql");
    const environment = read(".env.example");

    assertIncludes(transport + action + migration + environment, [
        'import "server-only"',
        "RESEND_API_KEY",
        "RESEND_FROM_EMAIL",
        "info@potomacdb.com",
        "https://api.resend.com/emails",
        "reply_to",
        "outbound_email_delivery_events",
        "provider_message_id",
        "configuration_missing",
        "delivery-pending",
        "RESEND_MERIDIAN_TO_EMAIL",
    ], "operational Resend transport");
    assert.doesNotMatch(
        transport + action + environment,
        /NEXT_PUBLIC_RESEND|[REVOKED_RESEND_KEY_REMOVED]/,
        "Resend credentials must not be public or committed"
    );
});

test("Resend Free quota governor reserves capacity before sending and exposes an admin queue", () => {
    const migration = readMigration("20260710184052_resend_free_quota_governor.sql");
    const rateMigration = readMigration("20260710184521_resend_rate_window_enforcement.sql");
    const adminMigration = readMigration("20260710184638_admin_resend_email_operations_rpc.sql");
    const quota = read("lib/email/resend-quota.ts");
    const transport = read("lib/email/resend.ts");
    const action = read("app/command/actions.ts");
    const adminPage = read("app/admin/email/page.tsx");
    const environment = read(".env.example");

    assertIncludes(migration + rateMigration + adminMigration + quota + transport + action + adminPage + environment, [
        "daily_soft_cap integer not null default 90",
        "monthly_soft_cap integer not null default 2700",
        "daily_hard_cap integer not null default 100",
        "monthly_hard_cap integer not null default 3000",
        "operational_daily_reserve integer not null default 10",
        "operational_monthly_reserve integer not null default 300",
        "max_sends_per_second integer not null default 8",
        "inbound_receiving_enabled boolean not null default false",
        "sending_domain_count integer not null default 1",
        "claim_resend_free_quota",
        "claim_resend_send_rate",
        "resend_send_rate_windows",
        "complete_resend_free_quota",
        "pg_advisory_xact_lock",
        "idempotency_key",
        "provider_headers",
        "x-resend-daily-quota",
        "daily_quota_exceeded",
        "rate_limit_exceeded",
        "delivery-pending",
        "Resend Free email queue",
        "get_resend_email_operations",
        "admin access is required",
        "RESEND_PLAN=free",
        "RESEND_INBOUND_RECEIVING=disabled",
    ], "Resend Free quota governance");
    assert.doesNotMatch(
        quota + environment,
        /pay[-_ ]?as[-_ ]?you[-_ ]?go|NEXT_PUBLIC_RESEND/i,
        "quota configuration must not add paid or public Resend controls"
    );
});

test("Meridian inquiry requires a completed member and retains the contract-only path", () => {
    const workflow = readMigration("20260710185238_meridian_authenticated_inquiry_workflow.sql");
    const override = readMigration("20260710185543_meridian_domain_rule_admin_override.sql");
    const page = read("app/command/page.tsx");
    const form = read("app/command/CommandInterestForm.tsx");
    const action = read("app/command/actions.ts");
    const meridianSurfaces = [read("app/command/page.tsx"), read("app/command/CommandInterestForm.tsx")].join("\n");

    assertIncludes(workflow + override + page + form + action, [
        "member_profile_completions",
        "email_confirmed_at is not null",
        "meridian_email_domain_rules",
        "meridian_email_validation_audit",
        "googlemail.com",
        "fastmail.com",
        "hey.com",
        "set_meridian_email_domain_rule",
        "app_private.has_role('admin')",
        "requested_product_label",
        "verified_auth_email",
        "source_cta",
        "return_url",
        "communication_preference",
        "create_meridian_delivery_event",
        "claim_meridian_delivery_quota",
        "complete_meridian_delivery",
        "getProfileGateContext",
        "contract_discussion_contact_approved",
    ], "Meridian inquiry workflow");
    assert.doesNotMatch(
        meridianSurfaces,
        /mailto:|checkout|invoice|payment-provider/i,
        "Meridian public surfaces must not expose payment or mailto workflows"
    );
});

test("upgrade handoff preserves premium context and separates Scout checkout from Meridian", () => {
    const upgrade = read("app/upgrade/page.tsx");
    const checkout = read("app/member/ScoutCheckoutButton.tsx");
    const checkoutRoute = read("app/api/stripe/scout-checkout/route.ts");

    assertIncludes(upgrade + checkout + checkoutRoute, [
        "tier?: string",
        "source?: string",
        "content?: string",
        "object?: string",
        "campaign?: string",
        "getProfileGateContext",
        "email_unverified",
        "profile_incomplete",
        "ScoutCheckoutButton",
        "commandHref",
        "tier=meridian",
        "command_user",
        "return_url",
        "success_url",
    ], "premium upgrade handoff");
    assert.doesNotMatch(
        upgrade,
        /mailto:|invoice|payment-provider/i,
        "Meridian handoff must not expose mailto or payment-provider placeholders"
    );
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
