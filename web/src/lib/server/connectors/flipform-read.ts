import type { FlipFormProbe } from "./flipform";
import { validateDiagnosticToken } from "./flipform";

const ORIGIN = "https://app.flipform.com.br";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const READ_RESOURCES = {
  pipelines: { scope: "pipelines.read", path: "/api/v1/pipelines?limit=20" },
  forms: { scope: "forms.read", path: "/api/v1/forms?limit=20" },
} as const;
export type FlipFormResource = keyof typeof READ_RESOURCES;
export type FlipFormReadScope = typeof READ_RESOURCES[FlipFormResource]["scope"];

export function parseReadScope(value: unknown): FlipFormReadScope | null {
  return value === "pipelines.read" || value === "forms.read" ? value : null;
}
export function parseResource(value: unknown): FlipFormResource | null {
  return value === "pipelines" || value === "forms" ? value : null;
}
export type ScopedIdentity =
  | { ok: true; tenantId: string; integrationId: string; scope: FlipFormReadScope }
  | { ok: false; reason: "unauthorized" | "unavailable" | "invalid_response" };

function responseError(status: number): ScopedIdentity {
  return {ok:false,reason: status === 401 || status === 403 || status === 404 ? "unauthorized" : "unavailable"};
}
const common = (token: string): RequestInit => ({
  method: "GET", headers: { Authorization: "Bearer "+token, Accept: "application/json" },
  cache: "no-store", redirect: "error", signal: AbortSignal.timeout(7000),
});

async function jsonBody(response: Response): Promise<Record<string,unknown> | null> {
  if (!(response.headers.get("content-type") || "").includes("application/json")) return null;
  const text = await response.text();
  if (!text || text.length > 64_000) return null;
  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : null;
  } catch { return null; }
}

/** Authenticated introspection: the FlipForm backend proves this read key's exact tenant and integration. */
export async function probeReadKey(
  token: string, scope: FlipFormReadScope, fetcher: typeof fetch = fetch,
): Promise<ScopedIdentity> {
  if (!validateDiagnosticToken(token) || !parseReadScope(scope)) return {ok:false,reason:"unauthorized"};
  try {
    const url = ORIGIN+"/api/v1/credential-identity?scope="+encodeURIComponent(scope);
    const response = await fetcher(url,common(token));
    if (!response.ok) return responseError(response.status);
    const body = await jsonBody(response);
    if (!body || body.version!=="v1" || body.scope!==scope || body.businessData!==false
      || typeof body.tenantId!=="string" || !UUID.test(body.tenantId)
      || typeof body.integrationId!=="string" || !UUID.test(body.integrationId)) {
      return {ok:false,reason:"invalid_response"};
    }
    return {ok:true,tenantId:body.tenantId,integrationId:body.integrationId,scope};
  } catch { return {ok:false,reason:"unavailable"}; }
}

export function belongsToConnection(
 identity: ScopedIdentity,
 connection: {remoteTenantId:string;remoteIntegrationId:string},
): boolean {
  return identity.ok && identity.tenantId===connection.remoteTenantId
    && identity.integrationId===connection.remoteIntegrationId;
}

type PipelineItem = { id:string;name:string;isDefault:boolean;stages:Array<{id:string;name:string;color:string;orderIndex:number}> };
type FormItem = {id:string;name:string;pipelineId:string;initialStageId:string;leadSource:string};
export type ReadCatalog = {resource:FlipFormResource;items: PipelineItem[]|FormItem[];hasMore:boolean};

const small=(x:unknown,max=150):x is string=>typeof x==="string"&&x.length<=max;
function validPipeline(value: unknown): value is PipelineItem {
  if (!value||typeof value!=="object"||Array.isArray(value))return false;
  const v=value as Record<string,unknown>;
  if(!small(v.id,36)||!UUID.test(v.id)||!small(v.name)||typeof v.isDefault!=="boolean"||!Array.isArray(v.stages)||v.stages.length>200)return false;
  return v.stages.every(s=>{
    if(!s||typeof s!=="object"||Array.isArray(s))return false;
    const r=s as Record<string,unknown>;
    return small(r.id,36)&&UUID.test(r.id)&&small(r.name)&&small(r.color,50)&&Number.isInteger(r.orderIndex);
  });
}
function validForm(value:unknown):value is FormItem {
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const v=value as Record<string,unknown>;
  return small(v.id,36)&&UUID.test(v.id)&&small(v.name)
    &&small(v.pipelineId,36)&&UUID.test(v.pipelineId)
    &&small(v.initialStageId,36)&&UUID.test(v.initialStageId)&&small(v.leadSource,100);
}
export type CatalogResult =
 | {ok:true;catalog:ReadCatalog}
 | {ok:false;reason:"unauthorized"|"unavailable"|"invalid_response"};

/** Fetches ONLY bounded public-to-this-tenant catalog metadata. No PII or arbitrary URLs. */
export async function fetchReadCatalog(
 token:string,resource:FlipFormResource,fetcher:typeof fetch=fetch,
):Promise<CatalogResult>{
 if(!validateDiagnosticToken(token)||!parseResource(resource))return {ok:false,reason:"unauthorized"};
 try{
   const response=await fetcher(ORIGIN+READ_RESOURCES[resource].path,common(token));
   if(!response.ok)return {ok:false,reason:responseError(response.status).reason};
   const body=await jsonBody(response);
   if(!body||body.version!=="v1"||!Array.isArray(body.items)||body.items.length>20
     ||(body.nextCursor!==null && (typeof body.nextCursor!=="string" || !UUID.test(body.nextCursor)))) {
     return {ok:false,reason:"invalid_response"};
   }
   if(!body.items.every(resource==="pipelines"?validPipeline:validForm)) return {ok:false,reason:"invalid_response"};
   const items=resource==="pipelines"
     ? (body.items as PipelineItem[]).map(p=>({id:p.id,name:p.name,isDefault:p.isDefault,stages:p.stages.map(s=>({id:s.id,name:s.name,color:s.color,orderIndex:s.orderIndex}))}))
     : (body.items as FormItem[]).map(f=>({id:f.id,name:f.name,pipelineId:f.pipelineId,initialStageId:f.initialStageId,leadSource:f.leadSource}));
   return {ok:true,catalog:{resource,items,hasMore:body.nextCursor!==null}};
 }catch{return {ok:false,reason:"unavailable"};}
}
