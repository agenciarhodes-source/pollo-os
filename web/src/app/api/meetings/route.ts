import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createMeeting, listMeetings, meetingInput } from "@/lib/server/meetings";
import { readJson, withTenant } from "@/lib/server/tenant";

export const GET = withTenant(async (request, tenant) => {
  const scope = new URL(request.url).searchParams.get("escopo") === "historico" ? "historico" : "proximas";
  return NextResponse.json({ meetings: await listMeetings(getDb(), tenant.orgId, tenant.userId, scope) });
});

export const POST = withTenant(async (request, tenant) => {
  const input = await readJson(request, (b) => meetingInput.parse(b));
  const id = await createMeeting(getDb(), tenant.orgId, tenant.userId, input);
  return NextResponse.json({ id }, { status: 201 });
});
