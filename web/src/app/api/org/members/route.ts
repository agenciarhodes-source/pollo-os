import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listOrgMembers } from "@/lib/server/meetings";
import { withTenant } from "@/lib/server/tenant";

/** As pessoas da empresa ativa, para escolher participantes. */
export const GET = withTenant(async (_request, tenant) => {
  return NextResponse.json({ members: await listOrgMembers(getDb(), tenant.orgId), me: tenant.userId });
});
