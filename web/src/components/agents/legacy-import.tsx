"use client";

import { useState, useSyncExternalStore } from "react";
import { Upload } from "lucide-react";
import { clearLegacyAgents, readLegacyAgents, toDraft } from "@/lib/agents";
import { importAgents } from "@/lib/client/data";

const subscribe = () => () => {};
const countLegacy = () => readLegacyAgents().length;

/**
 * Os agentes criados antes do login ficavam só neste navegador. Este aviso oferece trazê-los para
 * a empresa e, depois, limpa o navegador. Some quando não há nada a importar.
 */
export function LegacyImport({ hasAgents, onImported }: { hasAgents: boolean; onImported: (count: number) => void }) {
  const count = useSyncExternalStore(subscribe, countLegacy, () => 0);
  const [state, setState] = useState<"idle" | "working" | "done" | "dismissed">("idle");
  const [error, setError] = useState<string | null>(null);

  if (count === 0 || state === "done" || state === "dismissed") return null;

  async function run() {
    setState("working");
    setError(null);
    try {
      const n = await importAgents(readLegacyAgents().map(toDraft));
      clearLegacyAgents();
      setState("done");
      onImported(n);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível importar.");
      setState("idle");
    }
  }

  return (
    <div role="region" aria-label="Agentes neste navegador" className="mx-auto mt-6 w-full max-w-lg px-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-panel/70 p-4 ring-1 ring-line sm:flex-row sm:items-center">
        <Upload className="size-5 flex-none text-brand" />
        <p className="flex-1 text-sm">
          {count === 1 ? "Há 1 agente" : `Há ${count} agentes`} criados antes do login, guardados só neste navegador.
          {hasAgents ? " Importe para juntar aos da empresa." : " Importe para salvá-los na sua empresa."}
          {error && <span className="mt-1 block text-red-600">{error}</span>}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setState("dismissed")}
            className="h-9 rounded-lg px-3 text-sm text-muted ring-1 ring-line hover:text-foreground"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={run}
            disabled={state === "working"}
            className="h-9 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground disabled:opacity-60"
          >
            {state === "working" ? "Importando…" : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
}
