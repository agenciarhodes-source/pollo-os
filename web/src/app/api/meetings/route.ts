import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recordActivity } from "@/lib/server/activity";
import { createMeeting, listMeetings, meetingInput } from "@/lib/server/meetings";
import { readJson, withTenant } from "@/lib/server/tenant";

export const GET = withTenant(async (request, tenant) => {
  const scope = new URL(request.url).searchParams.get("escopo") === "historico" ? "historico" : "proximas";
  return NextResponse.json({ meetings: await listMeetings(getDb(), tenant.orgId, tenant.userId, scope) });
});

export const POST = withTenant(async (request, tenant) => {
  const input = await readJson(request, (b) => meetingInput.parse(b));
  const id = await createMeeting(getDb(), tenant.orgId, tenant.userId, input);
  await recordActivity(getDb(), { orgId: tenant.orgId, userId: tenant.userId, action: input.schedule ? "reuniao.agendada" : "reuniao.rascunho", targetType: "reuniao", targetId: id, summary: `${tenant.userName} ${input.schedule ? "agendou" : "criou o rascunho de"} a reunião “${input.title}”.` });
  return NextResponse.json({ id }, { status: 201 });
});
