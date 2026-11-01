import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuthUser } from "@/lib/useAuth";

// Mock next/navigation (Header calls useRouter).
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock the auth hook so we can drive logged-in / logged-out / admin states.
const authState: { user: AuthUser | null; isAdmin: boolean } = { user: null, isAdmin: false };
const logoutMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    isAdmin: authState.isAdmin,
    loading: false,
    refresh: vi.fn(),
    logout: logoutMock,
  }),
}));

// ConfigStatus fetches on mount; stub it to a no-op element.
vi.mock("@/components/ui/ConfigStatus", () => ({ ConfigStatus: () => null }));

import { Header } from "@/components/ui/Header";

const user: AuthUser = {
  id: "u1",
  name: "Meena",
  email: "meena@example.com",
  phone: null,
  role: "USER",
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  authState.user = null;
  authState.isAdmin = false;
  logoutMock.mockClear();
});

describe("Header", () => {
  it("shows Login and Sign Up when logged out, and no account links", () => {
    render(<Header />);
    expect(screen.getAllByText("Login").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sign Up").length).toBeGreaterThan(0);
    expect(screen.queryByText("My Plans")).toBeNull();
    expect(screen.queryByText("Logout")).toBeNull();
  });

  it("shows account links and Logout when logged in", () => {
    authState.user = user;
    render(<Header />);
    expect(screen.getAllByText("My Plans").length).toBeGreaterThan(0);
    expect(screen.getAllByText("My Profile").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Logout").length).toBeGreaterThan(0);
    // Logged-in users don't see Login/Sign Up.
    expect(screen.queryByText("Sign Up")).toBeNull();
  });

  it("shows the Admin button only for admins", () => {
    authState.user = { ...user, role: "ADMIN" };
    authState.isAdmin = true;
    render(<Header />);
    const adminLinks = screen.getAllByRole("link", { name: /admin/i });
    expect(adminLinks.length).toBeGreaterThan(0);
    expect(adminLinks[0]).toHaveAttribute("href", "/admin");
  });

  it("hides the Admin button for a normal user", () => {
    authState.user = user;
    authState.isAdmin = false;
    render(<Header />);
    expect(screen.queryByRole("link", { name: /^🛡️ admin$/i })).toBeNull();
  });

  it("toggles the mobile menu open and closed", async () => {
    const u = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /open menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await u.click(toggle);
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("invokes logout when the Logout button is clicked", async () => {
    authState.user = user;
    const u = userEvent.setup();
    render(<Header />);
    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    await u.click(logoutButtons[0]);
    expect(logoutMock).toHaveBeenCalled();
  });

  it("renders mobile Login/Sign Up links in the open mobile panel when logged out", async () => {
    const u = userEvent.setup();
    render(<Header />);
    await u.click(screen.getByRole("button", { name: /open menu/i }));
    // Both desktop and mobile copies now exist.
    expect(screen.getAllByRole("link", { name: "Login" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: "Sign Up" }).length).toBeGreaterThanOrEqual(2);
  });

  it("invokes logout from the mobile panel when logged in", async () => {
    authState.user = user;
    const u = userEvent.setup();
    render(<Header />);
    await u.click(screen.getByRole("button", { name: /open menu/i }));
    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    // Click the last (mobile panel) logout button.
    await u.click(logoutButtons[logoutButtons.length - 1]);
    expect(logoutMock).toHaveBeenCalled();
  });
});
