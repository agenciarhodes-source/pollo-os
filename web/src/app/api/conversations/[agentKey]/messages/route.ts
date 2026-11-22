import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listMessages, resolveAgentName, sendMessage } from "@/lib/server/repo";
import { HttpError, readJson, withTenant } from "@/lib/server/tenant";
import { messageInput } from "@/lib/server/validation";

type Context = { params: Promise<{ agentKey: string }> };

async function agentOrThrow(orgId: string, agentKey: string) {
  const name = await resolveAgentName(getDb(), orgId, agentKey);
  if (!name) throw new HttpError(404, "Este agente não existe nesta empresa.");
  return name;
}

export const GET = withTenant<Context>(async (_request, tenant, { params }) => {
  const { agentKey } = await params;
  await agentOrThrow(tenant.orgId, agentKey);
  return NextResponse.json({ messages: await listMessages(getDb(), tenant.orgId, tenant.userId, agentKey) });
});

export const POST = withTenant<Context>(async (request, tenant, { params }) => {
  const { agentKey } = await params;
  const name = await agentOrThrow(tenant.orgId, agentKey);
  const { text } = await readJson(request, (b) => messageInput.parse(b));
  const messages = await sendMessage(getDb(), tenant.orgId, tenant.userId, agentKey, name, text);
  return NextResponse.json({ messages }, { status: 201 });
});
