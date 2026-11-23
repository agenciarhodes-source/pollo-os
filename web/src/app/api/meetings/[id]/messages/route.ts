import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listMeetingMessages } from "@/lib/server/meetings";
import { withTenant } from "@/lib/server/tenant";

type Context = { params: Promise<{ id: string }> };

export const GET = withTenant<Context>(async (_request, tenant, { params }) => {
  const { id } = await params;
  return NextResponse.json({ messages: await listMeetingMessages(getDb(), tenant.orgId, tenant.userId, id) });
});
