import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { aiEnabled, monthUsage, monthlyLimitMicros } from "@/lib/server/ai";
import { listAgents } from "@/lib/server/repo";
import { withTenant } from "@/lib/server/tenant";

/** O consumo de IA do mês, por agente e modelo. */
export const GET = withTenant(async (_request, tenant) => {
  const db = getDb();
  const [rows, agents] = await Promise.all([monthUsage(db, tenant.orgId), listAgents(db, tenant.orgId)]);
  const names = new Map(agents.map((a) => [a.id, a.name]));
  const items = rows.map((r) => ({
    ...r,
    agentName: r.agentKey === "pollo-ceo" ? "Pollo CEO" : (names.get(r.agentKey) ?? "Agente removido"),
    costUsd: r.costMicros / 1_000_000,
  }));
  const spent = rows.reduce((s, r) => s + r.costMicros, 0);
  return NextResponse.json({
    enabled: aiEnabled(),
    limitUsd: monthlyLimitMicros() / 1_000_000,
    spentUsd: spent / 1_000_000,
    items,
  });
});
