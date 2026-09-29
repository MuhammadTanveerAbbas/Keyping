# `test-api-key` Edge Function

This directory is the source of the deployable Supabase Edge Function:

```sh
supabase functions deploy test-api-key
```

`test-api-key/index.ts` is the only entry point. There is no compatibility
shim at `supabase/functions/index.ts`: the Supabase CLI only treats
subdirectories of `supabase/functions/` as deployable functions, so a file at
that level would never be deployed and would only be a second copy of the
bootstrap that could drift.

## Authentication and rate limiting

Two independent gates protect this function.

1. The gateway rejects unauthenticated calls before the function starts, from
   `verify_jwt = true` in `supabase/config.toml`.
2. The handler resolves the caller itself by asking Supabase Auth about the
   token. A locally decoded token is never trusted, because an unverified token
   is attacker controlled.

Only after both gates pass is one unit of the caller's request budget charged,
and only then is the body read or any provider contacted. An unauthenticated
caller therefore cannot reach a provider or consume quota.

The budget is 60 requests per 60 seconds per account and lives in the database,
in `private.usage_counters` behind `public.consume_rate_limit`. It is enforced
in the database rather than in this function so it cannot be bypassed, cannot be
reset by a cold start, and cannot be lost. `public.consume_rate_limit` is
executable only by `service_role`, so a signed in user cannot call it directly
nor charge it against another account. If the limiter cannot be reached the
request is refused rather than allowed through unmetered.

Exceeding the budget returns HTTP 429 with error code `RATE_LIMITED`.

## Required environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Project URL used to verify the caller token and to reach the rate limit RPC |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Authenticates the rate limit RPC call. Never exposed to the browser |
| `SUPABASE_ANON_KEY` | One of the three below | Gateway key used to ask Supabase Auth about the caller token |
| `SUPABASE_PUBLISHABLE_KEYS` | One of the three below | Newer key format. A JSON object; `anon`, then `default`, then the first value is used |
| `SUPABASE_SECRET_KEYS` | One of the three below | Newer key format, used only as a last resort |

Prefer `SUPABASE_ANON_KEY`. The gateway key lookup order is
`SUPABASE_ANON_KEY`, then `SUPABASE_PUBLISHABLE_KEYS`, then
`SUPABASE_SECRET_KEYS`. Because that key is attached to every token
verification, a deployment that only sets `SUPABASE_SECRET_KEYS` sends a secret
key on that request, so set `SUPABASE_ANON_KEY` explicitly.

## Request contract

Send a JSON `POST` request with a Supabase user access token in the `Authorization` header.

```json
{
  "provider": "gemini",
  "apiKey": "full-key-is-never-returned",
  "checks": ["status", "rateLimit", "responseTime", "healthScore"]
}
```

Fields:

- `provider`: Required provider id from the shared capability model.
- `apiKey`: Required, trimmed, at most 512 visible ASCII characters. It is used only in memory and is never returned, logged, or persisted by this function.
- `checks`: Optional array of selected checks. If omitted, the provider's supported checks are used. The `status` check is mandatory and is always included in the effective response.
- `customEndpoint`: Required only for `custom`. It must be a public HTTPS endpoint on port 443.
- `customAuthHeader`: Optional for `custom`. It defaults to `Authorization: Bearer YOUR_KEY` and must contain `YOUR_KEY` exactly once.
- `method`: Optional custom request method. Supported values are `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
- `requestBody`: Optional bounded text body for non-GET custom requests, up to 128 KB.

Supported check names are `status`, `rateLimit`, `scopes`, `docs`, `responseTime`, and `healthScore`. A request for a check the selected provider does not support is rejected.

## Response contract

A completed validation returns HTTP 200:

```json
{
  "provider": "gemini",
  "capability": "active",
  "checks": ["status", "rateLimit", "docs", "responseTime", "healthScore"],
  "status": "valid",
  "rateLimit": {
    "remaining": 120,
    "resetAt": "2026-09-24T12:00:00.000Z"
  },
  "latencyMs": 142,
  "healthScore": 95,
  "statusCode": 200,
  "headers": { "content-type": "application/json" },
  "body": "{\"ok\":true}"
}
```

`status` is `valid`, `invalid`, or `limited`. Optional fields are included only when selected and available. `healthScore` is an integer from 0 to 100 based on authentication status, scopes, rate-limit headroom, and latency.

Request failures use a structured error while retaining the legacy string `error` field for the current frontend:

```json
{
  "status": "invalid",
  "error": "Endpoint URL credentials are not allowed",
  "errorDetails": {
    "code": "ENDPOINT_REJECTED",
    "message": "Endpoint URL credentials are not allowed",
    "retryable": false
  }
}
```

## Provider coverage

| Provider | Capability | Validation |
| --- | --- | --- |
| OpenAI | active | Authenticated `GET /v1/models` |
| Anthropic | active | Authenticated `GET /v1/models` |
| Groq | active | Authenticated models request |
| Stripe | active | Authenticated balance request |
| GitHub | active | Authenticated current-user request with scopes |
| Twitter / X | active | OAuth bearer current-user request |
| Notion | active | Integration current-user request |
| Gemini | active | Models request using `x-goog-api-key` |
| Supabase | limited | Legacy JWTs with a valid `ref` claim are checked against that project's public auth settings endpoint. Publishable and secret keys do not contain a project URL and require a custom endpoint. |
| AWS | limited | Not validated. A safe check requires a SigV4-signed STS request. |
| Custom | active | DNS-pinned public HTTPS requests with bounded methods, bodies, responses, and redirects disabled |

The frontend model in `src/lib/providers.ts` imports the canonical provider metadata from `supabase/functions/_shared/provider-contract.ts`. The backend uses the same ids, availability states, checks, validation kinds, and icon names.

## Custom endpoint security

Custom requests use the following controls:

- HTTPS on port 443 only.
- No URL credentials, fragments, control characters, or nonstandard ports.
- Literal and DNS-resolved IPv4 and IPv6 addresses are checked against loopback, private, link-local, carrier-grade NAT, metadata, documentation, multicast, and reserved ranges.
- Hostnames commonly used for local services and cloud metadata are rejected.
- Every A and AAAA result is inspected. A hostname with any blocked address is rejected.
- The selected public address is pinned for the TLS connection while retaining the original hostname for SNI and certificate verification. This prevents DNS rebinding between validation and connection.
- Redirects are never followed.
- Request header names are token validated. Hop-by-hop, routing, browser-origin, proxy, cookie, and TLS upgrade headers are denied.
- Header, URL, body, DNS answer, response header, and timeout limits are enforced.

A custom auth template must contain exactly one `YOUR_KEY` placeholder. Unsafe headers such as `Host`, `Connection`, `Content-Type`, `Transfer-Encoding`, `Cookie`, `Proxy-Authorization`, `User-Agent`, and forwarding headers are rejected. `Content-Type` is denied because the function sets it itself when a body is sent, so allowing a caller to name it would let them pass validation and then watch their key silently overwritten.

## Retry policy

Provider checks use idempotent `GET` requests only. Network failures, 429 responses, and 5xx responses receive at most one retry. The retry helper never replays non-idempotent methods, caps retries and timeouts, uses bounded exponential backoff with jitter, and discards response bodies before retrying.

## Local checks

```sh
deno check --config supabase/functions/test-api-key/deno.json supabase/functions/test-api-key/index.ts
deno test --config supabase/functions/test-api-key/deno.json supabase/functions/test-api-key/*_test.ts
deno lint --config supabase/functions/test-api-key/deno.json supabase/functions/_shared supabase/functions/test-api-key
```
