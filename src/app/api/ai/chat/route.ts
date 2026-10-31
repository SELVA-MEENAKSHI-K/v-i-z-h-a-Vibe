import { ok, fail, handleError } from "@/lib/api";
import { aiChatSchema } from "@/lib/schemas";
import { getAiProvider, AI_NOT_CONFIGURED_MESSAGE } from "@/lib/ai";
import type { AiContext } from "@/lib/ai";
import { getServerConfig } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { getPlanByIdOrToken } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const config = getServerConfig();
    const ip = clientIp(req.headers);
    const limit = rateLimit(`chat:${ip}`, config.rateLimitPerMinute);
    if (!limit.allowed) return fail("Too many requests. Please slow down.", 429);

    // Require a configured live AI provider — never return fabricated demo replies.
    const provider = getAiProvider();
    if (!provider) return fail(AI_NOT_CONFIGURED_MESSAGE, 503);

    const body = await req.json();
    const input = aiChatSchema.parse(body);

    let ctx: AiContext = {};
    if (input.planId) {
      const plan = await getPlanByIdOrToken(input.planId);
      if (plan) {
        ctx = {
          eventTypeSlug: plan.eventType.slug,
          eventTypeName: plan.eventType.name,
          categoryName: plan.eventType.category.name,
          city: plan.city,
          guestCount: plan.guestCount,
          budget: plan.budget,
          styles: plan.styles ? plan.styles.split(",").filter(Boolean) : [],
          startDate: plan.startDate?.toISOString(),
        };
      }
    }

    const reply = await provider.chat(input.message, ctx, input.history);

    return ok({ reply, provider: provider.name, generated: true });
  } catch (err) {
    return handleError(err);
  }
}
