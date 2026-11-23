"use client";

import { useState } from "react";
import { useActivity } from "@/lib/client/memory";

const TYPES = [
  { id: "", label: "Tudo" },
  { id: "agente", label: "Agentes" },
  { id: "acesso", label: "Acessos aos apps" },
  { id: "reuniao", label: "Reuniões" },
  { id: "ata", label: "Atas" },
  { id: "memoria", label: "Segundo Cérebro" },
];

const dayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function ActivityScreen() {
  const [type, setType] = useState("");
  const { events, hasMore, loadMore, loadingMore, isLoading, error } = useActivity(type);

  // Agrupa por dia, na ordem em que chegaram (mais novos primeiro).
  const groups: { day: string; items: typeof events }[] = [];
  for (const e of events) {
    const day = dayFmt.format(new Date(e.createdAt));
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Atividade</h1>
            <p className="mt-1.5 max-w-lg text-muted">O que aconteceu no Pollo OS, quem fez e quando.</p>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="sr-only">Filtrar</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 rounded-xl bg-panel/70 px-3 ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
            >
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <p className="text-xs text-muted">
          Os agentes ainda não trabalham sozinhos (a IA não está ligada). Quando trabalharem, o que cada um fizer, com a fonte e o
          custo, aparece aqui também.
        </p>

        {error ? (
          <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {error.message}
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : events.length === 0 ? (
          <p className="rounded-2xl bg-panel/60 p-6 text-center text-sm text-muted ring-1 ring-line">Nada registrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <section key={g.day} aria-label={g.day}>
                <h2 className="mb-2 text-sm font-medium text-muted first-letter:uppercase">{g.day}</h2>
                <ol className="flex flex-col divide-y divide-line rounded-2xl bg-card ring-1 ring-line">
                  {g.items.map((e) => (
                    <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                      <time dateTime={e.createdAt} className="w-12 flex-none pt-0.5 text-xs text-muted tabular-nums">
                        {timeFmt.format(new Date(e.createdAt))}
                      </time>
                      <p className="text-sm">{e.summary}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={() => loadMore()}
                disabled={loadingMore}
                className="h-10 self-center rounded-xl px-5 text-sm ring-1 ring-line hover:bg-panel disabled:opacity-60"
              >
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
