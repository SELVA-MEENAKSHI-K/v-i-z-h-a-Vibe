// Server-side configuration & integration status. Never import secrets into
// client components — only the NEXT_PUBLIC_* values are safe for the browser.

import { validateEnvOnce } from "./env";

export function getServerConfig() {
  // Validate critical env on first server use (fails fast in production).
  validateEnvOnce();

  // Venue discovery now uses the Geoapify Places API (server-side key).
  const geoapifyKey = process.env.GEOAPIFY_API_KEY?.trim() || "";
  const aiProvider = (process.env.AI_PROVIDER?.trim() || "none").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || "";

  const placesLive = geoapifyKey.length > 0;
  // AI is "live" only when a real provider is selected AND a key exists. There
  // is no demo fallback — unconfigured AI yields a setup message, not fake data.
  const aiLive = aiProvider === "openai" && openaiKey.length > 0;

  return {
    geoapifyKey,
    placesProvider: "geoapify" as const,
    placesLive,
    placesCacheHours: Number(process.env.PLACES_CACHE_HOURS || 24),
    aiProvider: aiLive ? aiProvider : "none",
    aiLive,
    openaiKey,
    openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    openaiBaseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
    rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE || 30),
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
  };
}

// Safe status object for returning to the client (no secret values).
export function getIntegrationStatus() {
  const c = getServerConfig();
  return {
    places: { live: c.placesLive, provider: c.placesLive ? "geoapify" : "sample" },
    ai: { live: c.aiLive, provider: c.aiProvider },
  };
}

export type IntegrationStatus = ReturnType<typeof getIntegrationStatus>;
