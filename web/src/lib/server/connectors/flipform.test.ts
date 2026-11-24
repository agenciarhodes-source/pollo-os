// @vitest-environment node
import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { createTestDb } from "@/lib/db/test-db";
import { schema } from "@/lib/db";
import { decryptCredential, encryptCredential, getCredentialEncryptionKey, probeFlipForm, validateDiagnosticToken } from "./flipform";

const token = "ffv1.11111111-1111-4111-8111-111111111111." + "a".repeat(43);
const tenantId = "22222222-2222-4222-8222-222222222222";
const integrationId = "33333333-3333-4333-8333-333333333333";
const key = randomBytes(32);

describe("FlipForm connector credential safeguards", () => {
  it("requires a dedicated 32-byte encryption key", () => {
    expect(() => getCredentialEncryptionKey({})).toThrow("ENCRYPTION_KEY_NOT_CONFIGURED");
    expect(() => getCredentialEncryptionKey({FLIP_OS_CREDENTIAL_ENCRYPTION_KEY:"short"})).toThrow();
    expect(getCredentialEncryptionKey({FLIP_OS_CREDENTIAL_ENCRYPTION_KEY:key.toString("base64")})).toEqual(key);
  });
  it("validates diagnostic token without saving or logging it", () => {
    expect(validateDiagnosticToken(token)).toBe(true);
    expect(validateDiagnosticToken("bad")).toBe(false);
    expect(validateDiagnosticToken({token})).toBe(false);
  });
  it("uses AES-GCM with authenticated per-company context and random nonces", () => {
    const a = encryptCredential(token, "org-a", key);
    const b = encryptCredential(token, "org-a", key);
    expect(a).not.toContain(token);
    expect(a).not.toEqual(b);
    expect(decryptCredential(a, "org-a", key)).toBe(token);
    expect(() => decryptCredential(a, "org-b", key)).toThrow("CREDENTIAL_UNREADABLE");
    expect(() => decryptCredential(a, "org-a", randomBytes(32))).toThrow();
  });
  it("pins the remote host, denies redirects, and verifies capability identity", async () => {
    let checkedUrl = "", checkedAuthorization = "", checkedRedirect: RequestRedirect | undefined;
    const fake = (async (url: URL | RequestInfo, init?: RequestInit) => {
      checkedUrl = String(url);
      checkedAuthorization = new Headers(init?.headers).get("Authorization") || "";
      checkedRedirect = init?.redirect;
      return Response.json({version:"v1",capability:"integrations.read",businessData:false,tenantId,integrationId});
    }) as typeof fetch;
    expect(await probeFlipForm(token, fake)).toEqual({ok:true,tenantId,integrationId});
    expect(checkedUrl).toBe("https://app.flipform.com.br/api/v1/capabilities");
    expect(checkedAuthorization).toBe("Bearer "+token);
    expect(checkedRedirect).toBe("error");
    const unauthorized = (async () => new Response("",{status:401})) as typeof fetch;
    expect(await probeFlipForm(token,unauthorized)).toEqual({ok:false,reason:"unauthorized"});
    const invalid = (async () => Response.json({version:"v1",tenantId:"other",integrationId})) as typeof fetch;
    expect(await probeFlipForm(token,invalid)).toEqual({ok:false,reason:"invalid_response"});
  });
  it("isolates saved credentials by company and prevents a remote tenant being claimed twice", async () => {
    const db = await createTestDb();
    await db.insert(schema.organization).values([
      {id:"org-a",name:"Empresa A",slug:"empresa-a"},
      {id:"org-b",name:"Empresa B",slug:"empresa-b"},
    ]);
    const encrypted = encryptCredential(token,"org-a",key);
    await db.insert(schema.externalConnections).values({organizationId:"org-a",provider:"flipform",
      remoteTenantId:tenantId,remoteIntegrationId:integrationId,scope:"integrations.read",
      encryptedCredential:encrypted,verifiedAt:new Date()});
    const a = await db.select().from(schema.externalConnections).where(and(
      eq(schema.externalConnections.organizationId,"org-a"),eq(schema.externalConnections.provider,"flipform")));
    const b = await db.select().from(schema.externalConnections).where(and(
      eq(schema.externalConnections.organizationId,"org-b"),eq(schema.externalConnections.provider,"flipform")));
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(0);
    await expect(db.insert(schema.externalConnections).values({organizationId:"org-b",provider:"flipform",
      remoteTenantId:tenantId,remoteIntegrationId:integrationId,scope:"integrations.read",
      encryptedCredential:encrypted,verifiedAt:new Date()})).rejects.toThrow();
  });
});
