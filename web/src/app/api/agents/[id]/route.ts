import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { deleteAgent, findAgent, updateAgent } from "@/lib/server/repo";
import { recordActivity } from "@/lib/server/activity";
import { HttpError, readJson, withTenant } from "@/lib/server/tenant";
import { agentInput } from "@/lib/server/validation";

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = "Este agente não existe nesta empresa.";

export const PATCH = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const input = await readJson(request, (b) => agentInput.parse(b));
  const agent = await updateAgent(getDb(), tenant.orgId, id, input);
  if (!agent) throw new HttpError(404, NOT_FOUND);
  await recordActivity(getDb(), { orgId: tenant.orgId, userId: tenant.userId, action: "agente.alterado", targetType: "agente", targetId: id, summary: `${tenant.userName} alterou o agente ${agent.name}.` });
  return NextResponse.json({ agent });
});

export const DELETE = withTenant<Context>(async (_request, tenant, { params }) => {
  const { id } = await params;
  const agent = await findAgent(getDb(), tenant.orgId, id);
  if (!agent || !(await deleteAgent(getDb(), tenant.orgId, id))) throw new HttpError(404, NOT_FOUND);
  await recordActivity(getDb(), { orgId: tenant.orgId, userId: tenant.userId, action: "agente.removido", targetType: "agente", targetId: id, summary: `${tenant.userName} removeu o agente ${agent.name}.` });
  return new Response(null, { status: 204 });
});
