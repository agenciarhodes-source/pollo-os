"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, Info, Users } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";
import { POLLO_CEO } from "@/lib/agents";
import { dayParts, formatTime, useMeetings, type MeetingSummary } from "@/lib/client/meetings";
import { StatusBadge } from "./status-badge";

const TABS = [
  { id: "proximas", label: "Próximas" },
  { id: "historico", label: "Histórico" },
] as const;

function MeetingRow({ m }: { m: MeetingSummary }) {
  const { day, month } = dayParts(m.startsAt, m.timezone);
  return (
    <li>
      <Link
        href={`/agenda/${m.id}`}
        className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-line transition hover:ring-brand/60 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="flex w-14 flex-none flex-col items-center rounded-xl bg-panel py-2 ring-1 ring-line">
          <span className="text-xl leading-none font-semibold">{day}</span>
          <span className="mt-1 text-xs text-muted uppercase">{month}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{m.title}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {formatTime(m.startsAt, m.timezone)} – {formatTime(m.endsAt, m.timezone)} · com o Pollo CEO
          </span>
        </span>
        <StatusBadge status={m.status} />
      </Link>
    </li>
  );
}

export function AgendaScreen() {
  const [tab, setTab] = useState<"proximas" | "historico">("proximas");
  const { meetings, isLoading, error } = useMeetings(tab);

  return (
    <main className="flex-1 overflow-y-auto bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Agenda</h1>
            <p className="mt-1.5 max-w-lg text-muted">Suas reuniões com o Pollo CEO: pautas, conversas e atas.</p>
          </div>
          <Link
            href="/agenda/nova"
            className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
          >
            <CalendarPlus className="size-4" />
            Nova reunião
          </Link>
        </header>

        <div role="tablist" aria-label="Reuniões" className="flex gap-1 rounded-xl bg-panel p-1 ring-1 ring-line sm:w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-9 flex-1 rounded-lg px-4 text-sm transition sm:flex-none ${
                tab === t.id ? "bg-card font-medium shadow-sm ring-1 ring-line" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <section role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label} aria-busy={isLoading}>
          {error ? (
            <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
              {error.message}
            </p>
          ) : isLoading ? (
            <p className="p-4 text-sm text-muted">Carregando reuniões…</p>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-panel/60 px-6 py-12 text-center ring-1 ring-line">
              <Pollo {...POLLO_CEO} mood="calmo" size={64} title="Pollo CEO" />
              <p className="font-medium">
                {tab === "proximas" ? "Nenhuma reunião marcada" : "Nenhuma reunião no histórico ainda"}
              </p>
              <p className="max-w-sm text-sm text-muted">
                {tab === "proximas"
                  ? "Marque um horário com o Pollo CEO para revisar a semana, preparar uma decisão ou acompanhar uma meta."
                  : "As reuniões concluídas e canceladas aparecem aqui, com as atas."}
              </p>
              {tab === "proximas" && (
                <Link href="/agenda/nova" className="mt-1 text-sm font-medium text-brand">
                  Marcar a primeira reunião
                </Link>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {meetings.map((m) => (
                <MeetingRow key={m.id} m={m} />
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-2 text-sm text-muted">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 flex-none" />
            A agenda de vendas e de atendimento continua no FlipForm. Esta é a agenda da sua relação com a IA.
          </p>
          <p className="flex items-start gap-2">
            <Users className="mt-0.5 size-4 flex-none" />
            Google Agenda e Outlook: não conectados.
          </p>
        </aside>
      </div>
    </main>
  );
}
