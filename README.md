# KeyPing

> Ping any API key. Know it works.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

KeyPing is a developer tool that validates API keys across 10+ providers in seconds. Check status, rate limits, permissions, and health  all from one dashboard.

**Demo:** [https://your-demo-link.com](https://your-demo-link.com)

---

## Features

- Multi-provider testing  OpenAI, Gemini, Groq, Anthropic, Stripe, GitHub, Twitter/X, Notion, Supabase, AWS, and custom endpoints
- Health score (0–100) calculated from validity, scopes, rate limits, and latency
- Bulk testing  validate multiple keys at once
- Team workspaces  share results and collaborate
- Test history  full audit trail with search and filtering
- Expiry alerts  set reminders for API key renewals
- Auto-detect  automatic provider detection from key patterns
- Dark/light mode with emerald glassmorphism UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Supabase (PostgreSQL, Edge Functions) |
| Auth | Google OAuth via Supabase Auth |
| State | TanStack React Query |
| Charts | Recharts |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Supabase](https://supabase.com) project

### Clone & Install

```bash
git clone https://github.com/MuhammadTanveerAbbas/Keyping.git
cd keyping
pnpm install
```

### Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |

### Run

```bash
pnpm dev
```

App runs at `http://localhost:8080`.

---

## Folder Structure

```
keyping/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── ui/           # shadcn/ui primitives
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client & types
│   ├── lib/              # Auth context, providers config, utilities
│   └── pages/            # Route-level page components
├── supabase/
│   ├── functions/        # Deno edge functions
│   └── migrations/       # SQL migration files
└── public/               # Static assets
```

---

## Author

**Muhammad Tanveer Abbas**  [themvpguy.vercel.app](https://themvpguy.vercel.app/)

---

## License

[MIT](./LICENSE) © 2025 Muhammad Tanveer Abbas
