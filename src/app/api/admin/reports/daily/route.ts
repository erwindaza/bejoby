import { runDailyReportingJob } from "@/lib/agent-fabric";
import { serverError, success } from "@/lib/utils/api-response";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runDailyReportingJob({
      tenantId: body.tenant_id === "aif369" ? "aif369" : "bejoby",
      dryRun: body.dry_run !== false,
      send: body.send === true,
    });

    return success({ result });
  } catch (err) {
    console.error("[POST /api/admin/reports/daily]", err);
    return serverError();
  }
}
