import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { recordActivity } from "@/lib/server/activity";
import { encryptCredential, getCredentialEncryptionKey, validateDiagnosticToken } from "@/lib/server/connectors/flipform";
import { belongsToConnection, parseReadScope, probeReadKey } from "@/lib/server/connectors/flipform-read";
import { HttpError, withTenant } from "@/lib/server/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function owner(role:string) {
  if (role!=="owner") throw new HttpError(403,"Apenas o proprietário pode administrar credenciais.");
}
function originAllowed(request:Request){
  const origin=request.headers.get("origin"),site=request.headers.get("sec-fetch-site");
  if(!origin || origin!==new URL(request.url).origin || (site && site!=="same-origin")) throw new HttpError(403,"Origem não autorizada.");
}
function whereOrg(orgId:string){
  return and(eq(schema.externalConnections.organizationId,orgId),eq(schema.externalConnections.provider,"flipform"));
}

export const GET=withTenant(async (_request,tenant)=>{
  owner(tenant.role);
  const [conn]=await getDb().select({id:schema.externalConnections.id,remoteIntegrationId:schema.externalConnections.remoteIntegrationId})
    .from(schema.externalConnections).where(whereOrg(tenant.orgId)).limit(1);
  if(!conn) return NextResponse.json({scopes:[]},{headers:{"Cache-Control":"no-store"}});
  const keys=await getDb().select({scope:schema.externalConnectionKeys.scope,verifiedAt:schema.externalConnectionKeys.verifiedAt})
    .from(schema.externalConnectionKeys).where(and(
      eq(schema.externalConnectionKeys.connectionId,conn.id),
      eq(schema.externalConnectionKeys.remoteIntegrationId,conn.remoteIntegrationId),
    ));
  return NextResponse.json({scopes:keys},{headers:{"Cache-Control":"no-store"}});
});

export const POST=withTenant(async (request,tenant)=>{
  owner(tenant.role);originAllowed(request);
  const body=await request.json().catch(()=>null);
  if(!body || typeof body!=="object" || Array.isArray(body) || Object.keys(body).length!==2
    || !parseReadScope(body.scope) || !validateDiagnosticToken(body.token))
    throw new HttpError(422,"Informe uma chave de leitura válida e seu escopo.");
  const scope=parseReadScope(body.scope)!;
  let key:Buffer;
  try{key=getCredentialEncryptionKey();}catch{throw new HttpError(503,"O armazenamento seguro de chaves não está configurado.");}
  const [conn]=await getDb().select().from(schema.externalConnections).where(whereOrg(tenant.orgId)).limit(1);
  if(!conn)throw new HttpError(409,"Conecte a chave de diagnóstico antes das chaves de leitura.");
  const identity=await probeReadKey(body.token,scope);
  if(!identity.ok) throw new HttpError(identity.reason==="unauthorized"?401:503,
      identity.reason==="unauthorized"?"Chave de leitura inválida ou sem permissão.":"Não foi possível verificar a chave no FlipForm.");
  if(!belongsToConnection(identity,conn)) throw new HttpError(409,"A chave pertence a outra empresa ou integração do FlipForm.");
  const now=new Date();
  const encrypted=encryptCredential(body.token,tenant.orgId,key);
  await getDb().insert(schema.externalConnectionKeys).values({
    connectionId:conn.id,scope,remoteIntegrationId:identity.integrationId,encryptedCredential:encrypted,verifiedAt:now,updatedAt:now,
  }).onConflictDoUpdate({
    target:[schema.externalConnectionKeys.connectionId,schema.externalConnectionKeys.scope],
    set:{remoteIntegrationId:identity.integrationId,encryptedCredential:encrypted,verifiedAt:now,updatedAt:now},
  });
  await recordActivity(getDb(),{orgId:tenant.orgId,userId:tenant.userId,action:"integracao.flipform.leitura_autorizada",
    targetType:"acesso",summary:"O proprietário autorizou leitura de "+(scope==="forms.read"?"formulários":"pipelines")+" do FlipForm."});
  return NextResponse.json({connected:true,scope,verifiedAt:now.toISOString()},{
    headers:{"Cache-Control":"no-store"}});
});

export const DELETE=withTenant(async (request,tenant)=>{
  owner(tenant.role);originAllowed(request);
  const query=new URL(request.url).searchParams;
  if(query.size!==1 || query.getAll("scope").length!==1)throw new HttpError(400,"Escopo inválido.");
  const scope=parseReadScope(query.get("scope"));
  if(!scope)throw new HttpError(400,"Escopo inválido.");
  const [conn]=await getDb().select({id:schema.externalConnections.id})
    .from(schema.externalConnections).where(whereOrg(tenant.orgId)).limit(1);
  if(!conn)throw new HttpError(404,"Conexão não encontrada.");
  await getDb().delete(schema.externalConnectionKeys).where(and(
    eq(schema.externalConnectionKeys.connectionId,conn.id),eq(schema.externalConnectionKeys.scope,scope)));
  await recordActivity(getDb(),{orgId:tenant.orgId,userId:tenant.userId,action:"integracao.flipform.leitura_removida",
    targetType:"acesso",summary:"O proprietário removeu o acesso local a "+scope+". A chave remota deve ser revogada no FlipForm."});
  return new Response(null,{status:204});
});
