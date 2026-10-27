// Server-side configuration & integration status. Never import secrets into
// client components — only the NEXT_PUBLIC_* values are safe for the browser.

export function getServerConfig() {
  const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY?.trim() || "";
  const aiProvider = (process.env.AI_PROVIDER?.trim() || "demo").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || "";

  const placesLive = googlePlacesKey.length > 0;
  // AI is "live" only if provider is set to a real provider AND a key exists.
  const aiLive = aiProvider !== "demo" && openaiKey.length > 0;

  return {
    googlePlacesKey,
    placesLive,
    placesCacheHours: Number(process.env.PLACES_CACHE_HOURS || 24),
    aiProvider: aiLive ? aiProvider : "demo",
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
    places: { live: c.placesLive, provider: c.placesLive ? "google" : "sample" },
    ai: { live: c.aiLive, provider: c.aiProvider },
  };
}

export type IntegrationStatus = ReturnType<typeof getIntegrationStatus>;
