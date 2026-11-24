"use client";

import { useCallback, useEffect, useState } from "react";

type Resource="pipelines"|"forms";
type Scope="pipelines.read"|"forms.read";
type KeyStatus={scope:Scope;verifiedAt:string};
type Form={id:string;name:string;pipelineId:string;initialStageId:string;leadSource:string};
type Pipeline={id:string;name:string;isDefault:boolean;stages:{id:string;name:string;color:string;orderIndex:number}[]};
type Catalog={resource:Resource;items:Form[]|Pipeline[];hasMore:boolean;source:string;readOnly:boolean};

const SCOPES:Record<Resource,Scope>={pipelines:"pipelines.read",forms:"forms.read"};
const LABELS:Record<Resource,string>={pipelines:"Pipelines",forms:"Formulários"};

async function call<T>(path:string,init?:RequestInit):Promise<T>{
 const result=await fetch(path,{...init,credentials:"same-origin",cache:"no-store",headers:{
  ...(init?.body?{"Content-Type":"application/json"}:{}),...init?.headers
 }});
 if(!result.ok){
  const body=await result.json().catch(()=>({})) as {error?:string};
  throw new Error(body.error||"Não foi possível consultar o FlipForm.");
 }
 if(result.status===204)return undefined as T;
 return result.json() as Promise<T>;
}

/** Read credentials are held only in memory, until posted via same-origin authenticated HTTPS. */
export function FlipFormReadPanel(){
 const [resource,setResource]=useState<Resource>("pipelines");
 const [token,setToken]=useState("");
 const [keys,setKeys]=useState<KeyStatus[]>([]);
 const [result,setResult]=useState<Catalog|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);

 const refresh=useCallback(async()=>{
  const info=await call<{scopes:KeyStatus[]}>("/api/connections/flipform/read-keys");
  setKeys(info.scopes);
 },[]);
 useEffect(()=>{
  let mounted=true;
  refresh().catch(e=>{if(mounted)setError(e instanceof Error?e.message:"Não foi possível consultar as permissões.");})
    .finally(()=>{if(mounted)setLoading(false);});
  return ()=>{mounted=false;};
 },[refresh]);
 async function save(){
  setBusy(true);setError("");setResult(null);
  try{
   await call("/api/connections/flipform/read-keys",{method:"POST",body:JSON.stringify({scope:SCOPES[resource],token})});
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Falha na validação da chave.");}
  finally{setToken("");setBusy(false);}
 }
 async function load(){
  setBusy(true);setError("");setResult(null);
  try{
   const cat=await call<Catalog>("/api/connections/flipform/catalog?resource="+resource);
   setResult(cat);
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível ler o FlipForm.");}
  finally{setBusy(false);}
 }
 async function revoke(){
  if(!window.confirm("Remover a chave local de "+LABELS[resource]+"? A chave remota deve ser revogada no FlipForm."))return;
  setBusy(true);setError("");setResult(null);
  try{
   await call("/api/connections/flipform/read-keys?scope="+encodeURIComponent(SCOPES[resource]),{method:"DELETE"});
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Falha ao remover chave.");}
  finally{setBusy(false);}
 }
 const authorized=keys.some(k=>k.scope===SCOPES[resource]);
 return <section className="rounded-2xl bg-card p-4 ring-1 ring-line space-y-3" aria-label="Leituras autorizadas do FlipForm">
  <h3 className="text-sm font-semibold">Consultas do FlipForm</h3>
  <p className="text-xs text-muted">A chave de diagnóstico já conectou as empresas. Para consultar dados, gere uma chave específica na mesma integração Flip OS do FlipForm.</p>
  <label className="text-xs font-medium block" htmlFor="flipform-scope">Informação que deseja consultar</label>
  <select id="flipform-scope" value={resource} onChange={e=>{setResource(e.target.value as Resource);setResult(null);setToken("");setError("");}}
   className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm" disabled={busy}>
    <option value="pipelines">Pipelines</option>
    <option value="forms">Formulários</option>
  </select>
  {loading?<p className="text-xs text-muted">Verificando permissões...</p>:authorized?<>
   <p role="status" className="text-xs text-emerald-700">Chave de leitura de {LABELS[resource].toLowerCase()} cadastrada</p>
   <div className="flex flex-wrap gap-2">
    <button className="rounded-xl bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50" disabled={busy}
     onClick={()=>void load()}>Consultar {LABELS[resource].toLowerCase()}</button>
    <button className="rounded-xl border border-line px-3 py-2 text-sm disabled:opacity-50" disabled={busy}
     onClick={()=>void revoke()}>Remover chave</button>
   </div>
  </>:<>
   <label className="block text-xs font-medium" htmlFor="flipform-read-key">Chave de leitura de {LABELS[resource].toLowerCase()}</label>
   <input id="flipform-read-key" type="password" autoComplete="off" spellCheck={false} value={token} onChange={e=>setToken(e.target.value.trim())}
    placeholder="ffv1.…" className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm" disabled={busy}/>
   <button className="rounded-xl bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
    disabled={busy||!token.startsWith("ffv1.")} onClick={()=>void save()}>{busy?"Validando...":"Autorizar leitura"}</button>
  </>}
  {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
  {result&&<section aria-label="Resultado da consulta" className="space-y-2 rounded-xl bg-panel/70 p-3">
   <div className="text-xs font-semibold">{LABELS[result.resource]} — {result.items.length} nesta página</div>
   <ul className="space-y-1">
   {result.items.map(item=><li key={item.id} className="rounded-lg bg-card px-2 py-2 text-sm">
     <span className="font-medium">{item.name}</span>
     {"stages" in item ? <span className="block text-xs text-muted">{item.stages.length} etapas configuradas</span>
     : <span className="block text-xs text-muted">Formulário ativo</span>}
   </li>)}
   </ul>
   {result.items.length===0&&<p className="text-xs text-muted">Nenhum registro ativo retornado para esta empresa.</p>}
   {result.hasMore&&<p className="text-xs text-muted">Exibindo apenas a primeira página; há mais registros no FlipForm.</p>}
   <p className="text-xs text-muted">Fonte: FlipForm API v1. Consulta somente de leitura, sem contatos ou conversas.</p>
  </section>}
 </section>;
}
