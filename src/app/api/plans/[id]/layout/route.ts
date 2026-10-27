import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { layoutSchema } from "@/lib/schemas";
import { getPlanByIdOrToken, serializePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

// Save (replace) the 3D layout for a plan.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await getPlanByIdOrToken(params.id);
    if (!plan) return fail("Plan not found.", 404);

    const body = await req.json();
    const input = layoutSchema.parse(body);

    const layout = await prisma.venueLayout.upsert({
      where: { planId: plan.id },
      update: { roomWidth: input.roomWidth, roomDepth: input.roomDepth, illustrative: true },
      create: { planId: plan.id, roomWidth: input.roomWidth, roomDepth: input.roomDepth, illustrative: true },
    });

    // Replace objects atomically.
    await prisma.$transaction([
      prisma.placedObject.deleteMany({ where: { layoutId: layout.id } }),
      prisma.placedObject.createMany({
        data: input.objects.map((o) => ({
          layoutId: layout.id,
          kind: o.kind,
          label: o.label ?? null,
          posX: o.posX,
          posY: o.posY,
          posZ: o.posZ,
          rotY: o.rotY,
          scale: o.scale,
          seats: o.seats,
          style: o.style ?? null,
        })),
      }),
    ]);

    const serialized = await serializePlan(plan.id);
    return ok(serialized);
  } catch (err) {
    return handleError(err);
  }
}
