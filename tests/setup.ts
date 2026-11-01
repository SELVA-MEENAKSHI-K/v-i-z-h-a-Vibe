// Vitest global setup.
// - Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.).
// - Cleans up the rendered DOM between tests to avoid cross-test leakage.
// Only affects jsdom (component) suites; node suites ignore the DOM cleanup.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
