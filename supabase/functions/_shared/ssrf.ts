import https from "node:https";

export const MAX_ENDPOINT_LENGTH = 2048;
export const MAX_CUSTOM_HEADER_LENGTH = 1024;
export const MAX_CUSTOM_BODY_BYTES = 128 * 1024;
export const MAX_DNS_ADDRESSES = 16;
export const CUSTOM_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type CustomMethod = (typeof CUSTOM_METHODS)[number];

const DNS_TIMEOUT_MS = 3000;
const CUSTOM_REQUEST_TIMEOUT_MS = 8000;
const MAX_RESPONSE_HEADER_BYTES = 32 * 1024;

const FORBIDDEN_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
]);

const FORBIDDEN_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
];

const FORBIDDEN_REQUEST_HEADERS = new Set([
  "connection",
  "content-length",
  // The handler sets Content-Type itself when a custom request body is sent.
  // Without this entry a caller could name Content-Type as their auth header,
  // have it pass validation, and then watch it silently overwritten, which
  // would report a valid key against a server that never received it.
  "content-type",
  "cookie",
  "expect",
  "forwarded",
  "host",
  "keep-alive",
  "origin",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "referer",
  "sec-websocket-key",
  "sec-websocket-protocol",
  "sec-websocket-version",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
  "x-forwarded-server",
  "x-http-method-override",
  "x-method-override",
  "x-original-host",
  "x-original-url",
  "x-real-ip",
  "x-rewrite-url",
  "__proto__",
  "constructor",
  "prototype",
]);

const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
// deno-lint-ignore no-control-regex
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;
const PROJECT_REF_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export type ValidatedCustomEndpoint = {
  url: URL;
  hostname: string;
};

export type DnsResolver = (
  hostname: string,
  recordType: "A" | "AAAA",
  signal: AbortSignal,
) => Promise<string[]>;

export class EndpointValidationError extends Error {
  readonly code:
    | "INVALID_ENDPOINT"
    | "ENDPOINT_BLOCKED"
    | "DNS_RESOLUTION_FAILED"
    | "ENDPOINT_TIMEOUT"
    | "NETWORK_ERROR";

  constructor(
    code: EndpointValidationError["code"],
    message: string,
  ) {
    super(message);
    this.name = "EndpointValidationError";
    this.code = code;
  }
}

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

function parseIpv4(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  let address = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    address = address * 256 + octet;
  }
  return address;
}

function inIpv4Range(
  address: number,
  network: number,
  prefix: number,
): boolean {
  const hostBits = 32 - prefix;
  const divisor = 2 ** hostBits;
  return Math.floor(address / divisor) === Math.floor(network / divisor);
}

function isPublicIpv4(value: string): boolean {
  const address = parseIpv4(value);
  if (address === null) return false;

  const blockedRanges: readonly [string, number][] = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ];

  return !blockedRanges.some(([network, prefix]) => {
    const parsedNetwork = parseIpv4(network);
    return parsedNetwork !== null &&
      inIpv4Range(address, parsedNetwork, prefix);
  });
}

