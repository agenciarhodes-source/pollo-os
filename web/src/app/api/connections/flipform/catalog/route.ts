import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { decryptCredential, getCredentialEncryptionKey } from "@/lib/server/connectors/flipform";
import { fetchReadCatalog, parseResource, READ_RESOURCES } from "@/lib/server/connectors/flipform-read";
import { HttpError, withTenant } from "@/lib/server/tenant";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export const GET=withTenant(async (request,tenant)=>{
  if(tenant.role!=="owner")throw new HttpError(403,"Somente o proprietário pode consultar essa integração.");
  const query=new URL(request.url).searchParams;
  if(query.size!==1 || query.getAll("resource").length!==1)throw new HttpError(400,"Consulta inválida.");
  const resource=parseResource(query.get("resource"));
  if(!resource)throw new HttpError(400,"Consulta inválida.");
  const [connection]=await getDb().select({id:schema.externalConnections.id,remoteIntegrationId:schema.externalConnections.remoteIntegrationId})
    .from(schema.externalConnections).where(and(
      eq(schema.externalConnections.organizationId,tenant.orgId),
      eq(schema.externalConnections.provider,"flipform"))).limit(1);
  if(!connection)throw new HttpError(404,"A empresa não possui conexão FlipForm.");
  const [keyRow]=await getDb().select({secret:schema.externalConnectionKeys.encryptedCredential})
    .from(schema.externalConnectionKeys).where(and(
      eq(schema.externalConnectionKeys.connectionId,connection.id),
      eq(schema.externalConnectionKeys.scope,READ_RESOURCES[resource].scope),
      // Do not reuse old scoped keys after the verified diagnostic integration changes.
      eq(schema.externalConnectionKeys.remoteIntegrationId,connection.remoteIntegrationId),
    )).limit(1);
  if(!keyRow)throw new HttpError(404,"Cadastre primeiro a chave de leitura dessa informação.");
  let token:string;
  try{token=decryptCredential(keyRow.secret,tenant.orgId,getCredentialEncryptionKey());}
  catch{throw new HttpError(503,"Não foi possível abrir a chave de leitura com segurança.");}
  const result=await fetchReadCatalog(token,resource);
  if(!result.ok)throw new HttpError(result.reason==="unauthorized"?401:503,
    result.reason==="unauthorized"?"A chave foi revogada ou expirou no FlipForm.":"O FlipForm não retornou dados válidos.");
  return NextResponse.json({...result.catalog,source:"FlipForm API v1",readOnly:true},
    {headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
});
