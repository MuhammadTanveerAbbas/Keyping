<div align="center">

# KeyPing

**Validate API keys with provider aware diagnostics, health scoring, latency checks, and secure history.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://keyping.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## Overview

KeyPing is an API key testing workspace for developers and teams. Paste a supported key, select a provider, and review authentication status, provider health, latency, rate limit signals, and scopes where the provider exposes them.

Validation runs through a Supabase Edge Function. The full key is used for the request and is not stored. A saved result contains only a short key preview, status metadata, diagnostics, and optional notes.

## Capabilities

- Single key validation with clear valid, limited, and invalid states
- Provider aware check controls for status, rate limits, scopes, latency, and health score
- Composite health score from 0 to 100
- Provider health and uptime summaries
- Latency trends and provider comparisons
- History and vault view with filters and short key previews
- Bulk testing for up to 10 keys
- Request lab for safe custom HTTPS endpoint checks with response text and status banners
- PDF and CSV exports
- Expiry alerts and notification preferences
- Team workspaces with secure invite flow
- Keyboard friendly command palette with Cmd+K or Ctrl+K

## Provider coverage

Provider metadata has a single source of truth:
`supabase/functions/_shared/provider-contract.ts`. The frontend imports it
directly through `src/lib/providers.ts`, and the Edge Function imports the same
file, so the two cannot disagree about the provider list, availability,
supported checks, icon names, or documentation links.

| Provider | Availability | Validation |
|---|---|---|
| OpenAI | active | Authenticated `GET /v1/models` |
| Groq | active | Authenticated models request |
| Anthropic | active | Authenticated `GET /v1/models` |
| Stripe | active | Authenticated balance request |
| GitHub | active | Authenticated current user request, returns scopes |
| Twitter or X | active | Authenticated identity request |
| Notion | active | Authenticated identity request |
| Gemini | active | Models request using `x-goog-api-key` |
| Supabase | limited | Legacy JWTs with a valid `ref` claim are checked against that project's public auth settings. Publishable and secret keys carry no project URL and need a custom endpoint |
| AWS | limited | Not validated. A safe check needs a SigV4 signed STS request, so the function returns an explanatory `VALIDATION_UNAVAILABLE` result |
| Custom | active | Public HTTPS endpoints only, with SSRF protection |

`limited` means the provider is listed and selectable but cannot be fully
validated. `planned` is a valid state in the contract that no provider currently
uses. A provider marked `planned` is hidden from the pickers by
`isProviderSelectable` and answered with HTTP 422 `PROVIDER_PLANNED`.

Do not advertise a provider as active until its backend validator is deployed
and tested.

## Dashboard routes

| Route | Purpose |
|---|---|
| `/dashboard` | Overview, quick validation, recent results, provider health, alerts, and request lab |
| `/dashboard/analytics` | Trends, uptime, latency, status, and provider breakdowns |
| `/dashboard/history` | Saved result history, filters, previews, and deletion |
| `/dashboard/alerts` | Expiry reminders and credential follow up |
| `/dashboard/bulk` | Parallel key testing and report export |
| `/dashboard/team` | Team members, invitations, and shared workflows |
| `/dashboard/settings` | Profile, preferences, alerts, security, export, and help |

## Tech stack

| Category | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn style primitives, Radix UI |
| Backend | Supabase Auth, PostgreSQL, RLS, Edge Functions |
| Charts | Recharts |
| PDF | jsPDF |
| Forms | React Hook Form and Zod |
| Data | Supabase client with hand written data hooks. There is no query cache library, and the request contract is shared with the Edge Function so the two cannot drift |
| Testing | Vitest for the frontend, Deno test for the Edge Function |
| Deployment | Vercel and Supabase |

## Quick start

### Prerequisites

- Node.js 18 or newer
- pnpm
- A Supabase project

### Installation

```bash
git clone https://github.com/MuhammadTanveerAbbas/Keyping.git
cd Keyping
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:8080`.

The app needs Supabase client credentials before the authenticated dashboard can load. Do not commit `.env.local`.

## Environment variables

Client side variables are prefixed with `VITE_` and are inlined into the
browser bundle. Never prefix a secret with `VITE_`.

