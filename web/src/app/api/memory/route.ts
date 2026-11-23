import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recordActivity } from "@/lib/server/activity";
import { KINDS, createMemory, listMemory, memoryInput, type MemoryKind } from "@/lib/server/memory";
import { readJson, withTenant } from "@/lib/server/tenant";

export const GET = withTenant(async (request, tenant) => {
  const params = new URL(request.url).searchParams;
  const tipo = params.get("tipo");
  const kind = (KINDS as readonly string[]).includes(tipo ?? "") ? (tipo as MemoryKind) : undefined;
  const items = await listMemory(getDb(), tenant.orgId, tenant.userId, { q: params.get("q") ?? undefined, kind });
  return NextResponse.json({ items });
});

export const POST = withTenant(async (request, tenant) => {
  const input = await readJson(request, (b) => memoryInput.parse(b));
  const id = await createMemory(getDb(), tenant.orgId, tenant.userId, input);
  await recordActivity(getDb(), {
    orgId: tenant.orgId,
    userId: tenant.userId,
    action: "memoria.criada",
    targetType: "memoria",
    targetId: id,
    summary: `${tenant.userName} registrou “${input.title}” no Segundo Cérebro.`,
    visibility: input.visibility,
  });
  return NextResponse.json({ id }, { status: 201 });
});
