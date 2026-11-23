import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { statusInput, transitionMeeting } from "@/lib/server/meetings";
import { readJson, withTenant } from "@/lib/server/tenant";

type Context = { params: Promise<{ id: string }> };

/** Agendar, iniciar, encerrar ou cancelar. */
export const POST = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const { action } = await readJson(request, (b) => statusInput.parse(b));
  const status = await transitionMeeting(getDb(), tenant.orgId, tenant.userId, id, action);
  return NextResponse.json({ status });
});
