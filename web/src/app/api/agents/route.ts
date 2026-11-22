import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createAgent, listAgents } from "@/lib/server/repo";
import { readJson, withTenant } from "@/lib/server/tenant";
import { agentInput } from "@/lib/server/validation";

export const GET = withTenant(async (_request, tenant) => {
  const agents = await listAgents(getDb(), tenant.orgId);
  return NextResponse.json({ agents });
});

export const POST = withTenant(async (request, tenant) => {
  const input = await readJson(request, (b) => agentInput.parse(b));
  const agent = await createAgent(getDb(), tenant.orgId, tenant.userId, input);
  return NextResponse.json({ agent }, { status: 201 });
});
