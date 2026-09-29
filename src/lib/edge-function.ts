import type { ApiErrorCode } from "../../supabase/functions/_shared/api-contract.ts";
import { supabase } from "@/integrations/supabase/client";
import type {
  TestApiKeyRequest,
  TestApiKeyResponse,
} from "../../supabase/functions/_shared/api-contract.ts";

export const TEST_API_KEY_FUNCTION = "test-api-key";

/**
 * A failure returned by the test-api-key Edge Function.
 *
 * `supabase.functions.invoke` sets `error` for any non-2xx response, but the
 * `message` on that error is the fixed string "Edge Function returned a non-2xx
 * status code". The structured payload the function actually builds, including
 * the specific error code and whether a retry could help, is only available on
 * the response body. Reading `message` alone is what made every failure look
 * identical to the user.
 */
export class EdgeFunctionError extends Error {
  readonly code: ApiErrorCode | "UNKNOWN";
  readonly retryable: boolean;
  readonly status?: number;

  constructor(
    message: string,
    options: { code?: ApiErrorCode | "UNKNOWN"; retryable?: boolean; status?: number } = {},
  ) {
    super(message);
    this.name = "EdgeFunctionError";
    this.code = options.code ?? "UNKNOWN";
    this.retryable = options.retryable ?? false;
    this.status = options.status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asErrorCode(value: unknown): ApiErrorCode | "UNKNOWN" {
  return typeof value === "string" && value.length > 0
    ? (value as ApiErrorCode)
    : "UNKNOWN";
}

/**
 * Turns the Edge Function error into a readable message.
 *
 * The function already produces a sentence that is safe to show a user, so it
 * is preferred over anything reconstructed here. Only when the payload cannot
 * be read does this fall back to explaining the status code, and it never
 * echoes a raw JSON envelope into the interface.
 */
export function describeEdgeFunctionError(error: unknown): string {
  if (error instanceof EdgeFunctionError) return error.message;
  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
      return "Network error. Check your connection and try again.";
    }
    if (lower.includes("non-2xx") || lower.includes("status code")) {
      return "The validation service rejected the request. Please try again.";
    }
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "The validation request failed.";
}

async function readErrorPayload(
  error: unknown,
): Promise<{ message: string; code: ApiErrorCode | "UNKNOWN"; retryable: boolean } | null> {
  if (!isRecord(error)) return null;
  const context = error.context;
  if (!context || typeof (context as { json?: unknown }).json !== "function") return null;

  let payload: unknown;
  try {
    payload = await (context as { json: () => Promise<unknown> }).json();
  } catch {
    // A body that is not JSON, or an already consumed response. The status code
    // fallback below still gives the user something accurate.
    return null;
  }

  if (!isRecord(payload)) return null;
  const details = isRecord(payload.errorDetails) ? payload.errorDetails : undefined;
  const message = typeof payload.error === "string" && payload.error.trim().length > 0
    ? payload.error
    : details && typeof details.message === "string"
    ? details.message
    : "";
  if (message.length === 0) return null;

  return {
    message,
    code: asErrorCode(details?.code),
    retryable: details?.retryable === true,
  };
}

/**
 * Calls the test-api-key Edge Function and returns a validated result.
 *
 * Every call site used to call `supabase.functions.invoke` directly and
 * surface `error.message`, which discarded the error code the function had
 * already computed. Routing all three testers through this one function means
 * the payload is parsed in a single place and a future contract change only
 * has to be handled once.
 */
export async function invokeTestApiKey(
  body: TestApiKeyRequest,
): Promise<TestApiKeyResponse> {
  const { data, error } = await supabase.functions.invoke(TEST_API_KEY_FUNCTION, { body });

  if (error) {
    const payload = await readErrorPayload(error);
    if (payload) {
      throw new EdgeFunctionError(payload.message, {
        code: payload.code,
        retryable: payload.retryable,
      });
    }
    const status = isRecord(error) && typeof error.status === "number" ? error.status : undefined;
    throw new EdgeFunctionError(describeEdgeFunctionError(error), {
      code: "UNKNOWN",
      retryable: false,
      status,
    });
  }

  if (!isRecord(data) || typeof data.status !== "string") {
    throw new EdgeFunctionError("The validation service returned an unreadable response.", {
      code: "UNKNOWN",
    });
  }

  return data as unknown as TestApiKeyResponse;
}
