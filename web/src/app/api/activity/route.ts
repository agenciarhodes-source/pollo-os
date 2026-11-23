import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ACTIVITY_TYPES, listActivity, type ActivityTarget } from "@/lib/server/activity";
import { withTenant } from "@/lib/server/tenant";

/** A atividade da empresa que a pessoa pode ver. ?tipo= filtra; ?antes= pagina. */
export const GET = withTenant(async (request, tenant) => {
  const params = new URL(request.url).searchParams;
  const tipo = params.get("tipo");
  const type = ACTIVITY_TYPES.some((t) => t.id === tipo) ? (tipo as ActivityTarget) : undefined;
  const antes = params.get("antes");
  const before = antes && !Number.isNaN(Date.parse(antes)) ? new Date(antes) : undefined;
  return NextResponse.json(await listActivity(getDb(), tenant.orgId, tenant.userId, { type, before }));
});
