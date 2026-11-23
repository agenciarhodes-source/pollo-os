"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useMemoryList } from "@/lib/client/memory";

/**
 * Decisões & Aprovações. Os pedidos de aprovação vêm dos agentes, que só agem com a IA ligada;
 * até lá, a tela mostra as decisões que a empresa já registrou.
 */
export function DecisionsScreen() {
  const { items, isLoading, error } = useMemoryList("", "decisao");

  return (
    <main className="flex-1 overflow-y-auto bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Decisões &amp; Aprovações</h1>
          <p className="mt-1.5 max-w-lg text-muted">O que os agentes pedem para fazer e o que a empresa já decidiu.</p>
        </header>

        <section aria-labelledby="pedidos" className="flex flex-col gap-3">
          <h2 id="pedidos" className="text-sm font-semibold">
            Pedidos de aprovação
          </h2>
          <div className="flex items-start gap-3 rounded-2xl bg-panel/60 p-4 text-sm ring-1 ring-line">
            <ShieldCheck className="mt-0.5 size-5 flex-none text-brand" />
            <p className="text-muted">
              Nenhum pedido. Os agentes ainda não agem sozinhos, porque a IA não está ligada. Quando agirem, tudo o que mexer em algo
              fora do Pollo OS vai pedir a sua aprovação aqui, com o que querem fazer, onde e por quê.
            </p>
          </div>
        </section>

        <section aria-labelledby="decisoes" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="decisoes" className="text-sm font-semibold">
              Decisões registradas
            </h2>
            <Link href="/segundo-cerebro" className="text-sm text-brand">
              Ver no Segundo Cérebro
            </Link>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error.message}
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="rounded-2xl bg-panel/60 p-4 text-sm text-muted ring-1 ring-line">
              Nenhuma decisão ainda. Confirme a ata de uma reunião na Agenda: as decisões dela aparecem aqui, com a reunião como fonte.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-line rounded-2xl bg-card ring-1 ring-line">
              {items.map((d) => (
                <li key={d.id} className="flex flex-col gap-1 px-4 py-3">
                  <p className="text-[15px] font-medium">{d.title}</p>
                  <p className="text-xs text-muted">
                    {d.source || "Registrada no Segundo Cérebro"} ·{" "}
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d.createdAt))}
                    {d.sourceMeetingId && (
                      <>
                        {" · "}
                        <Link href={`/agenda/${d.sourceMeetingId}`} className="text-brand">
                          ver a reunião
                        </Link>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