| Variable | Scope | Required | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Browser | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Yes | Anon or publishable key. `VITE_SUPABASE_PUBLISHABLE_KEY` is accepted as an alternative name |
| `SUPABASE_URL` | Server | Yes | Project URL for the Vercel routes and the Edge Function |
| `SUPABASE_ANON_KEY` | Edge Function | Yes | Gateway key used to verify the caller's token. Preferred over the two variables below |
| `SUPABASE_PUBLISHABLE_KEYS` | Edge Function | No | Newer key format. A JSON object; `anon`, then `default`, then the first value is used |
| `SUPABASE_SECRET_KEYS` | Edge Function | No | Newer key format, last resort. Because the gateway key is attached to every token verification, a deployment that sets only this will send a secret key on that request, so set `SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Yes | Authenticates the rate limit RPC. Never exposed to the browser |
| `VERCEL_URL` | Vercel | No | Set automatically by Vercel. Used by the health route to allow the deployment origin |

`CRON_SECRET` and the Stripe variables in `.env.example` are placeholders for
integrations that are not implemented. See "Known gaps".

## Supabase setup

### Fresh project

`supabase/config.toml` declares the schema files in order through
`db.migrations.schema_paths`, so a local reset or a fresh project is built by:

```bash
supabase db reset
```

That applies `supabase/database/structure.sql` and then
`supabase/database/security.sql`, in that order. The split is by purpose:
`structure.sql` is what the database is, `security.sql` is who may do what.

### Existing project

`supabase/database/upgrade.sql` is the one time path for a database that was
created before the current schema. It is deliberately not in
`db.migrations.schema_paths`, because it alters tables a fresh project does not
have yet. It is idempotent, so it is safe to apply to a partially upgraded
database and safe to re-run.

Read the verification block at the top of `upgrade.sql` and run those queries
before applying anything. It reports whether the known security findings are
still present, and which legacy CHECK constraints are still unvalidated.

### Deploying the Edge Function

```bash
supabase functions deploy test-api-key --project-ref your-project-id
```

The browser must call the same function name that is deployed:

```ts
supabase.functions.invoke("test-api-key", { body });
```

All three testers go through `invokeTestApiKey` in `src/lib/edge-function.ts`
rather than calling `supabase.functions.invoke` directly, so the error payload
is parsed in exactly one place.

### Authentication settings to review in the dashboard

- **Prevent use of leaked passwords.** Supabase checks new passwords against
  Have I Been Pwned. There is no `config.toml` key for this, so it must be
  enabled in the dashboard under Authentication, then email and password. The
  Supabase Security Advisor reports it as a finding while it is off.
- Set the Auth redirect URL for the deployed domain.
- Keep sign ups enabled only if you intend open registration.

## Security model

- Full API keys are sent only to the Edge Function for the active request. The
  key is never logged, never returned in a response, and never persisted.
- The database stores at most the last four characters of a key, in
  `key_tests.key_preview`, constrained to between 1 and 4 characters by a CHECK.
- API key fields are cleared after ten minutes of inactivity. The request lab
  discards the response body at the same moment, because the body can itself
  contain sensitive material.
- Row level security limits history, alerts, teams, and shared results. Every
  table has RLS enabled with explicit grants; no table relies on defaults.
- Membership checks live in the `private` schema, which PostgREST does not
  serve. They are `SECURITY DEFINER` so a policy on `team_members` can read
  `team_members` without recursing into itself.
- Every `SECURITY DEFINER` function sets `search_path = pg_catalog` and schema
  qualifies everything it touches.
- Every UPDATE policy carries an explicit `WITH CHECK`, so a caller cannot pass
  the `USING` clause and then rewrite an ownership column.
- `private.usage_counters` is enabled with no policy, which denies every role.
  `public.consume_rate_limit` is the only path to it, and that function is
  executable by `service_role` alone. The function has to live in `public`
  because PostgREST only routes functions in a schema listed in `api.schemas`,
  and `private` is deliberately not listed.
- Custom endpoints require HTTPS on port 443, must resolve only to public
  addresses, and are reached over a connection pinned to the validated address
  with redirects disabled. Pinning is what closes DNS rebinding.
- Redirects, private and reserved IP ranges, metadata services, link local
  addresses, and unsafe request headers are blocked.
- Provider calls use bounded timeouts and conservative retries.
- No provider response is treated as a guarantee of future availability.
- Users can export or delete their saved data from Settings, and can delete
  their account.
- The production Content Security Policy has no `connect-src` entry for a third
  party analytics host, and the privacy policy states that no advertising
  trackers are used. Adding either is a product and legal decision.

Review the custom endpoint policy whenever the Edge Function request contract
changes. SSRF protection must also be tested at the network layer, not only in
application code.

## Database model

The schema lives in `supabase/database/`. The entity diagram is in
`docs/diagrams.md`.

| Table | Purpose | Grants to `authenticated` |
|---|---|---|
| `key_tests` | Saved validation summaries and diagnostics | select, insert, update, delete |
| `alerts` | Expiry reminders | select, insert, update, delete |
| `teams` | Workspace ownership | select, insert, update, delete |
| `team_members` | Workspace membership and roles | select, insert, delete |
| `team_invites` | Hashed, expiring invitations | select, delete |
| `shared_results` | Team scoped result sharing | select, insert, delete |
| `notification_preferences` | One preference row per account | select, insert, update, delete |
| `private.usage_counters` | Rate limit windows | none, reachable only through `public.consume_rate_limit` |

`team_invites` has no direct insert path for authenticated users. Rows are only
created by the `create_team_invite` RPC, which returns the raw token once and
stores only its SHA-256 hash.

Do not use a destructive schema reset against production data. Test the RLS
behaviour with at least four roles: anonymous, team owner, team member, and an
unrelated authenticated user. `upgrade.sql` ends with a nine step manual check
list covering exactly those cases.

## Known gaps

These are real and deliberately not hidden.

- **Alert delivery does not exist.** `alerts.notified` is never written and
  there is no scheduler, so an alert is a stored record only. The Alerts page
  says so in the interface. `vercel.json` has no `crons` array, so nothing
  triggers a revalidation or a digest either.
- **`api/keep-alive.ts` has no scheduler.** It is reachable and correctly
  authenticated, but nothing calls it on a schedule. Its `config.cron` export is
  the Next.js idiom and is inert in this Vite project. Remove it, or add a
  `crons` array to `vercel.json`, but do not leave it looking active.
- **`team_invites` has no list or revoke UI.** Invites are created and accepted
  but never listed, so each invite link click leaves a row until it expires.
  `revoke_team_invite` exists in the database but the frontend never calls it.
- **`shared_results` is unused by the frontend.** The table, its three
  policies, and the `private.is_valid_shared_result` helper are all in place,
  and no page reads or writes the table.
- **No product analytics exists.** See the security model note above.
- **The Deno test suite is not run by `pnpm test`.** `vitest.config.ts` scopes
  to `src`, and the five files under `supabase/functions` need `deno test`.
  There is no CI workflow, so nothing runs them automatically.
- **Leaked password protection is off** until enabled in the dashboard.

## Available scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server on port 8080 |
| `pnpm build` | Create a production build |
| `pnpm build:dev` | Create a development mode build |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm check:copy` | Verify that UI and documentation contain no typographic dash characters |
| `pnpm test` | Run the Vitest suite |
| `pnpm test:watch` | Run Vitest in watch mode |

