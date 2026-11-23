import { getDb } from "@/lib/db";
import { confirmMinutes } from "@/lib/server/meetings";
import { withTenant } from "@/lib/server/tenant";
import { recordActivity } from "@/lib/server/activity";

type Context = { params: Promise<{ id: string }> };

/** Confirma a ata: a partir daqui ela vale e não muda mais. */
export const POST = withTenant<Context>(async (_request, tenant, { params }) => {
  const { id } = await params;
  const { title } = await confirmMinutes(getDb(), tenant.orgId, tenant.userId, id);
  await recordActivity(getDb(), { orgId: tenant.orgId, userId: tenant.userId, action: "ata.confirmada", targetType: "ata", targetId: id, summary: `${tenant.userName} confirmou a ata da reunião “${title}”; as decisões foram para o Segundo Cérebro.` });
  return new Response(null, { status: 204 });
});
