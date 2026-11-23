import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recordActivity } from "@/lib/server/activity";
import { deleteMemory, getMemory, memoryInput, updateMemory } from "@/lib/server/memory";
import { readJson, withTenant } from "@/lib/server/tenant";

type Context = { params: Promise<{ id: string }> };

export const GET = withTenant<Context>(async (_request, tenant, { params }) => {
  const { id } = await params;
  return NextResponse.json({ item: await getMemory(getDb(), tenant.orgId, tenant.userId, id) });
});

export const PATCH = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const input = await readJson(request, (b) => memoryInput.parse(b));
  await updateMemory(getDb(), tenant.orgId, tenant.userId, id, input);
  await recordActivity(getDb(), {
    orgId: tenant.orgId,
    userId: tenant.userId,
    action: "memoria.alterada",
    targetType: "memoria",
    targetId: id,
    summary: `${tenant.userName} alterou “${input.title}” no Segundo Cérebro.`,
    visibility: input.visibility,
  });
  return NextResponse.json({ item: await getMemory(getDb(), tenant.orgId, tenant.userId, id) });
});

export const DELETE = withTenant<Context>(async (_request, tenant, { params }) => {
  const { id } = await params;
  const item = await deleteMemory(getDb(), tenant.orgId, tenant.userId, id);
  await recordActivity(getDb(), {
    orgId: tenant.orgId,
    userId: tenant.userId,
    action: "memoria.apagada",
    targetType: "memoria",
    targetId: id,
    summary: `${tenant.userName} apagou “${item.title}” do Segundo Cérebro.`,
    visibility: item.visibility as "empresa" | "privada",
  });
  return new Response(null, { status: 204 });
});
