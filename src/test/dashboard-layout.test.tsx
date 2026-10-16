import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn(async () => {});

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "tester@example.com", user_metadata: { full_name: "Test User" } },
    signOut,
    session: null,
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    resetPassword: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ count: 3, error: null }) }),
    }),
  },
}));

vi.mock("@/lib/data-events", () => ({ onDataChanged: () => () => {} }));

// jsdom has no ResizeObserver, which the Radix dialog and the cmdk palette
// both reach for while measuring.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { default: DashboardLayout } = await import("@/components/DashboardLayout");

function LocationProbe({ onChange }: { onChange: (pathname: string) => void }) {
  const location = useLocation();
  onChange(location.pathname);
  return null;
}

let container: HTMLDivElement;
let root: Root;
let paths: string[] = [];

beforeEach(() => {
  signOut.mockClear();
  signOut.mockImplementation(async () => {});
  paths = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderLayout() {
  await act(async () => {
    root.render(
      <StrictMode>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <LocationProbe onChange={(pathname) => { paths.push(pathname); }} />
          <Routes>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<p>Dashboard body</p>} />
            </Route>
            <Route path="/" element={<p>Landing page</p>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    );
  });
}

describe("DashboardLayout sign out", () => {
  // The sidebar is hidden below the large breakpoint, so the header has to
  // carry its own sign out entry point. This guards that.
  it("offers an account control outside the desktop sidebar", async () => {
    await renderLayout();

    const trigger = container.querySelector<HTMLButtonElement>('[aria-label="Account and sign out"]');
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("aria-haspopup")).toBe("dialog");

    const aside = container.querySelector("aside");
    expect(aside?.contains(trigger as Node)).toBe(false);
  });

  it("opens an account dialog that can sign out and leaves the dashboard", async () => {
    await renderLayout();

    const trigger = container.querySelector<HTMLButtonElement>('[aria-label="Account and sign out"]') as HTMLButtonElement;
    act(() => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain("tester@example.com");

    const signOutButton = Array.from(dialog?.querySelectorAll("button") ?? []).find(
      (button) => button.textContent?.trim() === "Sign out",
    );
    expect(signOutButton).toBeDefined();

    await act(async () => {
      (signOutButton as HTMLButtonElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(paths.at(-1)).toBe("/");
  });

  it("keeps the dialog open and reports the failure when sign out fails", async () => {
    signOut.mockImplementation(async () => {
      throw new Error("network down");
    });
    await renderLayout();

    const trigger = container.querySelector<HTMLButtonElement>('[aria-label="Account and sign out"]') as HTMLButtonElement;
    act(() => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const signOutButton = Array.from(dialog.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Sign out",
    ) as HTMLButtonElement;

    await act(async () => {
      signOutButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(paths.at(-1)).toBe("/dashboard");
  });

  it("ignores a second click while the first sign out is still running", async () => {
    let release: () => void = () => {};
    signOut.mockImplementation(() => new Promise<void>((resolve) => { release = resolve; }));
    await renderLayout();

    const trigger = container.querySelector<HTMLButtonElement>('[aria-label="Account and sign out"]') as HTMLButtonElement;
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const dialogSignOut = Array.from(dialog.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Sign out",
    ) as HTMLButtonElement;

    await act(async () => {
      dialogSignOut.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      dialogSignOut.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(signOut).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
    });
  });

  it("unlocks the sidebar sign out button after the dialog closes mid request", async () => {
    let release: () => void = () => {};
    signOut.mockImplementation(() => new Promise<void>((resolve) => { release = resolve; }));
    await renderLayout();

    const trigger = container.querySelector<HTMLButtonElement>('[aria-label="Account and sign out"]') as HTMLButtonElement;
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const dialogSignOut = Array.from(dialog.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Sign out",
    ) as HTMLButtonElement;

    await act(async () => {
      dialogSignOut.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Dismissing the dialog while the request runs used to leave the sidebar
    // button stuck on "Signing out..." for the rest of the session.
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    const sidebarSignOut = Array.from(container.querySelectorAll("aside button")).find((button) =>
      button.textContent?.includes("Sign out"),
    ) as HTMLButtonElement;

    expect(sidebarSignOut.disabled).toBe(false);
    expect(sidebarSignOut.textContent?.trim()).toBe("Sign out");

    await act(async () => {
      release();
    });
  });
});