function parseIpv6(value: string): number[] | null {
  if (!value || value.includes("%")) return null;

  let normalized = value;
  const lastColon = normalized.lastIndexOf(":");
  const lastDot = normalized.lastIndexOf(".");
  if (lastDot > lastColon) {
    const ipv4 = normalized.slice(lastColon + 1);
    const octets = ipv4.split(".");
    if (octets.length !== 4) return null;
    const numbers = octets.map(Number);
    if (
      numbers.some((octet) =>
        !Number.isInteger(octet) || octet < 0 || octet > 255
      )
    ) {
      return null;
    }
    const high = (numbers[0] * 256 + numbers[1]).toString(16);
    const low = (numbers[2] * 256 + numbers[3]).toString(16);
    normalized = `${normalized.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const halves = normalized.split("::");
  if (halves.length > 2) return null;

  const parseHalf = (half: string): number[] | null => {
    if (!half) return [];
    const groups = half.split(":");
    const bytes: number[] = [];
    for (const group of groups) {
      if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
      const number = Number.parseInt(group, 16);
      bytes.push(number >>> 8, number & 0xff);
    }
    return bytes;
  };

  const left = parseHalf(halves[0] ?? "");
  const right = parseHalf(halves[1] ?? "");
  if (!left || !right) return null;

  if (halves.length === 1) return left.length === 16 ? left : null;

  const missing = 16 - left.length - right.length;
  if (missing < 1) return null;
  return [...left, ...new Array<number>(missing).fill(0), ...right];
}

function startsWithIpv6(
  bytes: readonly number[],
  prefix: string,
  bits: number,
): boolean {
  const network = parseIpv6(prefix);
  if (!network) return false;
  const fullBytes = Math.floor(bits / 8);
  for (let index = 0; index < fullBytes; index += 1) {
    if (bytes[index] !== network[index]) return false;
  }
  const remainingBits = bits % 8;
  if (remainingBits === 0) return true;
  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (bytes[fullBytes]! & mask) === (network[fullBytes]! & mask);
}

function isPublicIpv6(value: string): boolean {
  const bytes = parseIpv6(value);
  if (!bytes) return false;
  if ((bytes[0]! & 0xe0) !== 0x20) return false;

  const blockedPrefixes: readonly [string, number][] = [
    ["2001::", 32],
    ["2001:2::", 48],
    ["2001:10::", 28],
    ["2001:db8::", 32],
    ["2002::", 16],
    ["3fff::", 20],
  ];
  return !blockedPrefixes.some(([prefix, bits]) =>
    startsWithIpv6(bytes, prefix, bits)
  );
}

function isIpAddress(value: string): boolean {
  const address = stripIpv6Brackets(value.trim().toLowerCase());
  return address.includes(":")
    ? parseIpv6(address) !== null
    : parseIpv4(address) !== null;
}

export function isPublicIpAddress(value: string): boolean {
  const address = stripIpv6Brackets(value.trim().toLowerCase());
  return address.includes(":") ? isPublicIpv6(address) : isPublicIpv4(address);
}

function isForbiddenHostname(hostname: string): boolean {
  return (
    FORBIDDEN_HOSTNAMES.has(hostname) ||
    FORBIDDEN_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  );
}

export function validateCustomEndpointUrl(
  value: unknown,
): ValidatedCustomEndpoint {
  if (typeof value !== "string") {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom endpoint URL is required",
    );
  }

  const input = value.trim();
  if (!input || input.length > MAX_ENDPOINT_LENGTH) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom endpoint URL has an invalid length",
    );
  }
  if (CONTROL_CHARACTER_PATTERN.test(input) || input.includes("\\")) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom endpoint URL contains unsafe characters",
    );
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom endpoint URL is invalid",
    );
  }

  if (url.protocol !== "https:") {
    throw new EndpointValidationError(
      "ENDPOINT_BLOCKED",
      "Custom endpoint must use HTTPS",
    );
  }
  if (url.username || url.password) {
    throw new EndpointValidationError(
      "ENDPOINT_BLOCKED",
      "Custom endpoint URL credentials are not allowed",
    );
  }
  if (url.port && url.port !== "443") {
    throw new EndpointValidationError(
      "ENDPOINT_BLOCKED",
      "Custom endpoint must use port 443",
    );
  }
  if (url.hash) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom endpoint URL must not contain a fragment",
    );
  }

  const hostname = stripIpv6Brackets(url.hostname.toLowerCase());
  if (
    !hostname ||
    hostname.length > 253 ||
    hostname.endsWith(".") ||
    isForbiddenHostname(hostname) ||
    (isIpAddress(hostname) && !isPublicIpAddress(hostname))
  ) {
    throw new EndpointValidationError(
      "ENDPOINT_BLOCKED",
      "Custom endpoint must resolve only to public servers",
    );
  }

  url.hash = "";
  return { url, hostname };
}

export type CustomAuthHeader = {
  name: string;
  value: string;
};

export function buildCustomAuthHeader(
  template: unknown,
  apiKey: string,
): CustomAuthHeader {
  if (typeof template !== "string") {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom auth header is required",
    );
  }

  const input = template.trim();
  if (!input || input.length > MAX_CUSTOM_HEADER_LENGTH) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom auth header has an invalid length",
    );
  }

  const separator = input.indexOf(":");
  if (separator <= 0) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom auth header must use the format Name: value",
    );
  }

  const name = input.slice(0, separator).trim();
  const templateValue = input.slice(separator + 1).trim();
  if (!HEADER_NAME_PATTERN.test(name)) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom auth header name is invalid",
    );
  }
  const normalizedName = name.toLowerCase();
  if (
    FORBIDDEN_REQUEST_HEADERS.has(normalizedName) ||
    normalizedName.startsWith("sec-") ||
    normalizedName.startsWith("x-forwarded-")
  ) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom auth header name is not allowed",
    );
  }

  const placeholderMatches = templateValue.match(/YOUR_KEY/g)?.length ?? 0;
  if (placeholderMatches !== 1) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom auth header must contain YOUR_KEY exactly once",
    );
  }

  const value = templateValue.replace("YOUR_KEY", apiKey);
  if (
    !value ||
    value.length > MAX_CUSTOM_HEADER_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new EndpointValidationError(
      "INVALID_ENDPOINT",
      "Custom auth header value is invalid",
    );
  }

  return { name, value };
}

const defaultDnsResolver: DnsResolver = async (
  hostname,
  recordType,
  signal,
) => {
  return await Deno.resolveDns(hostname, recordType, { signal });
};

// True when a DNS lookup failed only because the host has no record of that
// family. Deno signals this with Deno.errors.NotFound, and the error name is
// checked as well so the helper keeps working if the rejection arrives as a
// plain DOMException from another runtime or from an injected test resolver.
function isDnsRecordAbsent(error: unknown): boolean {
  if (error instanceof Error && error.name === "NotFound") return true;
  return false;
}

export async function resolvePublicAddresses(
  endpoint: ValidatedCustomEndpoint,
  resolver: DnsResolver = defaultDnsResolver,
): Promise<readonly string[]> {
  if (isPublicIpAddress(endpoint.hostname)) return [endpoint.hostname];

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new EndpointValidationError(
          "ENDPOINT_TIMEOUT",
          "Custom endpoint DNS resolution timed out",
        ),
      );
    }, DNS_TIMEOUT_MS);
  });

  try {
    const settled = await Promise.race([
      Promise.allSettled([
        resolver(endpoint.hostname, "A", controller.signal),
        resolver(endpoint.hostname, "AAAA", controller.signal),
      ]),
      timeout,
    ]);

    // A host that simply has no record of one family is normal, not a
    // failure. Almost every real endpoint is IPv4 only, so Deno.resolveDns
    // rejects the AAAA lookup with NotFound for nearly all of them. Treating
    // that as a resolution failure made every IPv4 only custom endpoint fail.
    //
    // What must still fail closed is a resolver that genuinely could not be
    // reached, and a host that produced no addresses at all. A host that
    // resolved is then checked below so that every address it resolved to must
    // be public, which is the property that actually matters for SSRF.
    const failures = settled.filter(
      (result) =>
        result.status === "rejected" && !isDnsRecordAbsent(result.reason),
    );

    if (failures.length > 0) {
      throw new EndpointValidationError(
        "DNS_RESOLUTION_FAILED",
        "Custom endpoint DNS resolution failed",
      );
    }

    const addresses = [
      ...new Set(
        settled.flatMap((result) =>
          result.status === "fulfilled" ? result.value : []
        ).map((address) => address.trim().toLowerCase()),
      ),
    ];

    if (
      addresses.length === 0 ||
      addresses.length > MAX_DNS_ADDRESSES ||
      addresses.some((address) => !isPublicIpAddress(address))
    ) {
      throw new EndpointValidationError(
        "ENDPOINT_BLOCKED",
        "Custom endpoint must resolve only to public servers",
      );
    }

    addresses.sort((left, right) =>
      Number(left.includes(":")) - Number(right.includes(":"))
    );
    return addresses;
  } catch (error) {
    if (error instanceof EndpointValidationError) throw error;
    if (controller.signal.aborted) {
      throw new EndpointValidationError(
        "ENDPOINT_TIMEOUT",
        "Custom endpoint DNS resolution timed out",
      );
    }
    throw new EndpointValidationError(
      "DNS_RESOLUTION_FAILED",
      "Custom endpoint DNS resolution failed",
    );
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function createPinnedHttpsAgent(
  hostname: string,
  address: string,
): https.Agent {
  const servername = isIpAddress(hostname) ? undefined : hostname;
  const agent = new https.Agent({
    keepAlive: false,
    maxSockets: 1,
    maxFreeSockets: 0,
    // An environment proxy could resolve the hostname again and bypass the
    // pinned destination. An explicit empty proxy configuration forces direct
    // connections in the Deno Node compatibility layer.
    proxyEnv: {},
  } as https.AgentOptions);

  const createConnection = agent.createConnection.bind(agent);
  agent.createConnection = ((options, callback) => {
    // The URL keeps the original hostname for Host, SNI, and certificate
    // verification. Only the socket destination is replaced with the
    // validated DNS answer, so a second lookup cannot rebind the connection.
    const pinnedOptions = {
      ...options,
      host: address,
      lookup: undefined,
      port: 443,
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    } as typeof options & { servername?: string };
    pinnedOptions.servername = servername;
    return createConnection(pinnedOptions, callback);
  }) as typeof agent.createConnection;

  return agent;
}

function relevantResponseHeaders(
  headers: Record<string, string | string[] | undefined>,
): Headers {
  const result = new Headers();
  const allowed = [
    "content-type",
    "content-length",
    "etag",
    "retry-after",
    "x-rate-limit-limit",
    "x-rate-limit-remaining",
    "x-rate-limit-reset",
    "x-ratelimit-limit-requests",
    "x-ratelimit-remaining-requests",
    "x-ratelimit-reset-requests",
    "x-request-id",
    "request-id",
  ];

  for (const name of allowed) {
    const value = headers[name];
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized) result.set(name, normalized);
  }
  return result;
}

export async function fetchPinnedCustomEndpoint(
  endpoint: ValidatedCustomEndpoint,
  addresses: readonly string[],
  headers: Record<string, string>,
  options: { method?: CustomMethod; body?: string } = {},
): Promise<Response> {
  if (
    addresses.length === 0 ||
    addresses.some((address) => !isPublicIpAddress(address))
  ) {
    throw new EndpointValidationError(
      "ENDPOINT_BLOCKED",
      "Custom endpoint has no safe address to pin",
    );
  }

  const method = options.method ?? "GET";
  const body = options.body;
  if (body !== undefined && new TextEncoder().encode(body).byteLength > MAX_CUSTOM_BODY_BYTES) {
    throw new EndpointValidationError("INVALID_ENDPOINT", "Custom request body is too large");
  }

  const requestHeaders = { ...headers };
  if (body !== undefined) requestHeaders["content-length"] = String(new TextEncoder().encode(body).byteLength);

  const address = addresses[0]!;
  const agent = createPinnedHttpsAgent(endpoint.hostname, address);
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new EndpointValidationError("ENDPOINT_TIMEOUT", "Custom endpoint request timed out"));
    }, CUSTOM_REQUEST_TIMEOUT_MS);
  });

  try {
    const responsePromise = new Promise<Response>((resolve, reject) => {
      let requestSettled = false;
      const request = https.request(
        endpoint.url,
        {
          method,
          agent,
          headers: requestHeaders,
          signal: controller.signal,
          maxHeaderSize: MAX_RESPONSE_HEADER_BYTES,
        },
        (response) => {
          const chunks: Uint8Array[] = [];
          let totalBytes = 0;
          // Uses the single flag declared above rather than shadowing it. The
          // response and the request can both emit an error, and with two
          // flags the request handler could not see that the response had
          // already settled, so the double settle guard did not hold.
          const fail = (error: unknown) => {
            if (requestSettled) return;
            requestSettled = true;
            response.destroy();
            reject(error);
          };

          response.on("data", (chunk: Uint8Array | string) => {
            if (requestSettled) return;
            const bytes = typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk);
            totalBytes += bytes.byteLength;
            if (totalBytes > MAX_CUSTOM_BODY_BYTES) {
              fail(new EndpointValidationError("NETWORK_ERROR", "Custom endpoint response is too large"));
              return;
            }
            chunks.push(bytes);
          });
          response.once("end", () => {
            if (requestSettled) return;
            requestSettled = true;
            const rawStatus = response.statusCode ?? 502;
            const status = rawStatus >= 200 && rawStatus <= 599 ? rawStatus : 502;
            const combined = new Uint8Array(totalBytes);
            let offset = 0;
            for (const chunk of chunks) {
              combined.set(chunk, offset);
              offset += chunk.byteLength;
            }
            const responseBody = status === 204 || status === 304 ? null : combined;
            resolve(new Response(responseBody, {
              status,
              statusText: response.statusMessage || "",
              headers: relevantResponseHeaders(response.headers),
            }));
          });
          response.once("error", () => fail(new EndpointValidationError("NETWORK_ERROR", "Custom endpoint response failed")));
          // A connection that is cut before the body completes can emit
          // "aborted" with neither "end" nor "error". Without this the call
          // would hang until the request timeout and then be reported as a
          // slow endpoint, when in fact the peer reset the connection.
          response.once("aborted", () => fail(new EndpointValidationError("NETWORK_ERROR", "Custom endpoint closed the connection before the response completed")));
          response.once("close", () => fail(new EndpointValidationError("NETWORK_ERROR", "Custom endpoint closed the connection before the response completed")));
        },
      );

      request.once("error", () => {
        if (requestSettled) return;
        requestSettled = true;
        reject(controller.signal.aborted
          ? new EndpointValidationError("ENDPOINT_TIMEOUT", "Custom endpoint request timed out")
          : new EndpointValidationError("NETWORK_ERROR", "Custom endpoint request failed"));
      });
      if (body === undefined) request.end();
      else request.end(body);
    });
    return await Promise.race([responsePromise, timeout]);
  } catch (error) {
    if (error instanceof EndpointValidationError) throw error;
    throw new EndpointValidationError("NETWORK_ERROR", "Custom endpoint request failed");
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    agent.destroy();
  }
}

export function isValidSupabaseProjectRef(value: string): boolean {
  return PROJECT_REF_PATTERN.test(value.toLowerCase());
}
