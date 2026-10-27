// OpenAI-compatible provider. Only used when AI_PROVIDER != "demo" and a key is
// configured. Falls back to the demo provider's structured shapes if the model
// returns unparseable JSON, so the product never breaks.

import { getServerConfig } from "../config";
import { DemoAiProvider } from "./demoProvider";
import type { AiContext, AiProvider, AiResult } from "./types";

const demo = new DemoAiProvider();

function systemPrompt(): string {
  return [
    "You are VizhaVibe's event-planning assistant for Madurai, Chennai, and Bangalore.",
    "Support Tamil, Kerala, Telugu, Kannada, and North Indian styles respectfully.",
    "NEVER invent real venue names, prices, availability, ratings, or amenities.",
    "Always present costs as indicative ranges with assumptions, never as quotes.",
    "Be concise and practical.",
  ].join(" ");
}

async function callModel(messages: { role: string; content: string }[], jsonMode: boolean): Promise<string> {
  const config = getServerConfig();
  const res = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel,
      messages,
      temperature: 0.7,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

export class OpenAiProvider implements AiProvider {
  name = "openai";

  async recommend(kind: AiResult["kind"], ctx: AiContext): Promise<AiResult> {
    // Ask the model to fill the exact JSON shape; validate by reusing the demo
    // shape as a schema guide. On any failure, degrade gracefully to demo.
    try {
      const guide = await demo.recommend(kind, ctx);
      const content = await callModel(
        [
          { role: "system", content: systemPrompt() },
          {
            role: "user",
            content:
              `Context: ${JSON.stringify(ctx)}.\n` +
              `Return ONLY JSON matching this exact structure (same keys, same types), tailored to the context:\n` +
              JSON.stringify(guide),
          },
        ],
        true,
      );
      const parsed = JSON.parse(content) as AiResult;
      // Force correct provenance regardless of model output.
      return { ...parsed, kind, provider: this.name, generated: true } as AiResult;
    } catch (err) {
      console.error("[ai] openai recommend failed, using demo fallback:", err);
      const fallback = await demo.recommend(kind, ctx);
      return { ...fallback, provider: `demo-fallback` } as AiResult;
    }
  }

  async chat(message: string, ctx: AiContext, history?: { role: "user" | "assistant"; content: string }[]): Promise<string> {
    try {
      const content = await callModel(
        [
          { role: "system", content: systemPrompt() + ` Current plan context: ${JSON.stringify(ctx)}.` },
          ...(history ?? []),
          { role: "user", content: message },
        ],
        false,
      );
      return content || (await demo.chat(message, ctx));
    } catch (err) {
      console.error("[ai] openai chat failed, using demo fallback:", err);
      return await demo.chat(message, ctx);
    }
  }
}
