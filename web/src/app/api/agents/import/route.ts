import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recordActivity } from "@/lib/server/activity";
import { createAgent } from "@/lib/server/repo";
import { readJson, withTenant } from "@/lib/server/tenant";
import { agentImport } from "@/lib/server/validation";

/** Traz para a empresa os agentes que estavam guardados só no navegador. */
export const POST = withTenant(async (request, tenant) => {
  const { agents } = await readJson(request, (b) => agentImport.parse(b));
  const db = getDb();
  for (const a of agents) await createAgent(db, tenant.orgId, tenant.userId, a as Parameters<typeof createAgent>[3]);
  if (agents.length > 0) {
    await recordActivity(db, { orgId: tenant.orgId, userId: tenant.userId, action: "agente.importado", targetType: "agente", summary: `${tenant.userName} importou ${agents.length === 1 ? "1 agente" : `${agents.length} agentes`} que estavam no navegador.` });
  }
  return NextResponse.json({ imported: agents.length });
});
