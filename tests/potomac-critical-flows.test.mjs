import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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

test("tracked files contain no live-looking Resend API keys", () => {
    const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
        cwd: root,
        encoding: "utf8",
    })
        .split("\0")
        .filter(Boolean);

    for (const path of trackedFiles) {
        let content;
        try {
            content = read(path);
        } catch {
            continue;
        }

        assert.doesNotMatch(
            content,
            /\bre_[A-Za-z0-9_]{20,}\b/,
            `${path} must not contain a Resend API key`
        );
    }
});

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
    const memberPage = read("app/member/page.tsx");
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
        "createServerClient",
        "getSafeNextPath",
        "/member",
        "source",
        "redirectUrl",
        "response.cookies.set",
        "profileResponse.cookies.set",
        "loginResponse.cookies.set",
    ], "auth callback");
    assertIncludes(logoutRoute, ["signOut", "/auth/login"], "logout route");
    assert.match(
        memberPage,
        /href="\/auth\/logout"\s+prefetch=\{false\}/,
        "logout navigation must not prefetch a session-revoking GET"
    );
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

test("Nexus handoff maps approved Cabeus memberships without client role escalation", () => {
    const nexusAccess = read("lib/auth/nexus.ts");
    const handoffRoute = read("app/api/member/nexus/handoff/route.ts");
    const memberPage = read("app/member/page.tsx");
    const nexusPage = read("app/nexus/page.tsx");
    const nextConfig = read("next.config.mjs");
    const migration = readMigration(
        "20260717104836_sync_cabeus_members_to_nexus_roles.sql"
    );

    assertIncludes(nexusAccess, [
        "https://nexus-explore.potomacdb.com/0auth",
        'return "base_user"',
        'return "premium_user"',
        'return "superior_user"',
        "member_role_assignments",
        "entitlements",
        'storedRole === "admin"',
        "canOpenNexus",
    ], "Nexus membership resolver");
    assertIncludes(handoffRoute, [
        "getProfileGateContext",
        "loadNexusAccessStatus",
        "auth.admin.generateLink",
        'type: "magiclink"',
        "NEXUS_AUTH_URL",
        "POTOMAC_SUPABASE_URL",
        'actionUrl.pathname !== "/auth/v1/verify"',
        "private, no-store",
        "no-referrer",
    ], "Nexus one-time handoff");
    assertIncludes(memberPage + nexusPage, [
        "/api/member/nexus/handoff",
        "Open Nexus",
        "Nexus role",
    ], "Nexus member navigation");
    assertIncludes(nextConfig, [
        "/api/member/nexus/handoff",
        'value: "no-referrer"',
    ], "Nexus handoff response headers");
    assertIncludes(migration, [
        "private.resolve_nexus_profile_role",
        "private.sync_nexus_profile_role",
        "'base_user'::public.profile_role",
        "'premium_user'::public.profile_role",
        "'superior_user'::public.profile_role",
        "public.profiles.role <> 'admin'::public.profile_role",
        "sync_nexus_role_from_member_profile",
        "sync_nexus_role_from_assignment",
        "sync_nexus_role_from_entitlement",
        "revoke insert, update on public.profiles from anon, authenticated",
        "grant update (",
    ], "Nexus role synchronization migration");
    assert.doesNotMatch(
        handoffRoute,
        /searchParams\.set\([^\n]*(?:token|secret)|NEXT_PUBLIC_SUPABASE.*SECRET/i,
        "Nexus handoff must not append reusable credentials to its destination"
    );
});

test("production tracker ingestion is authenticated, scheduled, cited, and review-gated", () => {
    const ingestion = read("lib/trackers/production-ingestion.ts");
    const route = read("app/api/internal/trackers/ingest/route.ts");
    const migration = readMigration(
        "20260719143000_schedule_production_tracker_ingestion.sql"
    );
    const contractMigration = readMigration(
        "20260719183500_schedule_usaspending_contract_ingestion.sql"
    );
    assertIncludes(ingestion, [
        "ll.thespacedevs.com/2.3.0/launches/upcoming/",
        "services.swpc.noaa.gov/products",
        "api.usaspending.gov/api/v2/search/spending_by_award/",
        "weekly_lunar_ingestion_runs",
        "weekly_lunar_tracker_sources",
        'publication_status: "draft"',
        "source_checked_at",
        "freshness_status",
        "createServiceClient",
    ], "production tracker ingestion");
    assertIncludes(route, [
        "TRACKER_INGESTION_SECRET",
        "timingSafeEqual",
        'value === "launches"',
        'value === "space-weather"',
        'value === "contract-awards"',
        '"Cache-Control": "no-store"',
    ], "tracker ingestion endpoint");
    assertIncludes(migration, [
        "production_tracker_ingestion_url",
        "production_tracker_ingestion_secret",
        "ingest-launch-library-2",
        "ingest-noaa-space-weather",
        "private.invoke_production_tracker_ingestion",
    ], "tracker ingestion schedules");
    assertIncludes(contractMigration, [
        "ingest-usaspending-contract-awards",
        "contract-awards",
        "private.invoke_production_tracker_ingestion",
    ], "contract ingestion schedule");
    assert.doesNotMatch(
        ingestion + route + migration + contractMigration,
        /SUPABASE_SERVICE_ROLE_KEY\s*=|TRACKER_INGESTION_SECRET\s*=|Bearer [A-Za-z0-9_-]{20,}/,
        "tracker ingestion secrets must not be committed"
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
    const config = read("lib/supabase/config.ts");
    const files = [
        read(".mcp.json"),
        read("docs/codex-automation-memory.md"),
        config,
    ].join("\n");

    assert.match(files, /xlpkdoeldtlhearqajat/, "canonical project ref should be present");
    assert.doesNotMatch(
        config,
        /nwoluvjdojzayozyzlob/,
        "runtime config should not reference the wrong Supabase project"
    );
    assertIncludes(config, [
        "POTOMAC_SUPABASE_URL",
        "POTOMAC_SUPABASE_PUBLISHABLE_KEY",
        "process.env.NEXT_PUBLIC_SUPABASE_URL ?? POTOMAC_SUPABASE_URL",
    ], "browser-safe Supabase build defaults");
    assert.doesNotMatch(
        config,
        /Missing NEXT_PUBLIC_SUPABASE_URL/,
        "browser builds should not fail when Cloudflare injects public config at runtime"
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
    const applicationMigration = readMigration(
        "20260722110153_idempotent_membership_application_submission.sql"
    );

    assertIncludes(
        requestAccessPage + requestAccessClient + applicationForm + loginForm,
        [
            "Sign up",
            "Sign in",
            "Free membership selected",
            "Explorer",
            "signUp",
            "submit_membership_application",
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
    assertIncludes(applicationMigration, [
        "security invoker",
        "insert into public.membership_applications",
        "on conflict do nothing",
        "grant execute",
        "to anon, authenticated",
    ], "idempotent membership application submission");
    assert.doesNotMatch(
        applicationForm,
        /applicationError\.code\s*!==\s*["']23505["']/,
        "signup must not hide a failed duplicate request in the browser"
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
        /NEXT_PUBLIC_RESEND|\bre_[A-Za-z0-9_]{20,}\b/,
        "Resend credentials must not be public or committed"
    );
});

test("Resend Free quota governor reserves capacity before sending and exposes an admin queue", () => {
    const migration = readMigration("20260710184052_resend_free_quota_governor.sql");
    const rateMigration = readMigration("20260710184521_resend_rate_window_enforcement.sql");
    const adminMigration = readMigration("20260710184638_admin_resend_email_operations_rpc.sql");
    const quota = read("lib/email/resend-quota.ts");
    const transport = read("lib/email/resend.ts");
    const responseClassifier = read("lib/email/resend-response.ts");
    const action = read("app/command/actions.ts");
    const adminPage = read("app/admin/email/page.tsx");
    const environment = read(".env.example");

    assertIncludes(migration + rateMigration + adminMigration + quota + transport + responseClassifier + action + adminPage + environment, [
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
    const upgradeAnalytics = read("app/upgrade/UpgradeAnalytics.tsx");
    const checkout = read("app/member/ScoutCheckoutButton.tsx");
    const checkoutRoute = read("app/api/stripe/scout-checkout/route.ts");
    const checkoutAnalytics = read("app/_components/CheckoutAnalytics.tsx");
    const meridianForm = read("app/command/CommandInterestForm.tsx");
    const premiumLinks = [read("app/page.tsx"), read("app/companies/page.tsx"), read("app/companies/[slug]/page.tsx"), read("app/news/[slug]/page.tsx")].join("\n");

    assertIncludes(upgrade + upgradeAnalytics + checkout + checkoutRoute + checkoutAnalytics + meridianForm, [
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
        "premium_click_source",
        "upgrade_impression",
        "scout_checkout_start",
        "scout_checkout_success",
        "scout_checkout_failure",
        "meridian_contract_discussion_start",
        "meridian_lead_submission",
        "meridian_email_sent",
        "meridian_email_failed",
        "meridian_email_queued",
        "return_to_content",
    ], "premium upgrade handoff");
    assertIncludes(premiumLinks, ["source=homepage", "source=companies", "source=company-profile", "source=article", "content=", "object=", "next="], "premium CTA context");
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

test("Pathfinder and Source CTA assets require review before private storage delivery", () => {
    const migration = readMigration("20260711050951_cta_asset_storage_pipeline.sql");
    const actions = read("app/admin/sponsors/actions.ts");
    const adminPage = read("app/admin/sponsors/page.tsx");
    const assetRoute = read("app/api/cta-assets/[id]/route.ts");
    const sponsorAds = read("app/_data/sponsorAds.ts");

    assertIncludes(migration, [
        "cta-assets",
        "public.cta_assets",
        "file_size_limit",
        "allowed_mime_types",
        "review_status",
        "expires_at",
        "alt_text",
        "attribution_note",
        "Public can read reviewed CTA image objects",
        "/hardware-pathfinder-05122026.png",
        "/hardware-source-10162025.png",
        "/Source Rendering.png",
    ], "CTA asset schema");
    assert.match(migration, /'cta-assets',\s*'cta-assets',\s*false/);
    assertIncludes(actions + adminPage, [
        "uploadCtaAsset",
        "validateCtaImageFile",
        "readImageDimensions",
        "updateCtaAssetReview",
        "selectCtaAsset",
        'review_status: "draft"',
        "multipart/form-data",
    ], "CTA asset administration");
    assertIncludes(assetRoute, [
        '.eq("review_status", "reviewed")',
        "expires_at",
        ".download(",
        "X-Content-Type-Options",
    ], "reviewed CTA asset delivery");
    assertIncludes(sponsorAds, [
        "/hardware-pathfinder-05122026.png",
        "/hardware-source-10162025.png",
    ], "reviewed CTA repository fallbacks");
});

test("strategic product inquiries persist and audit before quota-aware Resend delivery", () => {
    const migration = readMigration("20260711080954_strategic_product_inquiries.sql");
    const action = read("app/strategic-inquiry-actions.ts");
    const form = read("app/_components/StrategicInquiryForm.tsx");
    const pathfinder = read("app/pathfinder/inquire/page.tsx");
    const source = read("app/source/inquire/page.tsx");
    const sponsorAds = read("app/_data/sponsorAds.ts");
    const requestAccess = read("app/request-access/RequestAccessClient.tsx");

    assertIncludes(migration, [
        "public.strategic_product_inquiries",
        "private.strategic_inquiry_rate_limits",
        "review_status",
        "notification_status",
        "source_cta",
        "attribution",
        "communication_preference",
        "strategic_inquiry_id",
        "submit_strategic_product_inquiry",
        "claim_strategic_inquiry_delivery",
        "complete_strategic_inquiry_delivery",
        "private.claim_resend_free_quota",
        "info@potomacdb.com",
    ], "strategic inquiry persistence and delivery audit");
    assertIncludes(action + form, [
        "sendOperationalEmail",
        "hasValidResendFreePlanConfig",
        "product_follow_up_approved",
        "contact_name",
        "contact_email",
        "organization_name",
        "role_title",
        "product_interest",
        "message",
        "source_cta",
        "attribution",
        "delivery-pending",
        "/request-access",
    ], "strategic inquiry forms");
    assertIncludes(pathfinder, [
        "/hardware-pathfinder-05122026.png",
        "Find the landing site",
        'product="pathfinder"',
    ], "Pathfinder inquiry page");
    assertIncludes(source, [
        "/hardware-source-10162025.png",
        "Deliver data for building",
        'product="source"',
    ], "Source inquiry page");
    assertIncludes(sponsorAds, [
        "/request-access?source=udri-house-ad",
        "/request-access?source=udri-event-house-ad",
    ], "UDRI account handoff");
    assertIncludes(requestAccess, [
        'type AccessTab = "signup" | "signin"',
        'value === "signin" ? "signin" : "signup"',
        "Free membership selected",
        "any email domain",
    ], "Explorer signup default");
    assert.doesNotMatch(action + form, /mailto:|NEXT_PUBLIC_RESEND|RESEND_API_KEY/);
});

test("public sponsor and social surfaces use only approved CTA content", () => {
    const sponsorData = read("app/_data/sponsorAds.ts");
    const sponsorUnit = read("app/_components/SponsorUnit.tsx");
    const channels = read("app/_data/channels.ts");

    assertIncludes(sponsorData + sponsorUnit, [
        "https://i.ytimg.com/vi/WSLxeLhlth4/maxresdefault.jpg",
        'label: "House ad"',
        'ctaLabel: "Learn more"',
        "/request-access?source=udri-house-ad",
        "/request-access?source=udri-event-house-ad",
        "Find the landing site",
        "An impact-emplaced lunar sensor that survives hard landing independent of a lander and finds the best landing sites.",
        "/hardware-pathfinder-05122026.png",
        "/pathfinder/inquire?source=homepage-pathfinder-cta",
        "Deliver data for building",
        "A persistent lunar garage and rover designed for at least one year of operation to fully characterize the site in preparation for construction.",
        "/hardware-source-10162025.png",
        "/source/inquire?source=article-source-cta",
    ], "approved strategic CTA surfaces");
    assertIncludes(channels, [
        'id: "substack"',
        'id: "podcast"',
        'id: "linkedin"',
        "https://www.linkedin.com/company/cabeus-explorer",
        "NEXT_PUBLIC_SUBSTACK_URL",
        "NEXT_PUBLIC_PODCAST_URL",
        "verifiedChannelUrl",
    ], "approved external channels");
    assert.doesNotMatch(channels, /twitter|x\.com|launch pending|example\.com/i);
});

test("content readiness dashboard blocks unowned or incomplete production submissions", () => {
    const migration = readMigration("20260711140953_content_submission_readiness_dashboard.sql");
    const actions = read("app/admin/content/actions.ts");
    const page = read("app/admin/content/page.tsx");

    assertIncludes(migration, [
        "public.content_submissions",
        "public.content_submission_audit",
        "content-submissions",
        "homepage_slide",
        "carousel_visual",
        "tracker_row",
        "source_citation",
        "house_ad",
        "pathfinder_cta",
        "source_cta",
        "contract_award",
        "public_empty_state",
        "copy_owner_confirmed",
        "content_origin",
        "readiness_issues",
        "citation_required",
        "destination_required",
        "expiration_required",
        "reviewed_asset_required",
        "editor approval is required before publication",
    ], "content readiness schema");
    assert.doesNotMatch(migration, /codex|automation_authored/);
    assertIncludes(actions + page, [
        "createContentSubmission",
        "approveContentSubmission",
        "rejectContentSubmission",
        "publishContentSubmission",
        "validateCtaImageFile",
        "readImageDimensions",
        "copy_owner_confirmed",
        "CEO provided",
        "Editor authored",
        "Submit for review",
        "Deployment ready",
    ], "content readiness administration");
    assertIncludes(actions, [
        'contentType === "tracker_row" ? 7',
        '["homepage_slide", "carousel_visual"].includes(contentType) ? 14',
        ": 30",
    ], "default expiration windows");
});

test("promotional content expires across publishing, loaders, and scheduled maintenance", () => {
    const migration = readMigration("20260711171028_promotional_content_auto_expiration.sql");
    const sponsorData = read("app/_data/sponsorAds.ts");
    const contentLoader = read("app/_data/contentSubmissions.ts");
    const contentRoute = read("app/api/content-assets/[id]/route.ts");
    const ctaActions = read("app/admin/sponsors/actions.ts");
    const releaseCheck = read("scripts/check-promotional-expiration.mjs");

    assertIncludes(migration, [
        "pg_cron",
        "expiration_exception_reason",
        "expiration_exception_approved_by",
        "expiration_window_exceeded",
        "when new.content_type = 'tracker_row' then 7",
        "when new.content_type in ('homepage_slide', 'carousel_visual') then 14",
        "else 30",
        "private.promotional_expiration_audit",
        "private.expire_promotional_content",
        "expire-promotional-content-daily",
        "status = 'expired'",
        "review_status = 'archived'",
        "Public reads active published content submissions",
        "Public reads active published content assets",
    ], "promotional expiration enforcement");
    assertIncludes(sponsorData + contentLoader + contentRoute + ctaActions, [
        "fallbackPromotionalContentReviewedAt",
        "expiresAt",
        "activeFallbackUnit",
        '.gt("expires_at", timestamp)',
        '.gt("expires_at", now)',
        "Reviewed CTA assets require an expiration date.",
    ], "application expiration enforcement");
    assertIncludes(releaseCheck, [
        "All four reviewed strategic fallback units require expiration",
        "Promotional fallback expired",
        "exceeds the 30-day window",
        "must suppress expired content",
    ], "promotional release gate");
});

test("homepage carousel inventory is audited, gated, ranked, and auto-filled from CMS", () => {
    const migration = readMigration("20260711201025_homepage_carousel_inventory.sql");
    const loader = read("app/_data/homepageCarousel.ts");
    const actions = read("app/admin/carousel/actions.ts");
    const page = read("app/admin/carousel/page.tsx");

    assertIncludes(migration, [
        "public.homepage_carousel_slides",
        "public.homepage_carousel_audit",
        "anonymous_teaser",
        "signed_in_editorial_story",
        "custom_intelligence_card",
        "paid_tier_teaser",
        "auto_latest",
        "is_pinned",
        "display_rank",
        "is_required",
        "content_visibility",
        "audience_mode",
        "minimum_tier",
        "visual_asset_url",
        "visual_asset_alt",
        "Read the brief",
        "citation_url",
        "source_note",
        "freshness_at",
        "expires_at",
        "homepage carousel supports no more than five active slides",
        "private.has_verified_complete_profile",
        "Verified complete members read member carousel",
        "carousel_slide",
    ], "carousel schema and access controls");
    assertIncludes(loader, [
        "loadHomepageCarousel",
        "CarouselAudience",
        "profile_incomplete",
        "loadCarouselViewer",
        '.eq("content_visibility", "public_teaser")',
        '.eq("status", "published")',
        '.gt("expires_at", now)',
        'id: `auto:${String(article.id)}`',
        "Latest published CMS story auto-selection.",
        'ctaLabel: "Read the brief"',
        ".slice(0, 5)",
    ], "carousel selection contract");
    assertIncludes(actions + page, [
        "createCarouselSlide",
        "previewCarouselSlide",
        "publishCarouselSlide",
        "unpublishCarouselSlide",
        "expireCarouselSlide",
        "reorderCarouselSlide",
        "3-5 active",
        "Auto latest CMS story",
        "Required slide",
        "/api/content-assets/",
    ], "carousel staff controls");
});

test("homepage carousel UI rotates accessibly with a stable static fallback", () => {
    const component = read("app/_components/HomepageCarousel.tsx");
    const homepage = read("app/page.tsx");

    assertIncludes(component, [
        'const rotationMs = 8_000',
        'aria-roledescription="carousel"',
        'aria-roledescription="slide"',
        'aria-label="Top lunar intelligence stories"',
        'role="tablist"',
        'aria-selected={index === activeIndex}',
        'event.key === "ArrowLeft"',
        'event.key === "ArrowRight"',
        'event.key === " "',
        "prefers-reduced-motion: reduce",
        "onMouseEnter",
        "onFocusCapture",
        "Pause rotation",
        "Resume rotation",
        "Previous story",
        "Next story",
        'sizes="100vw"',
        'loading={index === 0 ? "eager" : "lazy"}',
        "motion-reduce:transition-none",
        "min-h-[500px]",
    ], "accessible rotating carousel");
    assertIncludes(homepage, [
        "loadHomepageCarousel",
        "getProfileGateContext",
        'id: "homepage-static-fallback"',
        'ctaLabel: "Read the brief"',
        "<HomepageCarousel slides={carouselSlides} />",
        'aria-label="Lunar economy activity"',
    ], "homepage carousel integration");
    assert.doesNotMatch(homepage, /Brand system active/);
});
