import { describe, it, expect } from "vitest";
import { TimeoutError, withTimeout } from "../../api/_shared/with-timeout";

describe("withTimeout", () => {
  it("resolves with the value when the promise settles in time", async () => {
    await expect(withTimeout(Promise.resolve(42), 100)).resolves.toBe(42);
  });

  it("propagates the original rejection", async () => {
    await expect(
      withTimeout(Promise.reject(new Error("boom")), 100),
    ).rejects.toThrow("boom");
  });

  it("rejects with TimeoutError when the promise never settles", async () => {
    const never = new Promise(() => {});
    await expect(withTimeout(never, 10)).rejects.toBeInstanceOf(TimeoutError);
  });

  it("rejects with a custom message when timed out", async () => {
    const never = new Promise(() => {});
    await expect(withTimeout(never, 10, "supabase unreachable")).rejects.toThrow(
      "supabase unreachable",
    );
  });
});