import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { decryptCredential, getCredentialEncryptionKey, probeFlipForm } from "@/lib/server/connectors/flipform";
import { HttpError, withTenant } from "@/lib/server/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withTenant(async (request, tenant) => {
  if (tenant.role !== "owner") throw new HttpError(403, "Apenas o proprietário pode testar esta conexão.");
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (!origin || origin !== new URL(request.url).origin || (site && site !== "same-origin")) {
    throw new HttpError(403, "Solicitação de origem não autorizada.");
  }
  const db = getDb();
  const [row] = await db.select().from(schema.externalConnections).where(and(
    eq(schema.externalConnections.organizationId, tenant.orgId),
    eq(schema.externalConnections.provider, "flipform"),
  )).limit(1);
  if (!row) throw new HttpError(404, "Conecte o FlipForm antes de testar.");
  let bearer: string;
  try {
    bearer = decryptCredential(row.encryptedCredential, tenant.orgId, getCredentialEncryptionKey());
  } catch {
    throw new HttpError(503, "Credencial não pôde ser aberta no servidor. Verifique a chave de criptografia.");
  }
  const probe = await probeFlipForm(bearer);
  if (!probe.ok) throw new HttpError(probe.reason === "unauthorized" ? 401 : 503,
    probe.reason === "unauthorized" ? "A chave deixou de ser válida no FlipForm." : "O FlipForm não respondeu à verificação.");
  if (probe.tenantId !== row.remoteTenantId || probe.integrationId !== row.remoteIntegrationId) {
    throw new HttpError(409, "Identidade da integração mudou. Desconecte e revise antes de prosseguir.");
  }
  const verifiedAt = new Date();
  await db.update(schema.externalConnections).set({ verifiedAt }).where(and(
    eq(schema.externalConnections.organizationId, tenant.orgId), eq(schema.externalConnections.provider, "flipform"),
  ));
  return NextResponse.json({ connected: true, verified: true, tenantId: row.remoteTenantId, verifiedAt },
    { headers: { "Cache-Control": "no-store" } });
});
