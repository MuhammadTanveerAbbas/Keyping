export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  BULK: "/dashboard/bulk",
  VAULT: "/dashboard/vault",
  TEAM: "/dashboard/team",
  STATS: "/dashboard/stats",
  HISTORY: "/dashboard/history",
  ALERTS: "/dashboard/alerts",
  SETTINGS: "/dashboard/settings",
  DOCS: "/dashboard/docs",
  PRIVACY: "/privacy",
  TERMS: "/terms",
} as const;

export const PLAN_LIMITS = {
  FREE: {
    maxValidationsPerDay: 50,
    maxProviders: 3,
    hasHistory: false,
  },
  PRO: {
    maxValidationsPerDay: Infinity,
    maxProviders: 11,
    hasHistory: true,
  },
  TEAM: {
    maxValidationsPerDay: Infinity,
    maxProviders: 11,
    hasHistory: true,
  },
} as const;

export const APP_CONFIG = {
  name: "KeyPing",
  description: "Validate, monitor, and manage API keys across 10+ providers in seconds.",
  url: "https://keyping.vercel.app",
  storageKey: "keyping-auth",
  sessionDuration: 60 * 60 * 1000, // 1 hour
} as const;

export const KEY_CLEAR_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const PROVIDER_IDS = {
  OPENAI: "openai",
  GROQ: "groq",
  ANTHROPIC: "anthropic",
  STRIPE: "stripe",
  GITHUB: "github",
  TWITTER: "twitter",
  NOTION: "notion",
  SUPABASE: "supabase",
  AWS: "aws",
  GEMINI: "gemini",
  CUSTOM: "custom",
} as const;
