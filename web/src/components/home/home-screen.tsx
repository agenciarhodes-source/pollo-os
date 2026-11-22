"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Bot, CalendarDays, Gauge, Info, LayoutGrid, Mic, Paperclip, PhoneCall } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";
import { authClient } from "@/lib/auth-client";
import { useMessages, useSendMessage } from "@/lib/client/data";
import { POLLO_CEO } from "@/lib/agents";

/**
 * As ações rápidas da Home. Só ficam habilitadas quando o que elas precisam funciona de verdade;
 * as outras aparecem desabilitadas, com o motivo.
 */
const ACTIONS = [
  { id: "voz", label: "Conversar por voz", icon: PhoneCall, href: null, reason: "A voz em tempo real ainda não está conectada." },
  { id: "reuniao", label: "Preparar reunião", icon: CalendarDays, href: null, reason: "A Agenda ainda não está disponível." },
  { id: "analisar", label: "Analisar empresa", icon: Gauge, href: null, reason: "Nenhuma fonte de dados está conectada." },
  { id: "agentes", label: "Acompanhar agentes", icon: Bot, href: "/agentes", reason: null },
] as const;

function DemoNotice() {
  return (
    <p
      role="note"
      className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200"
    >
      <Info className="mt-px size-4 flex-none" />
      <span>
        <strong className="font-semibold">Em demonstração.</strong> O Pollo CEO ainda não está ligado à inteligência
        artificial nem aos dados da sua empresa. As respostas desta conversa não são reais.
      </span>
    </p>
  );
}

export function HomeScreen() {
  const { messages: saved } = useMessages(POLLO_CEO.id);
  const { send, sending: typing, error: sendError } = useSendMessage(POLLO_CEO.id);
  const { data: activeOrg } = authClient.useActiveOrganization();
  const messages = saved.map((m) => ({ id: m.id, from: m.role === "user" ? "voce" : "agente", text: m.text }));
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const started = messages.length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing]);

  function submit() {
    if (!text.trim()) return;
    void send(text);
    setText("");
  }

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="w-full rounded-3xl bg-card p-2 shadow-[0_10px_40px_-20px_rgba(60,40,20,0.35)] ring-1 ring-line focus-within:ring-2 focus-within:ring-brand"
    >
      <label htmlFor="home-mensagem" className="sr-only">
        Mensagem para o Pollo CEO
      </label>
      <textarea
        id="home-mensagem"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={started ? 1 : 3}
        placeholder="Pergunte, peça uma análise ou combine o próximo passo…"
        className="max-h-48 w-full resize-none bg-transparent px-3 py-2.5 text-[16px] leading-relaxed outline-none placeholder:text-muted"
      />
      {sendError && (
        <p role="alert" className="px-3 pb-1 text-sm text-red-600">
          {sendError}
        </p>
      )}
      <div className="flex items-center gap-1 px-1">
        <button
          type="button"
          disabled
          aria-label="Anexar arquivo (indisponível: os anexos chegam com o servidor)"
          title="Os anexos chegam com o servidor."
          className="flex size-9 items-center justify-center rounded-full text-muted disabled:opacity-50"
        >
          <Paperclip className="size-[18px]" />
        </button>
        <button
          type="button"
          disabled
          aria-label="Falar (indisponível: o áudio ainda não está conectado)"
          title="O áudio ainda não está conectado."
          className="flex size-9 items-center justify-center rounded-full text-muted disabled:opacity-50"
        >
          <Mic className="size-[18px]" />
        </button>
        <span className="flex-1" />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Enviar"
          className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground transition disabled:opacity-40"
        >
          <ArrowUp className="size-5" />
        </button>
      </div>
    </form>
  );

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <header className="flex h-12 flex-none items-center justify-between gap-3 border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="flex-none font-medium">Home</span>
          <span className="text-muted" aria-hidden>
            ·
          </span>
          <span className="truncate text-muted">{activeOrg?.name ?? "…"}</span>
        </div>
        <span className="flex-none rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
          Em demonstração
        </span>
      </header>

      {!started ? (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-7 px-4 py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <Pollo {...POLLO_CEO} size={104} title="Pollo CEO" />
              <div>
                <p className="text-sm font-medium text-brand">Pollo CEO</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">O que vamos resolver hoje?</h1>
              </div>
            </div>

            {composer}

            <ul className="flex flex-wrap justify-center gap-2" aria-label="Ações rápidas">
              {ACTIONS.map(({ id, label, icon: Icon, href, reason }) => (
                <li key={id}>
                  {href ? (
                    <Link
                      href={href}
                      className="flex h-10 items-center gap-2 rounded-full bg-card px-4 text-sm ring-1 ring-line transition hover:ring-brand"
                    >
                      <Icon className="size-4 text-brand" strokeWidth={1.9} />
                      {label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      aria-describedby={`motivo-${id}`}
                      title={reason ?? undefined}
                      className="flex h-10 items-center gap-2 rounded-full px-4 text-sm text-muted ring-1 ring-line disabled:cursor-not-allowed"
                    >
                      <Icon className="size-4" strokeWidth={1.9} />
                      {label}
                      <span id={`motivo-${id}`} className="sr-only">
                        {reason}
                      </span>
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <section aria-labelledby="destaques" className="w-full rounded-2xl bg-panel/60 p-4 ring-1 ring-line">
              <h2 id="destaques" className="text-sm font-semibold">
                Destaques do dia
              </h2>
              <p className="mt-1 text-sm text-muted">
                Ainda não há destaques: nenhuma fonte de dados da empresa está conectada. Quando o FlipForm e o Flip
                Intelligence estiverem ligados, o Pollo CEO traz aqui até três pontos que merecem a sua atenção, com
                a origem e o período de cada um.
              </p>
              <Link href="/apps" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                <LayoutGrid className="size-4" /> Ver os apps
              </Link>
            </section>

            <DemoNotice />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <ol className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6" aria-label="Conversa com o Pollo CEO">
              <li>
                <DemoNotice />
              </li>
              {messages.map((m) =>
                m.from === "voce" ? (
                  <li
                    key={m.id}
                    className="ml-12 self-end rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] text-brand-foreground"
                  >
                    {m.text}
                  </li>
                ) : (
                  <li key={m.id} className="mr-8 flex items-start gap-3">
                    <Pollo {...POLLO_CEO} size={32} alive={false} title="Pollo CEO" />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-muted">
                        Pollo CEO <span className="text-amber-700">· demonstração</span>
                      </span>
                      <p className="rounded-2xl rounded-tl-md bg-panel px-4 py-2.5 text-[15px] leading-relaxed ring-1 ring-line">
                        {m.text}
                      </p>
                    </div>
                  </li>
                ),
              )}
              {typing && (
                <li className="flex items-center gap-3" aria-live="polite">
                  <Pollo {...POLLO_CEO} mood="pulando" size={32} title="Pollo CEO" />
                  <span className="text-sm text-muted">Pollo CEO está escrevendo…</span>
                </li>
              )}
            </ol>
            <div ref={endRef} />
          </div>
          <div className="mx-auto w-full max-w-2xl flex-none px-4 pb-4">{composer}</div>
        </>
      )}
    </main>
  );
}
