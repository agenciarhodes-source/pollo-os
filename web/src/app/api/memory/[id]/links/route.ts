import * as z from "zod";
import { getDb } from "@/lib/db";
import { linkInput, linkMemory, unlinkMemory } from "@/lib/server/memory";
import { HttpError, readJson, withTenant } from "@/lib/server/tenant";

type Context = { params: Promise<{ id: string }> };

/** Liga este item a outro. */
export const POST = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const { targetId } = await readJson(request, (b) => linkInput.parse(b));
  await linkMemory(getDb(), tenant.orgId, tenant.userId, id, targetId);
  return new Response(null, { status: 204 });
});

/** Desfaz a ligação com ?com=<id>. */
export const DELETE = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const other = new URL(request.url).searchParams.get("com") ?? "";
  if (!z.uuid().safeParse(other).success) throw new HttpError(422, "Diga com qual item desfazer a ligação.");
  await unlinkMemory(getDb(), tenant.orgId, tenant.userId, id, other);
  return new Response(null, { status: 204 });
});
