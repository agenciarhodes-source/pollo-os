import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listAppAccess, setAppAccess } from "@/lib/server/repo";
import { HttpError, readJson, withTenant } from "@/lib/server/tenant";
import { appAccessInput } from "@/lib/server/validation";

export const GET = withTenant(async (_request, tenant) => {
  return NextResponse.json({ access: await listAppAccess(getDb(), tenant.orgId) });
});

export const PUT = withTenant(async (request, tenant) => {
  if (tenant.role === "member") throw new HttpError(403, "Só donos e administradores da empresa mudam acessos.");
  const { appId, agentId, allowed } = await readJson(request, (b) => appAccessInput.parse(b));
  const ok = await setAppAccess(getDb(), tenant.orgId, tenant.userId, appId, agentId, allowed);
  if (!ok) throw new HttpError(404, "Este agente não existe nesta empresa.");
  return new Response(null, { status: 204 });
});
