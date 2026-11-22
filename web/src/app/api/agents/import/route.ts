import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createAgent } from "@/lib/server/repo";
import { readJson, withTenant } from "@/lib/server/tenant";
import { agentImport } from "@/lib/server/validation";

/** Traz para a empresa os agentes que estavam guardados só no navegador. */
export const POST = withTenant(async (request, tenant) => {
  const { agents } = await readJson(request, (b) => agentImport.parse(b));
  const db = getDb();
  for (const a of agents) await createAgent(db, tenant.orgId, tenant.userId, a as Parameters<typeof createAgent>[3]);
  return NextResponse.json({ imported: agents.length });
});
