<div align="center">

# KeyPing

**Validate API keys across 10+ providers - check status, rate limits, and permissions in one dashboard.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://keyping.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## Overview

Debugging a broken API key shouldn't take hours. KeyPing lets you paste any API key and get a full validation report: status, health score, rate limits, scopes, and latency in under 2 seconds. Built for developers and teams who ship fast and can't afford silent key failures in production.

Keys are validated server-side via Supabase Edge Functions - your full key is never stored, only the last 4 characters are saved for reference.

---

## Recent Improvements (v2.0)

### Before & After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Dashboard Pages** | 9 separate routes with significant duplication | 5 focused pages with shared logic |
| **Analytics** | Split across 2 files (DashboardWidgets + StatsPage) with duplicate data fetching | Single `useAnalytics()` hook powering both overview and full analytics |
| **History/Vault** | Two separate pages with different data limits (20 vs 500) | Unified History page with view toggle (list/cards) |
| **Documentation** | Separate page that added navigation clutter | Integrated into Settings > Help & Docs |
| **Alerts** | Separate page, isolated from workflow | Alerts management integrated into Settings |
| **Type Safety** | Missing `updated_at` fields in TypeScript types | All types match schema |
| **Edge Function** | Outdated Deno std library (0.168.0) | Updated to 0.220.0+ |
| **SSRF Protection** | Basic hostname blocking | Enhanced with cloud metadata endpoint blocking + port validation |
| **Team Creation** | Two-step insert with race condition risk | Atomic RPC function `create_team_with_owner()` |
| **AWS Provider** | Wasteful HTTP request with "Bearer unsupported" | Short-circuits before making request |
| **Data Fetching** | Duplicate queries across components | Centralized hooks with React Query caching |

---

## Features

- **Instant Key Validation** - Paste any API key and get a pass/fail result with full details in under 2 seconds
- **Health Score (0-100)** - Every validation produces a composite score based on validity, rate limits, scopes, and response latency
- **Latency Benchmarking** - Measures real round-trip latency to each provider's auth endpoint
- **Bulk Testing** - Test up to 10 keys simultaneously; export results as a PDF report
- **Secure Key Vault** - Only the last 4 characters of each key are stored; full keys are tested at the edge and immediately discarded
- **Expiry Alerts** - Set reminders for key expiry dates with configurable lead times
- **Team Workspaces** - Create teams, invite members via shareable links
- **Analytics Dashboard** - Track validation history, provider distribution, health trends, and latency over time
- **10+ Supported Providers** - OpenAI, Groq, Anthropic, Stripe, GitHub, Twitter/X, Notion, AWS, and custom endpoints
- **Dark / Light Mode** - Full theme support with smooth transitions
- **Command Palette** - Keyboard-first navigation across the entire app (Cmd+K)

---

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS v3 + shadcn/ui + Radix UI |
| Backend | Supabase (Auth + PostgreSQL + RLS + Edge Functions) |
| Auth | Supabase Auth (Google OAuth) |
| Animations | Framer Motion |
| Charts | Recharts |
| PDF Export | jsPDF |
| Forms | React Hook Form + Zod |
| State | TanStack Query v5, React Context (auth) |
| Testing | Vitest + Testing Library |
| Deployment | Vercel (SPA + Edge Functions) |

---

## Dashboard Routes (5 Pages)

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | **Tester** | Main key validation interface + compact stats overview |
| `/dashboard/analytics` | **Analytics** | Full charts, trends, provider breakdowns |
| `/dashboard/history` | **History & Vault** | Unified view with list/cards toggle, filters |
| `/dashboard/bulk` | **Bulk Test** | Test up to 10 keys in parallel |
| `/dashboard/team` | **Team** | Team workspace management |
| `/dashboard/settings` | **Settings** | Profile, notifications, security, help & docs |

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/MuhammadTanveerAbbas/Keyping.git
cd Keyping

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values (see Environment Variables section below)

# 4. Run the development server
pnpm dev

