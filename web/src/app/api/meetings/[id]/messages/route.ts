import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listMeetingMessages, sendMeetingMessage } from "@/lib/server/meetings";
import { readJson, withTenant } from "@/lib/server/tenant";
import { messageInput } from "@/lib/server/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withTenant<Context>(async (_request, tenant, { params }) => {
  const { id } = await params;
  return NextResponse.json({ messages: await listMeetingMessages(getDb(), tenant.orgId, tenant.userId, id) });
});

export const POST = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const { text } = await readJson(request, (b) => messageInput.parse(b));
  return NextResponse.json({ messages: await sendMeetingMessage(getDb(), tenant.orgId, tenant.userId, id, text) }, { status: 201 });
});
