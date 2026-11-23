import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getMeeting, statusInput, transitionMeeting } from "@/lib/server/meetings";
import { recordActivity } from "@/lib/server/activity";
import { readJson, withTenant } from "@/lib/server/tenant";

type Context = { params: Promise<{ id: string }> };

/** Agendar, iniciar, encerrar ou cancelar. */
export const POST = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const { action } = await readJson(request, (b) => statusInput.parse(b));
  const status = await transitionMeeting(getDb(), tenant.orgId, tenant.userId, id, action);
  const { title } = await getMeeting(getDb(), tenant.orgId, tenant.userId, id);
  const verb = { agendar: "agendou", iniciar: "começou", encerrar: "encerrou", cancelar: "cancelou" }[action];
  const done = { agendar: "agendada", iniciar: "iniciada", encerrar: "encerrada", cancelar: "cancelada" }[action];
  await recordActivity(getDb(), { orgId: tenant.orgId, userId: tenant.userId, action: `reuniao.${done}`, targetType: "reuniao", targetId: id, summary: `${tenant.userName} ${verb} a reunião “${title}”.` });
  return NextResponse.json({ status });
});
