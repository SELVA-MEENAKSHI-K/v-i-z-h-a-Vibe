import { ok, fail, handleError } from "@/lib/api";
import { aiRecommendationSchema } from "@/lib/schemas";
import { getAiProvider } from "@/lib/ai";
import type { AiContext } from "@/lib/ai";
import { getServerConfig } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";
import { getPlanByIdOrToken } from "@/lib/plans";
import { findEventType } from "@/data/catalog";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const config = getServerConfig();
    const ip = clientIp(req.headers);
    const limit = rateLimit(`ai:${ip}`, config.rateLimitPerMinute);
    if (!limit.allowed) return fail("Too many requests. Please slow down.", 429);

    const body = await req.json();
    const input = aiRecommendationSchema.parse(body);

    // Build context from a saved plan if provided, else from inline context.
    let ctx: AiContext = {};
    let planId: string | null = null;
    if (input.planId) {
      const plan = await getPlanByIdOrToken(input.planId);
      if (!plan) return fail("Plan not found.", 404);
      planId = plan.id;
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
    } else if (input.context) {
      const et = input.context.eventTypeSlug ? findEventType(input.context.eventTypeSlug) : null;
      ctx = {
        ...input.context,
        eventTypeName: et?.type.name,
        categoryName: et?.category.name,
      };
    }

    const provider = getAiProvider();
    const result = await provider.recommend(input.kind, ctx);

    // Persist recommendation metadata when tied to a plan (clearly generated).
    if (planId) {
      await prisma.aiRecommendation.create({
        data: {
          planId,
          kind: input.kind,
          provider: result.provider,
          payload: JSON.stringify(result),
          isGenerated: true,
        },
      });
    }

    return ok({ generated: true, provider: result.provider, result });
  } catch (err) {
    return handleError(err);
  }
}
