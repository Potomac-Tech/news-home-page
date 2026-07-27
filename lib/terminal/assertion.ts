import {
  TERMINAL_ASSERTION_HEADER,
  TERMINAL_HOST_CONTRACT_VERSION,
  type TerminalAssertionClaims,
} from "./host-contract";

const textEncoder = new TextEncoder();

function encodeBase64Url(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function encodeJson(value: unknown): string {
  return encodeBase64Url(textEncoder.encode(JSON.stringify(value)));
}

export async function signTerminalAssertion(
  claims: TerminalAssertionClaims,
  privateJwk: string,
): Promise<string> {
  if (claims.contract_version !== TERMINAL_HOST_CONTRACT_VERSION) {
    throw new TypeError("Unsupported Terminal host contract.");
  }

  const protectedHeader = encodeJson({
    alg: "ES256",
    typ: "JWT",
    kid: "explorer-terminal-v1",
  });
  const encodedClaims = encodeJson(claims);
  const signingInput = `${protectedHeader}.${encodedClaims}`;
  const key = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(privateJwk) as JsonWebKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    textEncoder.encode(signingInput),
  );
  return `${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export const terminalAssertionHeader = TERMINAL_ASSERTION_HEADER;
