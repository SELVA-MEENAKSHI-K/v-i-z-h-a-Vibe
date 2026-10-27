import { getServerConfig } from "../config";
import { DemoAiProvider } from "./demoProvider";
import { OpenAiProvider } from "./openaiProvider";
import type { AiProvider } from "./types";

// Factory: returns the configured provider, defaulting to the deterministic
// demo provider when no AI key is set.
export function getAiProvider(): AiProvider {
  const config = getServerConfig();
  if (config.aiLive && config.aiProvider === "openai") {
    return new OpenAiProvider();
  }
  return new DemoAiProvider();
}

export * from "./types";
