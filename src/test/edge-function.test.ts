import { describe, expect, it, vi } from "vitest";
import { EdgeFunctionError, describeEdgeFunctionError } from "@/lib/edge-function";

// The Supabase client throws at import time when the environment is not
// configured, so it is stubbed before the module under test is loaded.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const { supabase } = await import("@/integrations/supabase/client");
const { invokeTestApiKey } = await import("@/lib/edge-function");
const invoke = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;

/** Builds an error shaped like the one supabase-js returns for a non-2xx. */
function functionsHttpError(status: number, body: unknown) {
  return {
    message: "Edge Function returned a non-2xx status code",
    status,
    context: { json: async () => body },
  };
}

describe("describeEdgeFunctionError", () => {
  it("uses the message from an EdgeFunctionError", () => {
    expect(describeEdgeFunctionError(new EdgeFunctionError("Too many requests"))).toBe(
      "Too many requests",
    );
  });

  // Regression test. This string is all supabase-js exposes on error.message, and
  // it used to be the only thing the interface ever saw.
  it("never surfaces the generic non-2xx string to the user", () => {
    const message = describeEdgeFunctionError(
      new Error("Edge Function returned a non-2xx status code"),
    );
    expect(message).not.toContain("non-2xx");
    expect(message).toBe("The validation service rejected the request. Please try again.");
  });

  it("explains a fetch failure as a network problem", () => {
    expect(describeEdgeFunctionError(new TypeError("Failed to fetch"))).toBe(
      "Network error. Check your connection and try again.",
    );
  });

  it("falls back to a readable message for anything else", () => {
    expect(describeEdgeFunctionError(undefined)).toBe("The validation request failed.");
    expect(describeEdgeFunctionError("")).toBe("The validation request failed.");
    expect(describeEdgeFunctionError("something odd")).toBe("something odd");
  });
});

describe("invokeTestApiKey", () => {
  it("returns the payload on success", async () => {
    invoke.mockResolvedValueOnce({ data: { status: "valid", healthScore: 95 }, error: null });
    await expect(invokeTestApiKey({ provider: "openai", apiKey: "sk-test" })).resolves.toEqual({
      status: "valid",
      healthScore: 95,
    });
  });

  it("calls the deployed function name", async () => {
    invoke.mockResolvedValueOnce({ data: { status: "valid" }, error: null });
    await invokeTestApiKey({ provider: "openai", apiKey: "sk-test" });
    expect(invoke).toHaveBeenCalledWith("test-api-key", {
      body: { provider: "openai", apiKey: "sk-test" },
    });
  });

  // The core fix. The structured error the function builds must reach the caller
  // instead of the fixed generic supabase-js string.
  it("reads the structured error payload from the response body", async () => {
    invoke.mockResolvedValueOnce({
      data: null,
      error: functionsHttpError(429, {
        status: "invalid",
        error: "Too many validation requests. Wait a moment and try again.",
        errorDetails: { code: "RATE_LIMITED", message: "Too many", retryable: true },
      }),
    });

    await expect(invokeTestApiKey({ provider: "openai", apiKey: "sk-test" })).rejects.toMatchObject({
      name: "EdgeFunctionError",
      code: "RATE_LIMITED",
      retryable: true,
      message: "Too many validation requests. Wait a moment and try again.",
    });
  });

  it("preserves the specific code for each failure class", async () => {
    const cases = [
      [401, "AUTHENTICATION_REQUIRED", "Authentication required"],
      [400, "INVALID_PROVIDER", "Unknown provider"],
      [422, "PROVIDER_PLANNED", "AWS validation is planned but not available"],
      [400, "ENDPOINT_REJECTED", "Endpoint URL credentials are not allowed"],
      [502, "DNS_RESOLUTION_FAILED", "Custom endpoint DNS resolution failed"],
      [400, "INVALID_REQUEST", "Custom endpoints must use HTTPS"],
    ] as const;

    for (const [status, code, message] of cases) {
      invoke.mockResolvedValueOnce({
        data: null,
        error: functionsHttpError(status, {
          status: "invalid",
          error: message,
          errorDetails: { code, message, retryable: false },
        }),
      });
      await expect(invokeTestApiKey({ provider: "openai", apiKey: "sk-test" })).rejects.toMatchObject({
        code,
        message,
      });
    }
  });

  it("falls back to errorDetails.message when the legacy string is absent", async () => {
    invoke.mockResolvedValueOnce({
      data: null,
      error: functionsHttpError(500, {
        errorDetails: { code: "NETWORK_ERROR", message: "Provider request failed", retryable: true },
      }),
    });
    await expect(invokeTestApiKey({ provider: "openai", apiKey: "sk-test" })).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "Provider request failed",
      retryable: true,
    });
  });

  it("handles a body that cannot be parsed", async () => {
    invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Edge Function returned a non-2xx status code",
        status: 502,
        context: {
          json: async () => {
            throw new Error("not json");
          },
        },
      },
    });
    await expect(invokeTestApiKey({ provider: "openai", apiKey: "sk-test" })).rejects.toBeInstanceOf(
      EdgeFunctionError,
    );
  });

  it("handles an error with no response context at all", async () => {
    invoke.mockResolvedValueOnce({
      data: null,
      error: { message: "Edge Function returned a non-2xx status code", status: 500 },
    });
    await expect(invokeTestApiKey({ provider: "openai", apiKey: "sk-test" })).rejects.toMatchObject({
      code: "UNKNOWN",
    });
  });

  it("rejects a success response that has no status", async () => {
    invoke.mockResolvedValueOnce({ data: { healthScore: 90 }, error: null });
    await expect(invokeTestApiKey({ provider: "openai", apiKey: "sk-test" })).rejects.toBeInstanceOf(
      EdgeFunctionError,
    );
  });
});
