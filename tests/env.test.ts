import { describe, it, expect } from "vitest";
import { checkEnv } from "@/lib/env";

const base = {
  DATABASE_URL: "file:./dev.db",
  AUTH_SECRET: "a".repeat(40),
} as unknown as NodeJS.ProcessEnv;

describe("environment validation", () => {
  it("passes with a strong AUTH_SECRET and a DATABASE_URL", () => {
    const issues = checkEnv({ ...base, NODE_ENV: "production" } as NodeJS.ProcessEnv);
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
  });

  it("errors in production when AUTH_SECRET is missing", () => {
    const issues = checkEnv({ DATABASE_URL: "file:./dev.db", NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv);
    const secretErr = issues.find((i) => i.key === "AUTH_SECRET");
    expect(secretErr?.level).toBe("error");
  });

  it("only warns in development when AUTH_SECRET is missing", () => {
    const issues = checkEnv({ DATABASE_URL: "file:./dev.db", NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv);
    const secretErr = issues.find((i) => i.key === "AUTH_SECRET");
    expect(secretErr?.level).toBe("warn");
  });

  it("errors in production when AUTH_SECRET is too short", () => {
    const issues = checkEnv({ DATABASE_URL: "file:./dev.db", AUTH_SECRET: "short", NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv);
    const secretErr = issues.find((i) => i.key === "AUTH_SECRET");
    expect(secretErr?.level).toBe("error");
    expect(secretErr?.message).toMatch(/too short/i);
  });

  it("flags the known dev AUTH_SECRET value in production", () => {
    const issues = checkEnv({
      DATABASE_URL: "file:./dev.db",
      AUTH_SECRET: "dev-local-auth-secret-change-in-production-0123456789",
      NODE_ENV: "production",
    } as unknown as NodeJS.ProcessEnv);
    const secretErr = issues.find((i) => i.key === "AUTH_SECRET");
    expect(secretErr?.level).toBe("error");
  });

  it("errors when DATABASE_URL is missing", () => {
    const issues = checkEnv({ AUTH_SECRET: "a".repeat(40) } as unknown as NodeJS.ProcessEnv);
    expect(issues.find((i) => i.key === "DATABASE_URL")?.level).toBe("error");
  });

  it("warns when AI_PROVIDER=openai but no key is set", () => {
    const issues = checkEnv({ ...base, AI_PROVIDER: "openai", NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv);
    expect(issues.find((i) => i.key === "OPENAI_API_KEY")?.level).toBe("warn");
  });
});
