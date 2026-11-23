import { getDb } from "@/lib/db";
import { confirmMinutes } from "@/lib/server/meetings";
import { withTenant } from "@/lib/server/tenant";

type Context = { params: Promise<{ id: string }> };

/** Confirma a ata: a partir daqui ela vale e não muda mais. */
export const POST = withTenant<Context>(async (_request, tenant, { params }) => {
  const { id } = await params;
  await confirmMinutes(getDb(), tenant.orgId, tenant.userId, id);
  return new Response(null, { status: 204 });
});
