"use client";

import { useEffect, useState } from "react";

type Status = {
  connected: boolean;
  tenantId?: string;
  integrationId?: string;
  verifiedAt?: string;
};
const ENDPOINT = "/api/connections/flipform";
async function api(url: string, options?: RequestInit): Promise<Status> {
  const response = await fetch(url, {
    ...options, cache: "no-store", credentials: "same-origin",
    headers: { ...(options?.body ? {"Content-Type":"application/json"} : {}), ...options?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || "Não foi possível validar a conexão.");
  }
  if (response.status === 204) return {connected:false};
  return response.json() as Promise<Status>;
}

/**
 * The token exists only in this input until submitted by HTTPS to a same-origin
 * authenticated owner-only server route. Never persist in browser storage.
 */
export function FlipFormConnectionPanel() {
  const [status, setStatus] = useState<Status|null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api(ENDPOINT).then(value => { if (active) setStatus(value); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Não foi possível consultar a conexão."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function action(kind: "connect" | "test" | "disconnect") {
    if (kind === "disconnect" && !window.confirm("Desconectar o FlipForm deste Flip OS? A chave remota continuará ativa até ser revogada no FlipForm.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await api(kind === "test" ? ENDPOINT+"/test" : ENDPOINT, {
        method: kind === "connect" ? "POST" : kind === "test" ? "POST" : "DELETE",
        ...(kind === "connect" ? { body: JSON.stringify({token}) } : {}),
      });
      setStatus(response);
      if (kind === "connect") setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na comunicação com o FlipForm.");
    } finally {
      // Do not retain a pasted bearer in React state even when the request fails.
      setToken("");
      setBusy(false);
    }
  }

  return (
    <section aria-label="Conexão segura FlipForm" className="rounded-2xl bg-panel/70 p-4 ring-1 ring-line space-y-3">
      <h3 className="text-sm font-semibold">Conectar API do FlipForm</h3>
      {loading ? <p className="text-xs text-muted">Verificando conexão...</p> : status?.connected ? (
        <>
          <p role="status" className="text-sm text-emerald-700 font-medium">API de diagnóstico conectada</p>
          <p className="text-xs text-muted break-all">Tenant FlipForm: {status.tenantId}</p>
          <p className="text-xs text-muted">Última verificação: {status.verifiedAt ? new Date(status.verifiedAt).toLocaleString("pt-BR") : "não verificada"}</p>
          <p className="text-xs text-muted">Esta chave permite apenas verificar a identidade. Consultas de formulários e funis precisam de permissões específicas.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void action("test")} className="rounded-xl bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">Testar conexão</button>
            <button type="button" disabled={busy} onClick={() => void action("disconnect")} className="rounded-xl border border-line px-3 py-2 text-sm disabled:opacity-50">Desconectar</button>
          </div>
          <p className="text-xs text-muted">Desconectar aqui não revoga a chave no FlipForm; revogue-a lá se não for mais utilizar.</p>
        </>
      ) : (
        <>
          <p className="text-xs text-muted">Cole aqui a chave de diagnóstico copiada do FlipForm. Ela será validada e guardada criptografada no servidor, vinculada à empresa atual.</p>
          <label htmlFor="flipform-diagnostic-key" className="block text-xs font-medium">Chave de diagnóstico</label>
          <input id="flipform-diagnostic-key" value={token} onChange={e => setToken(e.target.value.trim())}
            type="password" autoComplete="off" spellCheck={false} placeholder="ffv1.…"
            className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm" disabled={busy} />
          <button type="button" disabled={busy || !token.startsWith("ffv1.") || loading}
            onClick={() => void action("connect")}
            className="rounded-xl bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">
            {busy ? "Validando..." : "Conectar e testar"}
          </button>
          <p className="text-xs text-muted">Não cole a chave em chats, comentários do GitHub ou arquivos do projeto.</p>
        </>
      )}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </section>
  );
}
