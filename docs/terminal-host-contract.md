# Cabeus Terminal host contract

- Approved contract: `2026-07-27.v1`.
- Normative record: `config/explorer-terminal-host-contract-v1.json`.
- Explorer owns `/terminal` and proxies `/api/terminal/*` to Terminal
  `/api/v1/*` through private binding `CABEUS_TERMINAL_API`.
- Explorer mints a maximum-60-second ES256 compact JWS in
  `X-Cabeus-Terminal-Assertion`.
- Required claims are `iss`, `aud`, `sub`, `sid`, `iat`, `exp`, `jti`,
  `contract_version`, `membership`, and `organizations`.
- Membership is resolved server-side with precedence `meridian`, `scout`,
  `explorer`; staff roles do not elevate commercial membership and `analyst`
  capabilities remain deferred.
- Organization claims contain at most 50 active `organization_members` rows
  with only `organization_id` and `member` or `org_admin`.
- Email, display name, user metadata, credentials, and member content are not
  assertion claims.
- Browser-supplied assertion, membership, organization, and correlation
  headers must be discarded before the proxy creates its own values.
- Explorer owns assertion signing, binding configuration, member-facing
  errors, and frontend rollback.
- Terminal owns assertion validation, authorization, API behavior, and backend
  rollback.
- Compatibility, staged release, and cross-boundary incidents are joint.
- Terminal consumer support deploys before Explorer produces the version;
  Explorer rolls back first.
- CT-083 implements the Service Binding and proxy. CT-084 implements assertion
  production and Terminal validation. This contract does not authorize a
  production deployment.
