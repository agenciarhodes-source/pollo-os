import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recordActivity } from "@/lib/server/activity";
import { getMeeting, meetingInput, updateMeeting } from "@/lib/server/meetings";
import { readJson, withTenant } from "@/lib/server/tenant";

type Context = { params: Promise<{ id: string }> };

export const GET = withTenant<Context>(async (_request, tenant, { params }) => {
  const { id } = await params;
  return NextResponse.json({ meeting: await getMeeting(getDb(), tenant.orgId, tenant.userId, id) });
});

export const PATCH = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const input = await readJson(request, (b) => meetingInput.parse(b));
  await updateMeeting(getDb(), tenant.orgId, tenant.userId, id, input);
  await recordActivity(getDb(), { orgId: tenant.orgId, userId: tenant.userId, action: "reuniao.editada", targetType: "reuniao", targetId: id, summary: `${tenant.userName} editou a reunião “${input.title}”.` });
  return NextResponse.json({ meeting: await getMeeting(getDb(), tenant.orgId, tenant.userId, id) });
});
