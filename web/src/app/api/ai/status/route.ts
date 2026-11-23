import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { aiEnabled, monthSpendMicros, monthlyLimitMicros } from "@/lib/server/ai";
import { withTenant } from "@/lib/server/tenant";

/** Se a IA está ligada e quanto a empresa já gastou no mês. */
export const GET = withTenant(async (_request, tenant) => {
  const spent = await monthSpendMicros(getDb(), tenant.orgId);
  const limit = monthlyLimitMicros();
  return NextResponse.json({
    enabled: aiEnabled(),
    spentUsd: spent / 1_000_000,
    limitUsd: limit / 1_000_000,
    blocked: limit > 0 && spent >= limit,
  });
});