# 5. Open in browser
# http://localhost:5173
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase/schema.sql` via the Supabase SQL editor
3. Deploy the edge function: `supabase functions deploy test-api-key`
4. Copy your project URL and anon key into `.env.local`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (client-safe) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions only | Supabase service role key (server-only) |
| `SUPABASE_ANON_KEY` | Edge functions only | Supabase anon key for edge function auth verification (server-only) |
| `CRON_SECRET` | Vercel Cron only | Secret for authenticating cron job requests |

Get your keys at [supabase.com](https://supabase.com) -> Project Settings -> API.

---

## Project Structure

```
Keyping/
├── api/                      # Vercel serverless/edge functions
│   ├── health.ts             # Health check endpoint
│   └── keep-alive.ts         # Cron job to prevent cold starts
├── public/                   # Static assets
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── dashboard/        # Dashboard-specific UI primitives
│   │   └── ui/               # shadcn/ui primitives
│   ├── pages/                # Route-level page components (5 pages)
│   ├── hooks/                # Shared custom React hooks
│   │   ├── useAnalytics.ts   # Analytics data + computations
│   │   └── useHistory.ts     # History filtering + CRUD
│   ├── lib/                  # Auth, providers config, schemas, utilities
│   └── integrations/
│       └── supabase/         # Supabase client + generated types
├── supabase/
│   ├── functions/
│   │   └── test-api-key/     # Edge function: validates keys server-side
│   └── schema.sql            # Database schema + RLS policies + indexes
├── .env.example
├── package.json
└── README.md
```

---

## Shared Hooks

### `useAnalytics()`
Single source of truth for all analytics data. Fetches tests once, computes all metrics:
- Total/monthly tests with trend
- Uptime rate, average latency, health score
- Provider distribution, latency by provider
- Health distribution, status breakdown
- Daily counts for sparklines

### `useHistory()`
Unified history with filtering and CRUD:
- Filter by provider and status
- Delete functionality
- Returns raw test data for list/cards views

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server (port 8080) |
| `pnpm build` | Build for production |
| `pnpm build:dev` | Build in development mode |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests (single run) |
| `pnpm test:watch` | Run tests in watch mode |

---

## Deployment

Deployed on **Vercel**.

1. Push to GitHub
2. Import repo into Vercel
3. Set environment variables in Vercel dashboard
4. Deploy
5. Deploy edge functions: `supabase functions deploy test-api-key --project-ref your-project-id`

---

## Security Improvements (v2.0)

| Improvement | Details |
|-------------|---------|
| **Enhanced SSRF Protection** | Blocks cloud metadata endpoints (AWS, GCP, Alibaba), validates port 443 only |
| **Atomic Team Creation** | New RPC function prevents orphaned teams if member insert fails |
| **Type-Safe Scopes** | Runtime `Array.isArray()` check before casting JSON scopes |
| **SSR-Safe Storage** | `typeof window` guard for localStorage in Supabase client |
| **Proxy Trap Coverage** | Added `apply` trap to Supabase client proxy |
| **Database Indexes** | Added composite indexes for analytics queries |
| **AWS Short-Circuit** | Skips wasteful HTTP request for unsupported provider |

---

## Roadmap

- [x] Single key validation with health score
- [x] Bulk key testing (up to 10 keys)
- [x] Secure key vault (last 4 chars only)
- [x] Expiry alerts with configurable reminders
- [x] Team workspaces with invite links
- [x] Analytics dashboard with charts
- [x] PDF export for bulk test reports
- [x] Dark / light mode
- [x] Command palette
- [x] Code consolidation (9 pages -> 5 pages)
- [x] Shared hooks architecture
- [x] Security hardening
- [ ] Email/webhook notifications for expiry alerts
- [ ] REST API for programmatic key validation
- [ ] Stripe subscription integration
- [ ] Rate limiting on edge functions

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Built by Muhammad Tanveer Abbas

SaaS Developer | Production-ready MVPs
Portfolio: https://themvpguy.vercel.app
