import { getDb } from "@/lib/db";
import { runTurn, type ModelChoice } from "@/lib/server/ai";
import { POLLO_CEO_KEY, findAgent } from "@/lib/server/repo";
import { HttpError, readJson, withTenant } from "@/lib/server/tenant";
import { messageInput } from "@/lib/server/validation";

type Context = { params: Promise<{ agentKey: string }> };

// Uma resposta longa pode levar alguns segundos.
export const maxDuration = 60;

/** Conversa com o Pollo CEO ou com um agente da empresa; a resposta chega em fluxo. */
export const POST = withTenant<Context>(async (request, tenant, { params }) => {
  const { agentKey } = await params;
  const { text } = await readJson(request, (b) => messageInput.parse(b));
  const db = getDb();

  let agent: { key: string; name: string; purpose: string; model: ModelChoice };
  if (agentKey === POLLO_CEO_KEY) {
    agent = { key: POLLO_CEO_KEY, name: "Pollo CEO", purpose: "", model: "equilibrado" };
  } else {
    const found = /^[0-9a-f-]{36}$/i.test(agentKey) ? await findAgent(db, tenant.orgId, agentKey) : null;
    if (!found) throw new HttpError(404, "Este agente não existe nesta empresa.");
    agent = { key: found.id, name: found.name, purpose: found.purpose, model: found.model as ModelChoice };
  }

  return runTurn(db, { orgId: tenant.orgId, userId: tenant.userId, userName: tenant.userName, role: tenant.role, agent }, agentKey, text);
});
