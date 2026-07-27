export const TERMINAL_HOST_CONTRACT_VERSION = "2026-07-27.v1" as const;
export const TERMINAL_SERVICE_BINDING = "CABEUS_TERMINAL_API" as const;
export const TERMINAL_ASSERTION_HEADER =
    "X-Cabeus-Terminal-Assertion" as const;
export const TERMINAL_CORRELATION_ID_HEADER = "X-Correlation-ID" as const;
export const TERMINAL_ASSERTION_MAXIMUM_TTL_SECONDS = 60 as const;

export const TERMINAL_MEMBERSHIP_TIERS = [
    "explorer",
    "scout",
    "meridian",
] as const;

export const TERMINAL_ORGANIZATION_ROLES = ["member", "org_admin"] as const;

export const TERMINAL_ERROR_CODES = [
    "terminal_auth_required",
    "terminal_email_verification_required",
    "terminal_profile_required",
    "terminal_membership_required",
    "terminal_assertion_invalid",
    "terminal_contract_unsupported",
    "terminal_service_unavailable",
] as const;

export type TerminalMembershipTier =
    (typeof TERMINAL_MEMBERSHIP_TIERS)[number];
export type TerminalOrganizationRole =
    (typeof TERMINAL_ORGANIZATION_ROLES)[number];

export type TerminalOrganizationClaim = Readonly<{
    organization_id: string;
    role: TerminalOrganizationRole;
}>;

export type TerminalAssertionClaims = Readonly<{
    iss: "cabeus-explorer";
    aud: "cabeus-terminal-api";
    sub: string;
    sid: string;
    iat: number;
    exp: number;
    jti: string;
    contract_version: typeof TERMINAL_HOST_CONTRACT_VERSION;
    membership: TerminalMembershipTier;
    organizations: readonly TerminalOrganizationClaim[];
}>;

export const TERMINAL_RELEASE_OWNERSHIP = Object.freeze({
    explorer: Object.freeze([
        "terminal_mount",
        "host_adapter",
        "session_and_membership_resolution",
        "assertion_signing",
        "service_binding_configuration",
        "frontend_rollback",
    ]),
    terminal: Object.freeze([
        "assertion_validation",
        "api_authorization",
        "terminal_api",
        "backend_rollback",
    ]),
    joint: Object.freeze([
        "contract_compatibility",
        "staged_release",
        "cross_boundary_incidents",
    ]),
});
