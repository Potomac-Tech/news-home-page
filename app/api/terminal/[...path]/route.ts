import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getTerminalViewerContext } from "../../../../lib/auth/terminal";
import { signTerminalAssertion } from "../../../../lib/terminal/assertion";
import { proxyTerminalBindingRequest } from "../../../../lib/terminal/binding-proxy";
import type { TerminalAssertionClaims } from "../../../../lib/terminal/host-contract";

type TerminalCloudflareEnvironment = CloudflareEnv & {
  CABEUS_TERMINAL_API?: {
    fetch(request: Request): Promise<Response>;
  };
  CABEUS_TERMINAL_ASSERTION_PRIVATE_JWK?: string;
};

function terminalError(code: string, status: number, correlationId: string) {
  return Response.json(
    { error: { code } },
    {
      headers: {
        "cache-control": "private, no-store",
        "x-correlation-id": correlationId,
      },
      status,
    },
  );
}

async function handleTerminalProxy(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const correlationId = crypto.randomUUID();
  const { path } = await params;
  const viewer = await getTerminalViewerContext(`/terminal/${path.join("/")}`);

  if (viewer.state !== "ready") {
    const code =
      viewer.state === "anonymous"
        ? "terminal_auth_required"
        : viewer.state === "email_unverified"
          ? "terminal_email_verification_required"
          : viewer.state === "profile_incomplete"
            ? "terminal_profile_required"
            : "terminal_membership_required";
    return terminalError(
      code,
      viewer.state === "anonymous" ? 401 : 403,
      correlationId,
    );
  }
  if (!viewer.sessionId) {
    return terminalError("terminal_auth_required", 401, correlationId);
  }

  const { env } = await getCloudflareContext({ async: true });
  const terminalEnv = env as TerminalCloudflareEnvironment;
  if (
    !terminalEnv.CABEUS_TERMINAL_API ||
    !terminalEnv.CABEUS_TERMINAL_ASSERTION_PRIVATE_JWK
  ) {
    return terminalError("terminal_service_unavailable", 503, correlationId);
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const claims: TerminalAssertionClaims = {
    iss: "cabeus-explorer",
    aud: "cabeus-terminal-api",
    sub: viewer.userId,
    sid: viewer.sessionId,
    iat: issuedAt,
    exp: issuedAt + 60,
    jti: crypto.randomUUID(),
    contract_version: "2026-07-27.v1",
    membership: viewer.membership,
    organizations: [],
  };

  try {
    const assertion = await signTerminalAssertion(
      claims,
      terminalEnv.CABEUS_TERMINAL_ASSERTION_PRIVATE_JWK,
    );
    return await proxyTerminalBindingRequest({
      assertion,
      binding: terminalEnv.CABEUS_TERMINAL_API,
      correlationId,
      path,
      request,
    });
  } catch {
    return terminalError("terminal_service_unavailable", 503, correlationId);
  }
}

export const GET = handleTerminalProxy;
export const POST = handleTerminalProxy;
export const PUT = handleTerminalProxy;
export const PATCH = handleTerminalProxy;
export const DELETE = handleTerminalProxy;
