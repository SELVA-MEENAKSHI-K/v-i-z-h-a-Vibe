import { getServerConfig } from "../config";
import { OpenAiProvider } from "./openaiProvider";
import type { AiProvider } from "./types";

// Returns the configured live AI provider, or null when AI is not configured.
// There is intentionally NO demo fallback: when AI is unconfigured, callers
// must surface a clear setup message rather than silently returning fake data.
export function getAiProvider(): AiProvider | null {
  const config = getServerConfig();
  if (config.aiLive && config.aiProvider === "openai") {
    return new OpenAiProvider();
  }
  return null;
}

// A single source of truth for the "AI not configured" message shown to users.
export const AI_NOT_CONFIGURED_MESSAGE =
  "AI features are not configured. Set AI_PROVIDER=openai and OPENAI_API_KEY in the server environment to enable live AI suggestions.";

export * from "./types";
