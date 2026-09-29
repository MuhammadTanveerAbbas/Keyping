# KeyPing architecture

Every diagram here is derived from the code in this repository. If you change
the implementation, change the matching diagram in the same change.

## System overview

```mermaid
flowchart TB
    subgraph browser["Browser"]
        UI["React pages<br/>src/pages"]
        HOOKS["Data hooks<br/>src/hooks"]
        SB["Supabase client<br/>@supabase/supabase-js"]
        EDGE["invokeTestApiKey<br/>src/lib/edge-function.ts"]
        UI --> HOOKS
        UI --> EDGE
        HOOKS --> SB
    end

    subgraph vercel["Vercel edge runtime"]
        HEALTH["/api/health"]
        KEEPALIVE["/api/keep-alive"]
    end

    subgraph supabase["Supabase"]
        AUTH["GoTrue<br/>sign in, sign up, session"]
        GATEWAY["Edge Function gateway<br/>verify_jwt = true"]
        FN["test-api-key<br/>functions/test-api-key/handler.ts"]
        REST["PostgREST<br/>exposes public schema only"]
        PG[("PostgreSQL")]
        PRIVSCHEMA["private schema<br/>not exposed to PostgREST"]
    end

    subgraph providers["Third party providers"]
        P["OpenAI, Anthropic, Groq,<br/>Stripe, GitHub, X, Notion, Gemini"]
        CUSTOM["User supplied<br/>public HTTPS endpoint"]
    end

    UI -->|"auth"| AUTH
    SB -->|"SQL, RLS enforced"| REST
    REST --> PG
    SB -.->|"auth state"| AUTH
    EDGE -->|"POST + user JWT"| GATEWAY
    GATEWAY --> FN
    FN -->|"verify token"| AUTH
    FN -->|"consume budget"| REST
    PRIVSCHEMA --> PG
    FN -->|"provider request"| P
    FN -->|"DNS pinned, no redirects"| CUSTOM
    HEALTH --> REST
    KEEPALIVE --> REST

    classDef hidden fill:#fde8e8,stroke:#c0392b
    classDef external fill:#eef7ee,stroke:#27ae60
    class PRIVSCHEMA hidden
    class P,CUSTOM external
```

The private schema holds the RLS helper functions and the rate limit counters.
It is not in `api.schemas` in `supabase/config.toml`, so PostgREST never serves
it and no client can call anything inside it over the REST API.

## Validation request and error flow

This is the path every tester uses. The three testers call
`invokeTestApiKey`, so the error payload is parsed in one place.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant T as Tester component
    participant W as invokeTestApiKey
    participant G as Edge gateway
    participant F as test-api-key
    participant A as Supabase Auth
    participant D as PostgreSQL
    participant R as Rate limiter RPC
    participant V as Provider

    U->>T: submit a key
    T->>W: invokeTestApiKey(body)
    W->>G: POST /functions/v1/test-api-key + Bearer JWT

    alt gateway rejects the token
        G-->>W: 401
        W->>W: parse error.context.json()
        W-->>T: EdgeFunctionError, code AUTHENTICATION_REQUIRED
    end

    G->>F: start function
    F->>A: GET /auth/v1/user with the token
    A-->>F: user id, or 401
    F->>R: consume_rate_limit(user id)
    R->>D: upsert the window, drop stale windows
    D-->>R: count
    R-->>F: allowed true or false

    alt budget spent or limiter unreachable
        F-->>W: 429 RATE_LIMITED
        W-->>T: readable message
    end

    F->>F: validate provider, key, checks, endpoint
    F->>V: provider request, or pinned custom request
    V-->>F: status, scopes, rate limit
    F-->>W: 200 with status and optional errorDetails
    W-->>T: result

    Note over W: A non 2xx is never surfaced as the fixed supabase-js string. The body is read from error.context and the specific ApiErrorCode is preserved.
```

## Authentication flow

```mermaid
flowchart TD
    START(["Visitor"]) --> ROUTE{"Path"}
    ROUTE -->|"/ or /privacy or /terms"| PUB
    ROUTE -->|"/dashboard/*"| PROT
    ROUTE -->|"/auth"| AUTH

    PUB["PublicRoute"] --> PL{"loading"}
    PROT["ProtectedRoute"] --> PL2{"loading"}
    AUTH["AuthPage"] --> PL3{"loading"}

    PL -->|"yes"| LOADER["Full screen loader"]
    PL2 -->|"yes"| LOADER
    PL3 -->|"yes"| LOADER

    PL -->|"no, signed in, not /auth"| DASH["Navigate to /dashboard"]
    PL -->|"no"| LANDING["Render the public page"]

    PL2 -->|"no, no user"| TOAUTH["Navigate to /auth<br/>carrying the full path in state.from"]
    PL2 -->|"no, signed in"| OUT["Render the dashboard outlet"]

    TOAUTH --> AUTH
    AUTH -->|"sign in, sign up, or OAuth"| TOK["Supabase Auth issues a session"]
    TOK --> READS["AuthPage reads state.from"]
    READS --> BACK["Navigate to the requested page, or /dashboard"]
    NOTE["PublicRoute deliberately does not redirect<br/>away from /auth, so AuthPage owns this navigation<br/>and the deep link is not lost"]
    AUTH -.-> NOTE
