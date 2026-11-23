"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";
import { POLLO_CEO } from "@/lib/agents";
import { createMeeting, updateMeeting, useOrgMembers, type Meeting } from "@/lib/client/meetings";

const pad = (n: number) => String(n).padStart(2, "0");

/** Data (aaaa-mm-dd) e hora (hh:mm) locais, para os campos do formulário. */
function localParts(d: Date) {
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** A próxima hora cheia, para sugerir o início de uma reunião nova. */
function nextHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

export function MeetingForm({ meeting }: { meeting?: Meeting }) {
  const router = useRouter();
  const { members, me } = useOrgMembers();
  const start = meeting ? new Date(meeting.startsAt) : nextHour();
  const end = meeting ? new Date(meeting.endsAt) : new Date(start.getTime() + 30 * 60_000);

  const [title, setTitle] = useState(meeting?.title ?? "");
  const [agenda, setAgenda] = useState(meeting?.agenda ?? "");
  const [date, setDate] = useState(localParts(start).date);
  const [from, setFrom] = useState(localParts(start).time);
  const [to, setTo] = useState(localParts(end).time);
  const [invited, setInvited] = useState<string[]>(meeting?.participants.map((p) => p.id) ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(schedule: boolean) {
    if (!title.trim()) {
      setError("Dê um título para a reunião.");
      return;
    }
    const startsAt = new Date(`${date}T${from}`);
    const endsAt = new Date(`${date}T${to}`);
    if (!(endsAt > startsAt)) {
      setError("O fim tem de ser depois do início.");
      return;
    }
    setBusy(true);
    setError(null);
    const draft = {
      title: title.trim(),
      agenda: agenda.trim(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
      participantIds: invited.filter((id) => id !== me),
      schedule,
    };
    try {
      if (meeting) {
        await updateMeeting(meeting.id, draft);
        router.push(`/agenda/${meeting.id}`);
      } else {
        const id = await createMeeting(draft);
        router.push(`/agenda/${id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      setBusy(false);
    }
  }

  const others = members.filter((m) => m.id !== me);
  const field = "h-11 rounded-xl bg-field px-3.5 text-[15px] ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

  return (
    <main className="flex-1 overflow-y-auto bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(true);
        }}
        className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:py-12"
      >
        <Link href={meeting ? `/agenda/${meeting.id}` : "/agenda"} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" /> Agenda
        </Link>

        <div className="flex items-center gap-3">
          <Pollo {...POLLO_CEO} size={48} title="Pollo CEO" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{meeting ? "Editar reunião" : "Nova reunião"}</h1>
            <p className="text-sm text-muted">com o Pollo CEO</p>
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            Título <span className="text-brand">*</span>
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Revisão da semana" className={field} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Pauta</span>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder={"1. Como foram as vendas\n2. O que travou na operação\n3. Decisões da semana"}
            className="resize-y rounded-xl bg-field px-3.5 py-3 text-[15px] leading-relaxed ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
          <label className="col-span-2 flex flex-col gap-2 sm:col-span-1">
            <span className="text-sm font-medium">Dia</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={field} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Início</span>
            <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} required className={field} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Fim</span>
            <input type="time" value={to} onChange={(e) => setTo(e.target.value)} required className={field} />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Participantes</legend>
          <p className="flex items-center gap-2 rounded-xl bg-panel/60 px-3 py-2 text-sm ring-1 ring-line">
            Você e o Pollo CEO participam sempre.
          </p>
          {others.length === 0 ? (
            <p className="text-sm text-muted">Ninguém mais na empresa por enquanto.</p>
          ) : (
            others.map((m) => (
              <label key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-2 ring-1 ring-line">
                <input
                  type="checkbox"
                  checked={invited.includes(m.id)}
                  onChange={(e) => setInvited((v) => (e.target.checked ? [...v, m.id] : v.filter((id) => id !== m.id)))}
                  className="size-4 accent-[var(--brand)]"
                />
                <span className="flex-1 text-sm">{m.name}</span>
                <span className="text-xs text-muted">{m.email}</span>
              </label>
            ))
          )}
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {!meeting && (
            <button
              type="button"
              onClick={() => void submit(false)}
              disabled={busy}
              className="h-11 rounded-xl px-5 text-sm ring-1 ring-line hover:bg-panel disabled:opacity-60"
            >
              Salvar como rascunho
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-xl bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Salvando…" : meeting ? "Salvar alterações" : "Agendar"}
          </button>
        </div>
      </form>
    </main>
  );
}
