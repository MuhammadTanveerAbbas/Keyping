export const PROVIDER_AVAILABILITY = ["active", "limited", "planned"] as const;
export type ProviderAvailability = (typeof PROVIDER_AVAILABILITY)[number];

export const VALIDATION_CHECKS = [
  "status",
  "rateLimit",
  "scopes",
  "docs",
  "responseTime",
  "healthScore",
] as const;
export type ValidationCheck = (typeof VALIDATION_CHECKS)[number];

export const PROVIDER_IDS = [
  "openai",
  "anthropic",
  "groq",
  "stripe",
  "github",
  "twitter",
  "aws",
  "gemini",
  "supabase",
  "custom",
] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

export const PROVIDER_ICON_NAMES = [
  "openai",
  "anthropic",
  "groq",
  "stripe",
  "github",
  "twitter",
  "aws",
  "gemini",
  "supabase",
  "custom",
] as const;
export type ProviderIconName = (typeof PROVIDER_ICON_NAMES)[number];

export type ValidationKind = "api" | "legacy-api" | "unsupported" | "custom";

export type ProviderIconMetadata = {
  name: ProviderIconName;
  label: string;
  brandColor: string;
  backgroundColor: string;
};

export type ProviderCapability = {
  id: ProviderId;
  name: string;
  docsUrl: string;
  availability: ProviderAvailability;
  supportedChecks: readonly ValidationCheck[];
  validationKind: ValidationKind;
  availabilityNote: string;
  icon: ProviderIconMetadata;
  detectionPriority: number;
  keyPatterns: readonly RegExp[];
};

const FULL_CHECKS = VALIDATION_CHECKS;
const API_CHECKS = [
  "status",
  "rateLimit",
  "docs",
  "responseTime",
  "healthScore",
] as const;
const STATUS_CHECKS = ["status", "docs"] as const;
const STATUS_AND_HEALTH_CHECKS = [
  "status",
  "docs",
  "responseTime",
  "healthScore",
] as const;