```

## Authorization and RLS

```mermaid
flowchart TB
    REQ["Signed in REST request"] --> POLICY["Row level security policy runs<br/>as the authenticated role"]
    POLICY --> TABLE{"Table"}

    TABLE -->|key_tests, alerts,<br/>notification_preferences| OWN["user_id = auth.uid()<br/>select, insert, update, delete"]
    TABLE -->|teams| TOWN["select: private.is_team_member(id)<br/>insert: owner_id = auth.uid()<br/>update, delete: owner_id = auth.uid()<br/>WITH CHECK blocks reassigning owner_id"]
    TABLE -->|team_members| TM["select: private.is_team_member(team_id)<br/>insert: private.is_team_owner, role must be member<br/>delete: self, or the owner"]
    TABLE -->|team_invites| TI["select, delete: private.is_team_owner(team_id)<br/>no insert grant, rows come from the RPC"]
    TABLE -->|shared_results| SR["select: private.is_valid_shared_result<br/>insert: owns the key test and is in the team<br/>delete: shared it, or owns the team"]

    OWN --> RESULT["Row, or nothing"]
    TOWN --> RESULT
    TM --> RESULT
    TI --> RESULT
    SR --> RESULT

    HELPER["private.is_team_member<br/>private.is_team_owner<br/>private.owns_key_test<br/>private.is_valid_shared_result"] -.->|"SECURITY DEFINER<br/>reads as owner, so the policy does not recurse"| TOWN
    HELPER -.-> TM
    HELPER -.-> TI
    HELPER -.-> SR

    RPC["SECURITY DEFINER RPCs<br/>create_team_with_owner, create_team_invite,<br/>accept_team_invite, revoke_team_invite,<br/>transfer_team_ownership, delete_user_account"] -->|"auth.uid checked inside<br/>anon and PUBLIC revoked"| RESULT
    LIMIT["public.consume_rate_limit<br/>service_role only"] -.->|"SECURITY DEFINER<br/>private.usage_counters has no policy at all"| DENY["Denied for anon and authenticated"]
