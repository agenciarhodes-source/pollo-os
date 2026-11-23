"use client";

import useSWR from "swr";

type Usage = {
  enabled: boolean;
  limitUsd: number;
  spentUsd: number;
  items: { agentKey: string; agentName: string; service: string; calls: number; tokensIn: number; tokensOut: number; costUsd: number }[];
};

const MODEL_NAME: Record<string, string> = {
  "gpt-6-luna": "Rápido (GPT-6 Luna)",
  "gpt-6.1-sol": "Equilibrado/Avançado (GPT-6.1 Sol)",
};

const usd = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: v > 0 && v < 1 ? 4 : 2 }).format(v);
const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v);

export function UsageScreen() {
  const { data, error, isLoading } = useSWR<Usage>("/api/usage", (url: string) =>
    fetch(url).then(async (r) => {
      if (!r.ok) throw new Error(((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? "Não foi possível carregar.");
      return r.json();
    }),
  );
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());
  const pct = data && data.limitUsd > 0 ? Math.min(100, (data.spentUsd / data.limitUsd) * 100) : 0;

  return (
    <main className="flex-1 overflow-y-auto bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Consumo &amp; Custos</h1>
          <p className="mt-1.5 text-muted first-letter:uppercase">O uso de IA da empresa em {month}.</p>
        </header>

        {error ? (
          <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {error.message}
          </p>
        ) : isLoading || !data ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : (
          <>
            <section aria-label="Limite do mês" className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-line">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-muted">Gasto no mês</p>
                <p className="text-sm text-muted">Limite: {data.limitUsd > 0 ? usd(data.limitUsd) : "sem limite"}</p>
              </div>
              <p className="text-3xl font-semibold tabular-nums">{usd(data.spentUsd)}</p>
              {data.limitUsd > 0 && (
                <div
                  role="progressbar"
                  aria-label="Uso do limite do mês"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pct)}
                  className="h-2 overflow-hidden rounded-full bg-panel ring-1 ring-line"
                >
                  <div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                </div>
              )}
              <p className="text-xs text-muted">
                {!data.enabled
                  ? "A IA não está ligada neste ambiente: as respostas são de demonstração e não custam nada."
                  : pct >= 100
                    ? "A empresa chegou ao limite: o Pollo CEO e os agentes param de responder até o dia 1º."
                    : "Ao chegar no limite, o Pollo CEO e os agentes param de responder até o dia 1º do mês seguinte."}
              </p>
            </section>

            <section aria-labelledby="por-agente" className="flex flex-col gap-3">
              <h2 id="por-agente" className="text-sm font-semibold">
                Por agente e modelo
              </h2>
              {data.items.length === 0 ? (
                <p className="rounded-2xl bg-panel/60 p-4 text-sm text-muted ring-1 ring-line">Nenhum uso de IA neste mês ainda.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl ring-1 ring-line">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-panel/60 text-left text-xs text-muted">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Agente</th>
                        <th className="px-4 py-2.5 font-medium">Modelo</th>
                        <th className="px-4 py-2.5 text-right font-medium">Respostas</th>
                        <th className="px-4 py-2.5 text-right font-medium">Tokens</th>
                        <th className="px-4 py-2.5 text-right font-medium">Custo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-card">
                      {data.items.map((i) => (
                        <tr key={`${i.agentKey}-${i.service}`}>
                          <td className="px-4 py-2.5 font-medium">{i.agentName}</td>
                          <td className="px-4 py-2.5 text-muted">{MODEL_NAME[i.service] ?? i.service}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{num(i.calls)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{num(i.tokensIn + i.tokensOut)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{usd(i.costUsd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <p className="text-xs text-muted">
              A IA usa a conta da OpenAI da empresa. O custo de cada resposta é calculado pelos tokens usados e pelo preço
              do modelo. Voz ainda não está ligada.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
