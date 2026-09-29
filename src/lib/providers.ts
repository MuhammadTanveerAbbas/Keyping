import {
  getSupabaseProjectRef,
  PROVIDER_CAPABILITIES,
  type ProviderCapability,
  type ProviderId,
} from "../../supabase/functions/_shared/provider-contract.ts";

// Re-exported for the frontend. Only the values the frontend actually consumes
// are re-exported. PROVIDER_IDS, PROVIDER_ICON_NAMES, PROVIDER_AVAILABILITY,
// VALIDATION_CHECKS, and normalizeProviderId stay in the contract module, where
// they either define a type or are used by the Edge Function. Re-exporting them
// here produced a second import path for the same value and nothing imported it
// through this one.
export {
  getProviderCapability,
  isProviderId,
  PROVIDER_CAPABILITIES,
} from "../../supabase/functions/_shared/provider-contract.ts";

export type {
  ApiErrorCode,
  RateLimitInfo,
  StructuredApiError,
  TestApiKeyErrorResponse,
  TestApiKeyRequest,
  TestApiKeyResponse,
  ValidationStatus,
} from "../../supabase/functions/_shared/api-contract.ts";

export type {
  ProviderAvailability,
  ProviderCapability,
  ProviderIconMetadata,
  ProviderIconName,
  ProviderId,
  ValidationCheck,
  ValidationKind,
} from "../../supabase/functions/_shared/provider-contract.ts";

export type Provider = ProviderCapability;
export const PROVIDERS: readonly Provider[] = PROVIDER_CAPABILITIES;

/**
 * Whether a provider can actually be validated right now.
 *
 * A provider marked `planned` has no validator behind it, so offering it in a
 * provider picker only produces a 422 from the Edge Function that looks like a
 * failed key test. Both the single tester and the bulk tester filter on this so
 * the two pickers can never disagree.
 */
export function isProviderSelectable(provider: Provider): boolean {
  return provider.availability !== "planned";
}

/** The providers that should be offered in a provider picker. */
export const SELECTABLE_PROVIDERS: readonly Provider[] = PROVIDERS.filter(isProviderSelectable);

type detectableProvider = Pick<
  ProviderCapability,
  "id" | "detectionPriority" | "keyPatterns"
>;

function normalizeProviderKey(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function matchesPattern(value: string, pattern: RegExp): boolean {
  // The sticky and global flags are stripped so a shared pattern object cannot
  // carry lastIndex state between calls and make a stateless check stateful.
  const flags = pattern.flags.replace(/[gy]/g, "");
  return new RegExp(pattern.source, flags).test(value);
}

function matchesProviderKey(
  provider: detectableProvider,
  value: unknown,
): boolean {
  const key = normalizeProviderKey(value);
  if (!key) return false;
  if (provider.id === "supabase" && getSupabaseProjectRef(key)) return true;
  return provider.keyPatterns.some((pattern) => matchesPattern(key, pattern));
}

function detectProviderFromCandidates(
  candidates: readonly detectableProvider[],
  value: unknown,
): ProviderId | null {
  const key = normalizeProviderKey(value);
  if (!key) return null;

  const ordered = [...candidates].sort(
    (left, right) => left.detectionPriority - right.detectionPriority,
  );

  for (const provider of ordered) {
    if (matchesProviderKey(provider, key)) return provider.id;
  }
  return null;
}

/** Best guess at which provider issued a key. Used only to preselect a picker. */
export function detectProvider(value: unknown): ProviderId | null {
  return detectProviderFromCandidates(PROVIDERS, value);
}
