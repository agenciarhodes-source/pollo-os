"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, CheckCircle2, Lock, Mic, Pencil, Plus, Trash2 } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";
import { POLLO_CEO } from "@/lib/agents";
import {
  changeStatus,
  confirmMinutes,
  formatDay,
  formatTime,
  saveMinutes,
  useMeeting,
  useMeetingChat,
  type Meeting,
  type MeetingAction,
  type Minutes,
} from "@/lib/client/meetings";
import { StatusBadge } from "./status-badge";
import { RichText } from "@/components/chat/rich-text";

const ACTION_LABEL: Record<MeetingAction, string> = {
  agendar: "Agendar",
  iniciar: "Começar reunião",
  encerrar: "Encerrar reunião",
  cancelar: "Cancelar reunião",
};

function actionsFor(m: Meeting): MeetingAction[] {
  if (!m.isOwner) return [];
  switch (m.status) {
    case "rascunho":
      return ["agendar", "iniciar", "cancelar"];
    case "agendada":
      return ["iniciar", "cancelar"];
    case "em_andamento":
      return ["encerrar"];
    default:
      return [];
  }
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/* ---------- Conversa por texto ---------- */

function MeetingChat({ meeting }: { meeting: Meeting }) {
  const { messages, send, sending, error } = useMeetingChat(meeting.id);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const open = meeting.status === "em_andamento";

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  if (!open && messages.length === 0) {
    return (
      <p className="rounded-2xl bg-panel/60 p-4 text-sm text-muted ring-1 ring-line">
        {meeting.status === "concluida" || meeting.status === "cancelada"
          ? "Nesta reunião não houve conversa por texto."
          : "A conversa com o Pollo CEO abre quando a reunião começar."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-3 ring-1 ring-line">
      <ol className="flex max-h-96 flex-col gap-3 overflow-y-auto p-1" aria-label="Conversa da reunião">
        {messages.map((m) =>
          m.role === "user" ? (
            <li key={m.id} className="ml-10 self-end rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-[15px] text-brand-foreground">
              {m.text}
            </li>
          ) : (
            <li key={m.id} className="mr-6 flex items-start gap-2">
              <Pollo {...POLLO_CEO} size={26} alive={false} title="Pollo CEO" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted">
                  Pollo CEO {m.demo && <span className="text-amber-700">· demonstração</span>}
                </span>
                <div className="rounded-2xl rounded-tl-md bg-panel px-3.5 py-2 text-[15px] leading-relaxed ring-1 ring-line">
                  <RichText text={m.text} />
                </div>
              </div>
            </li>
          ),
        )}
        {sending && messages.at(-1)?.role === "user" && <li className="text-sm text-muted">Pollo CEO está escrevendo…</li>}
        <div ref={endRef} />
      </ol>
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(text);
            setText("");
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="reuniao-mensagem" className="sr-only">
            Mensagem na reunião
          </label>
          <textarea
            id="reuniao-mensagem"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(text);
                setText("");
              }
            }}
            rows={1}
            placeholder="Escreva para o Pollo CEO…"
            className="max-h-36 min-h-11 flex-1 resize-none rounded-2xl bg-field px-3.5 py-2.5 text-[15px] ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Enviar"
            className="flex size-11 flex-none items-center justify-center rounded-full bg-brand text-brand-foreground disabled:opacity-40"
          >
            <ArrowUp className="size-5" />
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- Ata ---------- */

const EMPTY_MINUTES: Minutes = { summary: "", decisions: [], actionItems: [], openQuestions: "" };

function MinutesView({ minutes }: { minutes: Minutes }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 text-sm ring-1 ring-line">
      <p className="flex items-center gap-2 text-emerald-700">
        <CheckCircle2 className="size-4" /> Ata confirmada{" "}
        {minutes.confirmedAt && (
          <span className="text-muted">
            em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(minutes.confirmedAt))}
          </span>
        )}
      </p>
      <div>
        <h3 className="font-medium">Resumo</h3>
        <p className="mt-1 whitespace-pre-wrap text-foreground/85">{minutes.summary}</p>
      </div>
      {minutes.decisions.length > 0 && (
        <div>
          <h3 className="font-medium">Decisões</h3>
          <ul className="mt-1 list-disc pl-5">
            {minutes.decisions.map((d, i) => (
              <li key={i}>{d.text}</li>
            ))}
          </ul>
        </div>
      )}
      {minutes.actionItems.length > 0 && (
        <div>
          <h3 className="font-medium">Próximos passos</h3>
          <ul className="mt-1 flex flex-col gap-1">
            {minutes.actionItems.map((a, i) => (
              <li key={i}>
                {a.text}
                {(a.owner || a.due) && (
                  <span className="text-muted">
                    {" "}
                    · {[a.owner, a.due].filter(Boolean).join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {minutes.openQuestions && (
        <div>
          <h3 className="font-medium">Dúvidas em aberto</h3>
          <p className="mt-1 whitespace-pre-wrap text-foreground/85">{minutes.openQuestions}</p>
        </div>
      )}
    </div>
  );
}

function MinutesEditor({ meeting }: { meeting: Meeting }) {
  const [m, setM] = useState<Minutes>(meeting.minutes ?? EMPTY_MINUTES);
  const [busy, setBusy] = useState<"salvar" | "confirmar" | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);
  const canConfirm = meeting.status === "concluida";

  const input = "h-10 rounded-lg bg-field px-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

  async function save() {
    setBusy("salvar");
    setMessage(null);
    try {
      await saveMinutes(meeting.id, clean(m));
      setMessage({ kind: "ok", text: "Ata salva. Ela ainda pode mudar até ser confirmada." });
    } catch (e) {
      setMessage({ kind: "erro", text: e instanceof Error ? e.message : "Não foi possível salvar." });
    } finally {
      setBusy(null);
    }
  }

  async function confirm() {
    if (!window.confirm("Confirmar a ata? Depois de confirmada, ela não muda mais.")) return;
    setBusy("confirmar");
    setMessage(null);
    try {
      await saveMinutes(meeting.id, clean(m));
      await confirmMinutes(meeting.id);
    } catch (e) {
      setMessage({ kind: "erro", text: e instanceof Error ? e.message : "Não foi possível confirmar." });
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-line">
      <p className="text-sm text-muted">
        Sem IA ligada, a ata é escrita por você. Ela só vale, e só entra na memória da empresa, depois de confirmada.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Resumo</span>
        <textarea
          value={m.summary}
          onChange={(e) => setM({ ...m, summary: e.target.value })}
          rows={4}
          placeholder="O que foi falado, em poucas linhas."
          className="resize-y rounded-xl bg-field px-3.5 py-3 text-[15px] ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Decisões</legend>
        {m.decisions.map((d, i) => (
          <div key={i} className="flex gap-2">
            <input
              aria-label={`Decisão ${i + 1}`}
              value={d.text}
              onChange={(e) => setM({ ...m, decisions: m.decisions.map((x, j) => (j === i ? { text: e.target.value } : x)) })}
              className={`${input} flex-1`}
            />
            <button
              type="button"
              aria-label={`Remover decisão ${i + 1}`}
              onClick={() => setM({ ...m, decisions: m.decisions.filter((_, j) => j !== i) })}
              className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-panel"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setM({ ...m, decisions: [...m.decisions, { text: "" }] })}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand"
        >
          <Plus className="size-4" /> Adicionar decisão
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Próximos passos</legend>
        {m.actionItems.map((a, i) => {
          const set = (patch: Partial<typeof a>) =>
            setM({ ...m, actionItems: m.actionItems.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
          return (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <input aria-label={`Passo ${i + 1}`} placeholder="O quê" value={a.text} onChange={(e) => set({ text: e.target.value })} className={`${input} col-span-1`} />
              <input aria-label={`Responsável pelo passo ${i + 1}`} placeholder="Quem" value={a.owner} onChange={(e) => set({ owner: e.target.value })} className={`${input} hidden sm:block`} />
              <input aria-label={`Prazo do passo ${i + 1}`} placeholder="Até quando" value={a.due} onChange={(e) => set({ due: e.target.value })} className={`${input} hidden sm:block`} />
              <button
                type="button"
                aria-label={`Remover passo ${i + 1}`}
                onClick={() => setM({ ...m, actionItems: m.actionItems.filter((_, j) => j !== i) })}
                className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-panel"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setM({ ...m, actionItems: [...m.actionItems, { text: "", owner: "", due: "" }] })}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand"
        >
          <Plus className="size-4" /> Adicionar passo
        </button>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Dúvidas em aberto</span>
        <textarea
          value={m.openQuestions}
          onChange={(e) => setM({ ...m, openQuestions: e.target.value })}
          rows={2}
          className="resize-y rounded-xl bg-field px-3.5 py-3 text-[15px] ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      {message && (
        <p role={message.kind === "erro" ? "alert" : "status"} className={`text-sm ${message.kind === "erro" ? "text-red-600" : "text-emerald-700"}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={save} disabled={busy !== null} className="h-10 rounded-xl px-4 text-sm ring-1 ring-line hover:bg-panel disabled:opacity-60">
          {busy === "salvar" ? "Salvando…" : "Salvar ata"}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={busy !== null || !canConfirm}
          title={canConfirm ? undefined : "Encerre a reunião antes de confirmar a ata."}
          className="h-10 rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {busy === "confirmar" ? "Confirmando…" : "Confirmar ata"}
        </button>
      </div>
    </div>
  );
}

/** Tira itens vazios antes de salvar. */
function clean(m: Minutes): Minutes {
  return {
    summary: m.summary.trim(),
    decisions: m.decisions.filter((d) => d.text.trim()),
    actionItems: m.actionItems.filter((a) => a.text.trim()),
    openQuestions: m.openQuestions.trim(),
  };
}

/* ---------- Sala ---------- */

export function MeetingRoom({ id }: { id: string }) {
  const { meeting, error, isLoading } = useMeeting(id);
  const [busy, setBusy] = useState<MeetingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function act(action: MeetingAction) {
    if (action === "cancelar" && !window.confirm("Cancelar esta reunião?")) return;
    if (action === "encerrar" && !window.confirm("Encerrar a reunião? Depois disso, a conversa fecha e fica a ata.")) return;
    setBusy(action);
    setActionError(null);
    try {
      await changeStatus(id, action);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Não foi possível mudar o status.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-8 sm:px-8 sm:py-10">
        <Link href="/agenda" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" /> Agenda
        </Link>

        {error ? (
          <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {error.message}
          </p>
        ) : isLoading || !meeting ? (
          <p className="text-sm text-muted">Carregando a reunião…</p>
        ) : (
          <>
            <header className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <Pollo {...POLLO_CEO} mood={meeting.status === "em_andamento" ? "animado" : "calmo"} size={56} title="Pollo CEO" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">{meeting.title}</h1>
                    <StatusBadge status={meeting.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted first-letter:uppercase">
                    {formatDay(meeting.startsAt, meeting.timezone)}, {formatTime(meeting.startsAt, meeting.timezone)} –{" "}
                    {formatTime(meeting.endsAt, meeting.timezone)}
                  </p>
                </div>
              </div>

              {meeting.isOwner && (
                <div className="flex flex-wrap gap-2">
                  {actionsFor(meeting).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => act(a)}
                      disabled={busy !== null}
                      className={`h-10 rounded-xl px-4 text-sm font-medium disabled:opacity-60 ${
                        a === "iniciar"
                          ? "bg-brand text-brand-foreground"
                          : a === "encerrar" || a === "agendar"
                            ? "bg-foreground text-background"
                            : "text-muted ring-1 ring-line hover:text-foreground"
                      }`}
                    >
                      {busy === a ? "Um momento…" : ACTION_LABEL[a]}
                    </button>
                  ))}
                  {(meeting.status === "rascunho" || meeting.status === "agendada") && (
                    <Link
                      href={`/agenda/${meeting.id}/editar`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm text-muted ring-1 ring-line hover:text-foreground"
                    >
                      <Pencil className="size-4" /> Editar
                    </Link>
                  )}
                </div>
              )}
              {actionError && (
                <p role="alert" className="text-sm text-red-600">
                  {actionError}
                </p>
              )}
            </header>

            <Section title="Pauta">
              <p className="rounded-2xl bg-panel/60 p-4 text-[15px] leading-relaxed whitespace-pre-wrap ring-1 ring-line">
                {meeting.agenda || <span className="text-muted">Sem pauta.</span>}
              </p>
            </Section>

            <Section title="Participantes">
              <ul className="flex flex-wrap gap-2">
                <li className="flex items-center gap-2 rounded-full bg-card py-1 pr-3 pl-1 text-sm ring-1 ring-line">
                  <Pollo {...POLLO_CEO} size={22} alive={false} title="Pollo CEO" /> Pollo CEO
                </li>
                {meeting.participants.map((p) => (
                  <li key={p.id} className="rounded-full bg-card px-3 py-1 text-sm ring-1 ring-line">
                    {p.name}
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              title="Conversa"
              aside={
                <button
                  type="button"
                  disabled
                  aria-describedby="voz-motivo"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-muted ring-1 ring-line"
                >
                  <Mic className="size-3.5" /> Entrar por voz
                  <span id="voz-motivo" className="sr-only">
                    Indisponível: a voz em tempo real ainda não está conectada.
                  </span>
                </button>
              }
            >
              <p className="text-xs text-muted">
                Voz em tempo real: não conectada. Nada é gravado nem transcrito nesta versão; a conversa é por texto. Com a IA
                ligada, o Pollo CEO conhece a pauta e a memória da empresa, e a ata continua sendo confirmada por você.
              </p>
              <MeetingChat meeting={meeting} />
            </Section>

            {meeting.status !== "rascunho" && meeting.status !== "agendada" && meeting.status !== "cancelada" && (
              <Section
                title="Ata"
                aside={
                  meeting.minutes?.confirmedAt ? null : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Lock className="size-3.5" /> Só vale depois de confirmada
                    </span>
                  )
                }
              >
                {meeting.minutes?.confirmedAt ? (
                  <MinutesView minutes={meeting.minutes} />
                ) : meeting.isOwner ? (
                  <MinutesEditor meeting={meeting} />
                ) : (
                  <p className="rounded-2xl bg-panel/60 p-4 text-sm text-muted ring-1 ring-line">
                    Quem marcou a reunião escreve e confirma a ata.
                  </p>
                )}
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
