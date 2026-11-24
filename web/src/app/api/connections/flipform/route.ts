import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { recordActivity } from "@/lib/server/activity";
import { decryptCredential, encryptCredential, getCredentialEncryptionKey, probeFlipForm, validateDiagnosticToken } from "@/lib/server/connectors/flipform";
import { HttpError, withTenant } from "@/lib/server/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireOwner(role: string) {
  if (role !== "owner") throw new HttpError(403, "Apenas o proprietário pode administrar esta conexão.");
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (!origin || origin !== new URL(request.url).origin || (site && site !== "same-origin")) {
    throw new HttpError(403, "Solicitação de origem não autorizada.");
  }
}
function encryptionKey() {
  try { return getCredentialEncryptionKey(); }
  catch { throw new HttpError(503, "Armazenamento seguro das integrações ainda não está configurado."); }
}
function whereOrg(orgId: string) {
  return and(eq(schema.externalConnections.organizationId, orgId), eq(schema.externalConnections.provider, "flipform"));
}

export const GET = withTenant(async (_request, tenant) => {
  requireOwner(tenant.role);
  const [row] = await getDb().select({
    remoteTenantId: schema.externalConnections.remoteTenantId,
    remoteIntegrationId: schema.externalConnections.remoteIntegrationId,
    verifiedAt: schema.externalConnections.verifiedAt,
  }).from(schema.externalConnections).where(whereOrg(tenant.orgId)).limit(1);
  return NextResponse.json(row
    ? { connected: true, tenantId: row.remoteTenantId, integrationId: row.remoteIntegrationId, verifiedAt: row.verifiedAt }
    : { connected: false }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = withTenant(async (request, tenant) => {
  requireOwner(tenant.role);
  sameOrigin(request);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)
      || Object.keys(body).length !== 1 || !validateDiagnosticToken(body.token)) {
    throw new HttpError(422, "Informe uma chave de diagnóstico válida do FlipForm.");
  }
  const key = encryptionKey();
  const probe = await probeFlipForm(body.token);
  if (!probe.ok) throw new HttpError(probe.reason === "unauthorized" ? 401 : 503,
    probe.reason === "unauthorized" ? "Chave inválida, revogada ou não autorizada no FlipForm." : "Não foi possível validar a API do FlipForm.");

  const db = getDb();
  const existing = await db.select({ remoteTenantId: schema.externalConnections.remoteTenantId })
    .from(schema.externalConnections).where(whereOrg(tenant.orgId)).limit(1);
  if (existing[0] && existing[0].remoteTenantId !== probe.tenantId) {
    throw new HttpError(409, "Este Flip OS já está conectado a outra empresa do FlipForm. Desconecte antes de trocar.");
  }
  const encrypted = encryptCredential(body.token, tenant.orgId, key);
  const now = new Date();
  try {
    await db.insert(schema.externalConnections).values({
      organizationId: tenant.orgId, provider: "flipform",
      remoteTenantId: probe.tenantId, remoteIntegrationId: probe.integrationId,
      scope: "integrations.read", encryptedCredential: encrypted,
      verifiedAt: now, updatedAt: now,
    }).onConflictDoUpdate({
      target: [schema.externalConnections.organizationId, schema.externalConnections.provider],
      set: { encryptedCredential: encrypted, remoteIntegrationId: probe.integrationId, scope: "integrations.read", verifiedAt: now, updatedAt: now },
      setWhere: eq(schema.externalConnections.remoteTenantId, probe.tenantId),
    });
  } catch {
    // Includes remote tenant bound to another Flip OS organization.
    throw new HttpError(409, "Não foi possível vincular essa empresa. Verifique se já existe uma conexão.");
  }
  await recordActivity(db, {
    orgId: tenant.orgId, userId: tenant.userId,
    action: "integracao.flipform.validada", targetType: "acesso",
    summary: "O proprietário conectou a API de diagnóstico do FlipForm.",
  });
  return NextResponse.json({ connected: true, tenantId: probe.tenantId,
    integrationId: probe.integrationId, verifiedAt: now.toISOString() },
    { headers: { "Cache-Control": "no-store" } });
});

export const DELETE = withTenant(async (request, tenant) => {
  requireOwner(tenant.role);
  sameOrigin(request);
  const db = getDb();
  await db.delete(schema.externalConnections).where(whereOrg(tenant.orgId));
  await recordActivity(db, { orgId: tenant.orgId, userId: tenant.userId,
    action: "integracao.flipform.desconectada", targetType: "acesso",
    summary: "O proprietário removeu a credencial local do FlipForm. A chave remota deve ser revogada no FlipForm.",
  });
  return new Response(null, { status: 204 });
});

// The token is never returned in GET or POST; decrypt is only used by the server-side test route.
void decryptCredential;