## Project structure

```text
Keyping/
├── api/                         Vercel edge routes: health, keep alive
├── docs/diagrams.md             Mermaid architecture, flow, and ER diagrams
├── public/                      Static assets
├── scripts/                     Copy check used by the quality gate
├── src/
│   ├── components/              Shared UI and dashboard components
│   ├── hooks/                   Data hooks and shared row normalization
│   ├── integrations/supabase/   Supabase client and database types
│   ├── lib/                     Auth, provider registry, CSV, events, helpers
│   ├── pages/                   Route level pages
│   └── test/                    Vitest suites
├── supabase/
│   ├── database/
│   │   ├── structure.sql        Tables, constraints, indexes, triggers
│   │   ├── security.sql         RLS, policies, functions, grants
│   │   └── upgrade.sql          One time path for an existing database
│   ├── functions/
│   │   ├── _shared/             SSRF guards, retry, shared contracts
│   │   └── test-api-key/        The deployable edge function
│   └── config.toml              Local project config and schema file order
├── README.md
└── package.json
```

## Roadmap

- [x] Single key validation
- [x] Provider diagnostics and health score
- [x] Bulk testing
- [x] History and short key previews
- [x] Analytics and latency trends
- [x] Expiry alert data model and settings workflow
- [x] Team workspace data model
- [x] PDF and CSV exports
- [x] Command palette
- [ ] Scheduled revalidation jobs
- [ ] Email and webhook delivery
- [ ] Public REST validation API
- [ ] CLI integration
- [ ] Billing and usage limits
- [ ] Full AWS SigV4 validation
- [ ] Saved request collections and assertions

## Quality checklist

Before merging a change:

```bash
pnpm typecheck
pnpm lint
pnpm check:copy
pnpm test
pnpm build
```

For Edge Function changes, also run the Deno checks, which `pnpm test` does not
cover:

```bash
deno check --config supabase/functions/test-api-key/deno.json supabase/functions/test-api-key/index.ts
deno test --config supabase/functions/test-api-key/deno.json supabase/functions/test-api-key/*_test.ts
deno lint --config supabase/functions/test-api-key/deno.json supabase/functions/_shared supabase/functions/test-api-key
```

For database changes, run `supabase db reset` for a fresh database, and work
through the manual checks at the end of `upgrade.sql` against any existing one.
For provider changes, test both successful and failing responses without
logging the API key, and update `docs/diagrams.md` if the flow changed.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Add or update tests.
5. Run the quality checklist.
6. Open a pull request with the affected routes and database migrations listed.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Built by Muhammad Tanveer Abbas

SaaS Developer and builder of practical production tools.