export const PROVIDER_CAPABILITIES = [
  {
    id: "openai",
    name: "OpenAI",
    docsUrl: "https://platform.openai.com/docs/api-reference/authentication",
    availability: "active",
    supportedChecks: API_CHECKS,
    validationKind: "api",
    availabilityNote: "Validates against the OpenAI models endpoint.",
    icon: {
      name: "openai",
      label: "OpenAI",
      brandColor: "#10A37F",
      backgroundColor: "#ECFDF5",
    },
    detectionPriority: 30,
    keyPatterns: [/^sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]+$/],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    docsUrl: "https://docs.anthropic.com/en/api/getting-started",
    availability: "active",
    supportedChecks: API_CHECKS,
    validationKind: "api",
    availabilityNote: "Validates against the Anthropic models endpoint.",
    icon: {
      name: "anthropic",
      label: "Anthropic",
      brandColor: "#C96442",
      backgroundColor: "#FDF6F3",
    },
    detectionPriority: 10,
    keyPatterns: [/^sk-ant-[A-Za-z0-9_-]+$/],
  },
  {
    id: "groq",
    name: "Groq",
    docsUrl: "https://console.groq.com/docs/api-keys",
    availability: "active",
    supportedChecks: API_CHECKS,
    validationKind: "api",
    availabilityNote: "Validates against the Groq models endpoint.",
    icon: {
      name: "groq",
      label: "Groq",
      brandColor: "#F55036",
      backgroundColor: "#FFF4F2",
    },
    detectionPriority: 40,
    keyPatterns: [/^gsk_[A-Za-z0-9_-]+$/],
  },
  {
    id: "stripe",
    name: "Stripe",
    docsUrl: "https://docs.stripe.com/keys",
    availability: "active",
    supportedChecks: STATUS_AND_HEALTH_CHECKS,
    validationKind: "api",
    availabilityNote: "Validates by reading the Stripe account balance.",
    icon: {
      name: "stripe",
      label: "Stripe",
      brandColor: "#635BFF",
      backgroundColor: "#F5F4FF",
    },
    detectionPriority: 20,
    keyPatterns: [/^(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+$/],
  },
  {
    id: "github",
    name: "GitHub",
    docsUrl:
      "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
    availability: "active",
    supportedChecks: FULL_CHECKS,
    validationKind: "api",
    availabilityNote:
      "Validates a token and returns OAuth scopes and rate limits when available.",
    icon: {
      name: "github",
      label: "GitHub",
      brandColor: "#24292F",
      backgroundColor: "#F6F8FA",
    },
    detectionPriority: 50,
    keyPatterns: [
      /^gh[pousr]_[A-Za-z0-9_]+$/,
      /^github_pat_[A-Za-z0-9_]+$/,
    ],
  },
  {
    id: "twitter",
    name: "Twitter / X",
    docsUrl: "https://developer.x.com/en/docs/authentication",
    availability: "active",
    supportedChecks: API_CHECKS,
    validationKind: "api",
    availabilityNote:
      "Validates OAuth bearer tokens against the current user endpoint.",
    icon: {
      name: "twitter",
      label: "X",
      brandColor: "#000000",
      backgroundColor: "#F7F7F7",
    },
    detectionPriority: 100,
    keyPatterns: [/^A{10,}[A-Za-z0-9%_-]+$/],
  },
  {
    id: "gemini",
    name: "Gemini",
    docsUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    availability: "active",
    supportedChecks: API_CHECKS,
    validationKind: "api",
    availabilityNote:
      "Validates through the Gemini models endpoint using the x-goog-api-key header.",
    icon: {
      name: "gemini",
      label: "Gemini",
      brandColor: "#4285F4",
      backgroundColor: "#EFF6FF",
    },
    detectionPriority: 70,
    keyPatterns: [/^AIza[0-9A-Za-z_-]{35}$/],
  },
  {
    id: "supabase",
    name: "Supabase",
    docsUrl: "https://supabase.com/docs/guides/api/api-keys",
    availability: "limited",
    supportedChecks: STATUS_CHECKS,
    validationKind: "legacy-api",
    availabilityNote:
      "Legacy JWT keys can be validated using their project ref. Publishable and secret keys require a project URL and must use a custom endpoint.",
    icon: {
      name: "supabase",
      label: "Supabase",
      brandColor: "#3ECF8E",
      backgroundColor: "#ECFDF5",
    },
    detectionPriority: 60,
    keyPatterns: [/^sb_(?:publishable|secret)_[A-Za-z0-9_-]+$/],
  },
  {
    id: "aws",
    name: "AWS",
    docsUrl:
      "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html",
    availability: "limited",
    supportedChecks: STATUS_CHECKS,
    validationKind: "unsupported",
    availabilityNote:
      "AWS access keys cannot be validated safely without a SigV4-signed STS request.",
    icon: {
      name: "aws",
      label: "AWS",
      brandColor: "#FF9900",
      backgroundColor: "#FFFBEB",
    },
    detectionPriority: 80,
    keyPatterns: [/^(?:AKIA|ASIA)[A-Z0-9]{16}$/],
  },
  {
    id: "custom",
    name: "Custom",
    docsUrl: "",
    availability: "active",
    supportedChecks: STATUS_AND_HEALTH_CHECKS,
    validationKind: "custom",
    availabilityNote:
      "Uses a public HTTPS endpoint with DNS pinning and redirect blocking.",
    icon: {
      name: "custom",
      label: "Custom endpoint",
      brandColor: "#475569",
      backgroundColor: "#F8FAFC",
    },
    detectionPriority: 1000,
    keyPatterns: [],
  },
] as const satisfies readonly ProviderCapability[];

const providerById = new Map<ProviderId, ProviderCapability>(
  PROVIDER_CAPABILITIES.map((provider) => [provider.id, provider]),
);

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && providerById.has(value as ProviderId);
}

export function normalizeProviderId(value: string): ProviderId | null {
  const normalized = value.trim().toLowerCase();
  return isProviderId(normalized) ? normalized : null;
}

export function getProviderCapability(
  id: string,
): ProviderCapability | undefined {
  return providerById.get(id.trim().toLowerCase() as ProviderId);
}

const SUPABASE_LEGACY_ROLES = new Set([
  "anon",
  "authenticated",
  "service_role",
]);

export function getSupabaseProjectRef(value: unknown): string | null {
  const key = typeof value === "string" ? value.trim() : "";
  const parts = key.split(".");
  if (parts.length !== 3 || !parts[1] || parts[1].length > 2048) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0),
    );
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Record<
      string,
      unknown
    >;

    if (payload.iss !== "supabase" || typeof payload.role !== "string") {
      return null;
    }
    if (!SUPABASE_LEGACY_ROLES.has(payload.role)) return null;
    if (typeof payload.ref !== "string") return null;

    const projectRef = payload.ref.toLowerCase();
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(projectRef)
      ? projectRef
      : null;
  } catch {
    return null;
  }
}
