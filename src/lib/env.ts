// Startup environment validation.
//
// Fails fast in PRODUCTION when required security-critical configuration is
// missing or weak, so the app never boots in an insecure state (e.g. signing
// sessions with a predictable fallback secret). In development it only warns,
// so the zero-config demo still runs.

const MIN_SECRET_LENGTH = 32;

export type EnvIssue = { key: string; level: "error" | "warn"; message: string };

// Pure checker (testable): returns the list of issues for a given env snapshot.
export function checkEnv(env: NodeJS.ProcessEnv): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const isProd = env.NODE_ENV === "production";

  const authSecret = (env.AUTH_SECRET ?? "").trim();
  if (!authSecret) {
    issues.push({
      key: "AUTH_SECRET",
      level: isProd ? "error" : "warn",
      message: "AUTH_SECRET is not set. Sessions would be signed with an insecure fallback. Set a long random value (e.g. `openssl rand -hex 32`).",
    });
  } else if (authSecret.length < MIN_SECRET_LENGTH) {
    issues.push({
      key: "AUTH_SECRET",
      level: isProd ? "error" : "warn",
      message: `AUTH_SECRET is too short (${authSecret.length} chars). Use at least ${MIN_SECRET_LENGTH} characters.`,
    });
  } else if (authSecret === "dev-local-auth-secret-change-in-production-0123456789") {
    issues.push({
      key: "AUTH_SECRET",
      level: isProd ? "error" : "warn",
      message: "AUTH_SECRET is still the known development value. Set a unique secret in production.",
    });
  }

  // DATABASE_URL is required to reach the database at all.
  if (!(env.DATABASE_URL ?? "").trim()) {
    issues.push({ key: "DATABASE_URL", level: "error", message: "DATABASE_URL is not set." });
  }

  // AI, Places, and email are OPTIONAL — their absence degrades gracefully
  // (AI shows a setup message; Places shows sample/catalog data). We only warn.
  if (!(env.OPENAI_API_KEY ?? "").trim() && (env.AI_PROVIDER ?? "").trim().toLowerCase() === "openai") {
    issues.push({ key: "OPENAI_API_KEY", level: "warn", message: "AI_PROVIDER=openai but OPENAI_API_KEY is empty — AI features will show a setup message." });
  }

  return issues;
}

let validated = false;

// Runs once per process. Throws in production if any error-level issue exists.
export function validateEnvOnce(): void {
  if (validated) return;
  validated = true;

  const issues = checkEnv(process.env);
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");

  for (const w of warns) console.warn(`[env] WARNING ${w.key}: ${w.message}`);

  if (errors.length > 0) {
    const summary = errors.map((e) => `  - ${e.key}: ${e.message}`).join("\n");
    const msg = `[env] Invalid configuration — refusing to start:\n${summary}`;
    if (process.env.NODE_ENV === "production") {
      // Fail fast: never run production with insecure/missing critical config.
      throw new Error(msg);
    }
    // In dev, surface loudly but keep the demo running.
    console.error(msg);
  }
}
