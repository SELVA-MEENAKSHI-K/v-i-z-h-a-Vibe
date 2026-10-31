// OpenAI-compatible provider. Only used when AI_PROVIDER = "openai" and a key
// is configured. There is NO demo fallback: if the model call fails, the error
// propagates so the API can return a clear message (we never fabricate data).

import { getServerConfig } from "../config";
import type { AiContext, AiProvider, AiResult } from "./types";

function systemPrompt(): string {
  return [
    "You are VizhaVibe's event-planning assistant for Madurai, Chennai, and Bangalore.",
    "Support Tamil, Kerala, Telugu, Kannada, and North Indian styles respectfully.",
    "NEVER invent real venue names, prices, availability, ratings, or amenities.",
    "Always present costs as indicative ranges with assumptions, never as quotes.",
    "Be concise and practical.",
  ].join(" ");
}

// JSON shape guides per recommendation kind (so the model returns our structure).
function schemaGuide(kind: AiResult["kind"]): object {
  switch (kind) {
    case "theme":
      return {
        themes: [
          { title: "string", palette: ["#hex"], summary: "string", decorHighlights: ["string"], representableIn3D: ["string"] },
        ],
      };
    case "decor":
      return {
        concepts: [{ title: "string", description: "string", representableIn3D: ["string"], notRepresentable: ["string"] }],
      };
    case "menu":
      return {
        menus: [{ style: "string", dietary: "veg|non-veg|both", courses: [{ course: "string", items: ["string"] }], notes: "string" }],
      };
    case "budget":
      return {
        estimate: {
          currency: "INR",
          lines: [{ category: "string", label: "string", quantity: 1, unitCostMin: 0, unitCostMax: 0, assumption: "string" }],
          totalMin: 0,
          totalMax: 0,
          assumptions: ["string"],
        },
      };
    case "timeline":
      return { tasks: [{ title: "string", detail: "string", offsetDays: 0 }] };
    default:
      return {};
  }
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
    throw new Error(`AI provider error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

export class OpenAiProvider implements AiProvider {
  name = "openai";

  async recommend(kind: AiResult["kind"], ctx: AiContext): Promise<AiResult> {
    const content = await callModel(
      [
        { role: "system", content: systemPrompt() },
        {
          role: "user",
          content:
            `Context: ${JSON.stringify(ctx)}.\n` +
            `Return ONLY JSON matching this exact structure (same keys, same types), tailored to the context:\n` +
            JSON.stringify(schemaGuide(kind)),
        },
      ],
      true,
    );
    const parsed = JSON.parse(content) as AiResult;
    // Force correct provenance regardless of model output.
    return { ...parsed, kind, provider: this.name, generated: true } as AiResult;
  }

  async chat(message: string, ctx: AiContext, history?: { role: "user" | "assistant"; content: string }[]): Promise<string> {
    const content = await callModel(
      [
        { role: "system", content: systemPrompt() + ` Current plan context: ${JSON.stringify(ctx)}.` },
        ...(history ?? []),
        { role: "user", content: message },
      ],
      false,
    );
    if (!content) throw new Error("AI provider returned an empty response.");
    return content;
  }
}
