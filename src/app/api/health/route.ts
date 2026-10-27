import { ok } from "@/lib/api";
import { getIntegrationStatus } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    status: "healthy",
    service: "vizhavibe",
    time: new Date().toISOString(),
    integrations: getIntegrationStatus(),
  });
}
