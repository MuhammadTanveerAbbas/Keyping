import { describe, expect, it } from "vitest";
import {
  PROVIDERS,
  SELECTABLE_PROVIDERS,
  detectProvider,
  isProviderSelectable,
} from "@/lib/providers";

describe("provider registry", () => {
  it("keeps provider ids unique", () => {
    const ids = PROVIDERS.map((provider) => provider.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the custom endpoint option", () => {
    expect(PROVIDERS.some((provider) => provider.id === "custom")).toBe(true);
  });

  it("detects Anthropic keys before generic OpenAI keys", () => {
    expect(detectProvider("sk-ant-api03-example-secret")).toBe("anthropic");
  });

  it("detects common provider key prefixes", () => {
    expect(detectProvider("sk-proj-example")).toBe("openai");
    expect(detectProvider("gsk_example")).toBe("groq");
    expect(detectProvider("ghp_example")).toBe("github");
    expect(detectProvider(`AIza${"0".repeat(35)}`)).toBe("gemini");
  });

  it("returns null for an unknown key", () => {
    expect(detectProvider("not-a-provider-key")).toBeNull();
  });

  it("is not made stateful by repeated calls", () => {
    // The detection patterns are shared module level RegExp objects, so a
    // sticky or global flag left on them would make a second identical call
    // disagree with the first.
    const key = "sk-proj-example";
    expect(detectProvider(key)).toBe("openai");
    expect(detectProvider(key)).toBe("openai");
    expect(detectProvider(key)).toBe("openai");
  });
});

describe("isProviderSelectable", () => {
  it("excludes a provider that has no validator yet", () => {
    // Exercised with a synthetic provider because no provider in the current
    // registry is marked planned. The state exists in the shared contract, so
    // the filter is forward looking rather than speculative: a future provider
    // marked planned must be hidden from the pickers automatically.
    const planned = { ...PROVIDERS[0]!, availability: "planned" as const };
    expect(isProviderSelectable(planned)).toBe(false);
  });

  it("keeps every provider in the current registry", () => {
    // Every registered provider is either active or limited, and both are
    // selectable, so the filter changes nothing today. The important property
    // is that both pickers read the same list, so they cannot disagree.
    for (const provider of PROVIDERS) {
      expect(isProviderSelectable(provider)).toBe(true);
    }
    expect(SELECTABLE_PROVIDERS).toHaveLength(PROVIDERS.length);
  });

  it("never lists a planned provider", () => {
    expect(SELECTABLE_PROVIDERS.some((provider) => provider.availability === "planned")).toBe(
      false,
    );
  });

  it("still offers the custom endpoint option", () => {
    expect(SELECTABLE_PROVIDERS.some((provider) => provider.id === "custom")).toBe(true);
  });
});
