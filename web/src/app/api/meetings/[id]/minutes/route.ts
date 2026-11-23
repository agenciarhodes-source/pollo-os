import { getDb } from "@/lib/db";
import { minutesInput, saveMinutes } from "@/lib/server/meetings";
import { readJson, withTenant } from "@/lib/server/tenant";

type Context = { params: Promise<{ id: string }> };

/** Guarda a ata (rascunho dela). */
export const PUT = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const input = await readJson(request, (b) => minutesInput.parse(b));
  await saveMinutes(getDb(), tenant.orgId, tenant.userId, id, input);
  return new Response(null, { status: 204 });
});
