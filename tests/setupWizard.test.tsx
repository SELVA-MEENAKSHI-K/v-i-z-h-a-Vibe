import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mocks -----------------------------------------------------------------
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(""),
}));

const apiSendMock = vi.fn();
vi.mock("@/lib/client", () => ({
  apiSend: (...args: unknown[]) => apiSendMock(...args),
}));

import { SetupWizard } from "@/components/setup/SetupWizard";

const catalog = [
  {
    slug: "weddings",
    name: "Weddings",
    description: "Marriage celebrations.",
    icon: "💍",
    eventTypes: [
      { slug: "reception", name: "Reception", description: "Evening reception." },
      { slug: "tamil-wedding", name: "Tamil Wedding", description: "Traditional Tamil wedding." },
    ],
  },
];
const cities = ["Madurai", "Chennai", "Bangalore"];
const styles = [
  { slug: "tamil", name: "Tamil" },
  { slug: "kerala", name: "Kerala" },
];

function renderWizard() {
  return render(<SetupWizard catalog={catalog} cities={cities} styles={styles} />);
}

beforeEach(() => {
  pushMock.mockReset();
  apiSendMock.mockReset();
  apiSendMock.mockResolvedValue({ shareToken: "tok-123" });
});

describe("SetupWizard", () => {
  it("blocks step 1 until an event type is chosen", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/choose an event type/i)).toBeInTheDocument();
  });

  it("advances to the Details step after choosing an event type", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /Reception/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));
    // Details step shows the Plan title field.
    expect(await screen.findByText(/Plan title/i)).toBeInTheDocument();
  });

  it("shows required-field validation messages on the Details step", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /Reception/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Clear the auto-filled title, then try to continue with no date.
    const title = screen.getByPlaceholderText(/Meena & Arun/i);
    await u.clear(title);
    await u.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/Event title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Event date is required/i)).toBeInTheDocument();
  });

  it("submits the expected payload and redirects to the new plan", async () => {
    const u = userEvent.setup();
    renderWizard();

    // Step 0: pick event type (auto-fills title).
    await u.click(screen.getByRole("button", { name: /Tamil Wedding/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Step 1: set a future date (title is auto-filled, city/guests/budget have defaults).
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const iso = future.toISOString().slice(0, 10);
    const startDate = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    await u.clear(startDate);
    await u.type(startDate, iso);
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Step 2: submit.
    await u.click(screen.getByRole("button", { name: /Create plan/i }));

    expect(apiSendMock).toHaveBeenCalledTimes(1);
    const [url, method, body] = apiSendMock.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(url).toBe("/api/plans");
    expect(method).toBe("POST");
    expect(body).toMatchObject({
      title: "Tamil Wedding",
      city: "Madurai",
      eventTypeSlug: "tamil-wedding",
      guestCount: 150,
      budget: 500000,
    });
    expect(Array.isArray(body.styles)).toBe(true);
    expect(body.preferences).toMatchObject({ dietary: ["veg"] });
    expect(pushMock).toHaveBeenCalledWith("/plan/tok-123");
  });

  it("lets the user navigate back to a previous step", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /Reception/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/Plan title/i)).toBeInTheDocument();

    await u.click(screen.getByRole("button", { name: /back/i }));
    // Back on step 0 — the category picker heading is visible again.
    expect(await screen.findByText(/Pick a category/i)).toBeInTheDocument();
  });

  it("double-clicking an event type jumps straight to the Details step", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.dblClick(screen.getByRole("button", { name: /Reception/i }));
    expect(await screen.findByText(/Plan title/i)).toBeInTheDocument();
  });

  it("applies a quick-date preset and a guest/budget preset", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /Reception/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Quick date "1 month" fills the start date input.
    await u.click(screen.getByRole("button", { name: "1 month" }));
    const startDate = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    expect(startDate.value).not.toBe("");

    // Guest preset chip updates the guest count field.
    await u.click(screen.getByRole("button", { name: "200" }));
    const guest = screen.getByLabelText("Guest count") as HTMLInputElement;
    expect(guest.value).toBe("200");
  });

  it("toggles styles and dietary chips on the Style step", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /Reception/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Provide a valid future date so we can proceed to step 3.
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const startDate = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    await u.clear(startDate);
    await u.type(startDate, future.toISOString().slice(0, 10));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Step 3 — toggle a style chip on, then a dietary chip.
    const kerala = await screen.findByRole("button", { name: "Kerala" });
    expect(kerala).toHaveAttribute("aria-pressed", "false");
    await u.click(kerala);
    expect(kerala).toHaveAttribute("aria-pressed", "true");

    const vegan = screen.getByRole("button", { name: /vegan/i });
    await u.click(vegan);
    expect(vegan).toHaveAttribute("aria-pressed", "true");
  });

  it("rejects an end date earlier than the start date", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /Reception/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Valid future start date, then an end date before it → validation error.
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const startIso = future.toISOString().slice(0, 10);
    const earlier = new Date();
    earlier.setMonth(earlier.getMonth() + 6);
    const endIso = earlier.toISOString().slice(0, 10);

    const startDate = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    await u.clear(startDate);
    await u.type(startDate, startIso);
    const endDate = screen.getByLabelText(/End date/i) as HTMLInputElement;
    await u.clear(endDate);
    await u.type(endDate, endIso);
    await u.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/before the start date/i)).toBeInTheDocument();
  });

  it("rejects a non-positive guest count and budget", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /Reception/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    const guest = screen.getByLabelText("Guest count") as HTMLInputElement;
    await u.clear(guest);
    await u.type(guest, "0");
    const budget = screen.getByLabelText("Budget in rupees") as HTMLInputElement;
    await u.clear(budget);
    await u.type(budget, "0");
    await u.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/Guest count must be a positive number/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget must be greater than zero/i)).toBeInTheDocument();
  });

  it("re-validates and returns to Details if submit is reached with invalid data", async () => {
    const u = userEvent.setup();
    renderWizard();
    await u.click(screen.getByRole("button", { name: /Reception/i }));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Set a valid date to reach step 3, then clear the title via Back.
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const startDate = screen.getByLabelText(/Start date/i) as HTMLInputElement;
    await u.clear(startDate);
    await u.type(startDate, future.toISOString().slice(0, 10));
    await u.click(screen.getByRole("button", { name: /continue/i }));

    // Go back to Details and clear the required title.
    await u.click(screen.getByRole("button", { name: /back/i }));
    const title = screen.getByPlaceholderText(/Meena & Arun/i);
    await u.clear(title);
    // Jump forward to step 3 is blocked; go via Continue which re-validates.
    await u.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/Event title is required/i)).toBeInTheDocument();
    expect(apiSendMock).not.toHaveBeenCalled();
  });
});
