// @vitest-environment node
import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { schema } from "@/lib/db";
import { createTestDb } from "@/lib/db/test-db";
import { belongsToConnection, fetchReadCatalog, parseReadScope, parseResource, probeReadKey } from "./flipform-read";

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const I="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const token="ffv1.11111111-1111-4111-8111-111111111111."+"a".repeat(43);

function okJson(body:unknown){return Response.json(body,{headers:{"content-type":"application/json"}});}

describe("read key onboarding",()=>{
 it("rejects other or write scopes",()=>{
  expect(parseReadScope("integrations.read")).toBeNull();
  expect(parseReadScope("webhooks.manage")).toBeNull();
  expect(parseResource("http://attacker.invalid")).toBeNull();
  expect(parseResource("pipelines")).toBe("pipelines");
 });
 it("checks verified remote identity and exact read scope before saving",async()=>{
  let url="",bearer="";
  const fetcher=(async (request:RequestInfo|URL,init?:RequestInit)=>{
   url=String(request);bearer=new Headers(init?.headers).get("authorization")||"";
   expect(init?.redirect).toBe("error");
   return okJson({version:"v1",tenantId:A,integrationId:I,scope:"forms.read",businessData:false});
  }) as typeof fetch;
  const identity=await probeReadKey(token,"forms.read",fetcher);
  expect(identity).toEqual({ok:true,tenantId:A,integrationId:I,scope:"forms.read"});
  expect(url).toBe("https://app.flipform.com.br/api/v1/credential-identity?scope=forms.read");
  expect(bearer).toBe("Bearer "+token);
  expect(belongsToConnection(identity,{remoteTenantId:A,remoteIntegrationId:I})).toBe(true);
  expect(belongsToConnection(identity,{remoteTenantId:A,remoteIntegrationId:"other"})).toBe(false);
  expect(belongsToConnection(identity,{remoteTenantId:"other",remoteIntegrationId:I})).toBe(false);
  const mismatch=await probeReadKey(token,"pipelines.read",fetcher);
  expect(mismatch).toEqual({ok:false,reason:"invalid_response"});
 });
 it("fails closed for unauthorized introspection",async()=>{
  const unauthorized=(async()=>new Response("",{status:403})) as typeof fetch;
  expect(await probeReadKey(token,"forms.read",unauthorized)).toEqual({ok:false,reason:"unauthorized"});
 });
 it("reads whitelisted catalog with limited output, no extra PII",async()=>{
  let path="";
  const fetcher=(async (url:RequestInfo|URL,init?:RequestInit)=>{
    path=String(url);
    expect(init?.redirect).toBe("error");
    return okJson({version:"v1",nextCursor:null,items:[{
      id:"33333333-3333-4333-8333-333333333333",name:"Form 1",
      pipelineId:"44444444-4444-4444-8444-444444444444",
      initialStageId:"55555555-5555-4555-8555-555555555555",leadSource:"teste",privateUserEmail:"SHOULD_NOT_LEAVE",
    }]});
  }) as typeof fetch;
  const out=await fetchReadCatalog(token,"forms",fetcher);
  expect(path).toBe("https://app.flipform.com.br/api/v1/forms?limit=20");
  expect(out.ok).toBe(true);
  if(out.ok)expect(JSON.stringify(out.catalog)).not.toContain("privateUserEmail");
 });
 it("rejects malformed catalog data",async()=>{
  const bad=(async()=>okJson({version:"v1",nextCursor:null,items:[{email:"PII"}]})) as typeof fetch;
  expect(await fetchReadCatalog(token,"forms",bad)).toEqual({ok:false,reason:"invalid_response"});
 });
 it("one key per scope per connection with cascading deletion and tenant isolation",async()=>{
  const db=await createTestDb();
  await db.insert(schema.organization).values([{id:"org-a",name:"Empresa A",slug:"conn-a"},{id:"org-b",name:"Empresa B",slug:"conn-b"}]);
  const [a,b]=await db.insert(schema.externalConnections).values([
   {organizationId:"org-a",provider:"flipform",remoteTenantId:A,remoteIntegrationId:I,scope:"integrations.read",encryptedCredential:"protected-a",verifiedAt:new Date()},
   {organizationId:"org-b",provider:"flipform",remoteTenantId:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",remoteIntegrationId:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",scope:"integrations.read",encryptedCredential:"protected-b",verifiedAt:new Date()},
  ]).returning();
  await db.insert(schema.externalConnectionKeys).values({connectionId:a.id,scope:"forms.read",encryptedCredential:"encrypted",verifiedAt:new Date()});
  await expect(db.insert(schema.externalConnectionKeys).values({connectionId:a.id,scope:"forms.read",encryptedCredential:"duplicate",verifiedAt:new Date()})).rejects.toThrow();
  const fromB=await db.select().from(schema.externalConnectionKeys).where(eq(schema.externalConnectionKeys.connectionId,b.id));
  expect(fromB).toHaveLength(0);
  await db.delete(schema.externalConnections).where(eq(schema.externalConnections.id,a.id));
  const orphan=await db.select().from(schema.externalConnectionKeys).where(eq(schema.externalConnectionKeys.connectionId,a.id));
  expect(orphan).toHaveLength(0);
 });
});