```

## Database entity relationship model

```mermaid
erDiagram
    auth_users ||--o{ key_tests : "owns"
    auth_users ||--o{ alerts : "owns"
    auth_users ||--|| notification_preferences : "has exactly one"
    auth_users ||--o{ teams : "owns"
    auth_users ||--o{ team_members : "joins"
    auth_users ||--o{ team_invites : "sends and accepts"

    teams ||--o{ team_members : "has"
    teams ||--o{ team_invites : "issues"
    teams ||--o{ shared_results : "scopes"
    key_tests ||--o{ shared_results : "is shared as"

    teams {
        uuid id PK
        text name "1 to 100 chars, trimmed"
        uuid owner_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    team_members {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        text role "owner or member"
        timestamptz joined_at
        timestamptz updated_at
    }
    team_invites {
        uuid id PK
        uuid team_id FK
        text email "optional, must match on accept"
        text token_hash "sha256 hex, 64 chars, unique"
        text role "member"
        uuid invited_by FK
        uuid accepted_by FK "null until accepted"
        timestamptz expires_at "1 to 720 hours"
        timestamptz accepted_at
        timestamptz revoked_at
    }
    key_tests {
        uuid id PK
        uuid user_id FK
        text provider "constrained to the 11 known ids"
        text key_preview "1 to 4 chars, last four only"
        text nickname
        text notes
        text status "valid, invalid, limited"
        jsonb scopes
        jsonb rate_limit_info
        integer health_score "0 to 100"
        integer latency_ms
        timestamptz tested_at
        timestamptz created_at
        timestamptz updated_at
    }
    shared_results {
        uuid id PK
        uuid team_id FK
        uuid key_test_id FK
        uuid shared_by FK
        timestamptz shared_at
        timestamptz updated_at
    }
    alerts {
        uuid id PK
        uuid user_id FK
        text key_nickname "1 to 200 chars"
        timestamptz expiry_date
        integer reminder_days "1 to 365"
        boolean notified "never written, no scheduler"
        timestamptz created_at
        timestamptz updated_at
    }
    notification_preferences {
        uuid user_id PK
        boolean email_notifications
        boolean expiry_alerts
        boolean weekly_digest
        timestamptz created_at
        timestamptz updated_at
    }
```

`private.usage_counters` is omitted here because it is not part of the user
facing model. It is `(user_id, window_start)` primary key with a request count.
The table lives in `private` and has no policy, so it is unreachable over the
REST API. The function that writes it, `public.consume_rate_limit`, has to live
in `public` because PostgREST only routes functions in a schema listed in
`api.schemas`; it is executable by `service_role` alone.

## Frontend state and refresh flow

Data is fetched by four hand written hooks. There is no query cache library.
Cross page freshness comes from a single typed event.

```mermaid
flowchart LR
    subgraph hooks["Hooks, each with a request race guard"]
        AH["useAnalytics<br/>useKeyTests, limit 500"]
        UH["useHistory<br/>limit 500, provider and status filters"]
        UA["useAlerts"]
        UP["usePreferences"]
    end

    EV["notifyDataChanged(dataset)<br/>src/lib/data-events.ts"]

    DASH["Dashboard: save a result"] -->|"key_tests"| EV
    SET["Settings: delete all data"] -->|"key_tests"| EV
    HIST["History: delete a row"] -->|"key_tests"| EV
    AP["Alerts: create or delete"] -->|"alerts"| EV

    EV -->|subscribes| AH
    EV -->|subscribes| UH
    EV -->|subscribes| UA
    EV -->|subscribes| UP
    EV -->|"refresh the header count"| LAYOUT["DashboardLayout"]

    AH --> ROWS["normalizeKeyTests<br/>one shared copy, finite number guards"]
    UH --> ROWS
```

The guard exists because each hook refetches whenever a dependency changes. A
slow earlier response is discarded when a newer request has already started, and
no hook writes state after unmount.

## Database file layout

```mermaid
flowchart TB
    subgraph fresh["Fresh project, or supabase db reset"]
        CFG["supabase/config.toml<br/>db.migrations.schema_paths"] --> ST["database/structure.sql<br/>extensions, schemas, tables,<br/>constraints, indexes, triggers"]
        ST --> SE["database/security.sql<br/>RLS, 24 policies,<br/>11 functions, grants"]
    end

    subgraph existing["Existing database, once"]
        UP["database/upgrade.sql<br/>read the verification block first"] --> DROP["drops public.rls_auto_enable"]
        DROP --> CATCH["creates what is missing,<br/>adds constraints NOT VALID,<br/>backfills, adds the rate limiter,<br/>restores object comments"]
    end

    SE --> SAME["Same intended state"]
    CATCH --> SAME

    NOTE["upgrade.sql is deliberately not in schema_paths.<br/>It alters tables a fresh project does not have yet."]
    CFG -.-> NOTE
```

## Custom endpoint SSRF controls

```mermaid
flowchart TD
    IN["customEndpoint from the request"] --> SCHEME{"https only?"}
    SCHEME -->|no| REJ["400 INVALID_REQUEST"]
    SCHEME -->|yes| PORT{"port 443?"}
    PORT -->|no| REJ
    PORT -->|yes| CRED{"URL credentials,<br/>fragment, control chars,<br/>trailing dot?"}
    CRED -->|any present| REJ
    CRED -->|clean| LHOST["Hostnames used for local services<br/>and cloud metadata are denied"]
    LHOST --> LIT{"Literal IP?<br/>decimal, octal, hex and<br/>IPv4 mapped forms all normalize first"}
    LIT -->|yes| RANGE{"In a public range?"}
    LIT -->|no| DNS["Resolve A and AAAA"]
    RANGE -->|no| REJ
    RANGE -->|yes| PIN
    DNS -->|"one family may be absent,<br/>that is not a failure"| CHECK{"Every address that did<br/>resolve is public?"}
    CHECK -->|no| REJ
    CHECK -->|yes| PIN["Connect to the validated address<br/>with lookup disabled,<br/>keeping the hostname for SNI<br/>and certificate checks"]
    PIN --> HDRS["Header names token validated.<br/>Host, Cookie, Content-Type,<br/>Transfer-Encoding, forwarding,<br/>and sec- prefixes are denied"]
    HDRS --> REQ["Request sent. Redirects are never followed.<br/>8 second timeout, 128 KB body cap,<br/>32 KB response header cap"]
    REQ --> OUT["Only allowlisted response headers<br/>are echoed back to the browser"]
```

Pinning the address while keeping the hostname for TLS is what closes DNS
rebinding: a second lookup cannot redirect the connection after validation, and
the certificate is still verified against the name the user asked for.
