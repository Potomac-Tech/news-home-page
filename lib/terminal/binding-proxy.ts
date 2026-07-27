import {
  TERMINAL_ASSERTION_HEADER,
  TERMINAL_CORRELATION_ID_HEADER,
} from "./host-contract";

export type TerminalServiceBinding = {
  fetch(request: Request): Promise<Response>;
};

const forwardedRequestHeaders = [
  "accept",
  "content-type",
  "if-none-match",
] as const;

export async function proxyTerminalBindingRequest({
  assertion,
  binding,
  correlationId,
  path,
  request,
}: {
  assertion: string;
  binding: TerminalServiceBinding;
  correlationId: string;
  path: readonly string[];
  request: Request;
}): Promise<Response> {
  const inboundUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `/api/v1/${path.map(encodeURIComponent).join("/")}`,
    "https://cabeus-terminal-api.invalid",
  );
  upstreamUrl.search = inboundUrl.search;

  const headers = new Headers();
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set(TERMINAL_ASSERTION_HEADER, assertion);
  headers.set(TERMINAL_CORRELATION_ID_HEADER, correlationId);

  const upstream = await binding.fetch(
    new Request(upstreamUrl, {
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      headers,
      method: request.method,
      redirect: "manual",
    }),
  );
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("cache-control", "private, no-store");
  responseHeaders.set(TERMINAL_CORRELATION_ID_HEADER, correlationId);
  responseHeaders.delete("set-cookie");

  return new Response(upstream.body, {
    headers: responseHeaders,
    status: upstream.status,
    statusText: upstream.statusText,
  });
}
