"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, ChevronDown, X } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";
import { useChat } from "./chat-provider";
import { RichText } from "./rich-text";
import { useAgentChat } from "@/lib/client/data";
import { useAiStatus } from "@/lib/client/stream";

const STARTERS = ["O que você sabe fazer?", "Me ajude a organizar o meu dia", "Resuma o que aconteceu hoje"];

/** O botão Pollo: a criatura viva no canto da tela que abre a conversa. */
export function PolloButton() {
  const { isOpen, agent, open } = useChat();
  const pathname = usePathname();
  // Na Home a conversa com o Pollo CEO já é o centro da tela.
  if (isOpen || pathname === "/") return null;

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label={`Conversar com ${agent.name}`}
      title={`Conversar com ${agent.name}`}
      className="group fixed right-5 bottom-20 z-30 flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand md:right-6 md:bottom-6"
    >
      <span className="pointer-events-none hidden translate-x-2 rounded-full bg-foreground px-3 py-1.5 text-sm text-background opacity-0 shadow-lg transition group-hover:translate-x-0 group-hover:opacity-100 md:block">
        Conversar com {agent.name}
      </span>
      <Pollo shape={agent.shape} color={agent.color} face={agent.face} mood={agent.mood} size={60} />
    </button>
  );
}

/** A conversa com o agente: um painel à direita (no celular, a tela inteira). */
export function ChatPanel() {
  const { isOpen, agent, agents, close, switchTo } = useChat();
  const { messages: saved, send, sending, error: sendError } = useAgentChat(agent.id);
  const ai = useAiStatus();
  const messages = saved.map((m) => ({ id: m.id, from: m.role === "user" ? "voce" : "agente", text: m.text, demo: m.demo }));
  // "escrevendo…" só até o primeiro pedaço da resposta aparecer.
  const typing = sending && saved.at(-1)?.role === "user";
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, agent.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing]);

  if (!isOpen) return null;

  function submit() {
    if (!text.trim()) return;
    send(text);
    setText("");
  }

  return (
    <section
      role="dialog"
      aria-label={`Conversa com ${agent.name}`}
      className="fixed inset-0 z-40 flex flex-col bg-card md:inset-auto md:right-6 md:bottom-6 md:h-[min(640px,calc(100dvh-48px))] md:w-[400px] md:rounded-3xl md:shadow-2xl md:ring-1 md:ring-line"
    >
      <header className="flex h-16 flex-none items-center gap-3 border-b border-line px-4">
        <Pollo shape={agent.shape} color={agent.color} face={agent.face} mood={agent.mood} size={36} />
        <div className="min-w-0 flex-1">
          {agents.length > 1 ? (
            <label className="relative flex items-center">
              <span className="sr-only">Escolher agente</span>
              <select
                value={agent.id}
                onChange={(e) => switchTo(e.target.value)}
                className="w-full appearance-none truncate bg-transparent pr-6 font-medium outline-none"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 size-4 text-muted" />
            </label>
          ) : (
            <p className="truncate font-medium">{agent.name}</p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`size-1.5 rounded-full ${ai?.enabled ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden />
            {typing ? "escrevendo…" : ai?.enabled ? "IA ligada" : "Em demonstração, sem IA ligada"}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Fechar conversa"
          className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-panel hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Pollo shape={agent.shape} color={agent.color} face={agent.face} mood={agent.mood} size={88} />
            <div>
              <p className="text-lg font-semibold">Oi! Eu sou {agent.name}.</p>
              {agent.purpose && <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{agent.purpose}</p>}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full px-3 py-1.5 text-sm ring-1 ring-line hover:ring-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {messages.map((m) =>
              m.from === "voce" ? (
                <li key={m.id} className="ml-10 self-end rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-[15px] text-brand-foreground">
                  {m.text}
                </li>
              ) : (
                <li key={m.id} className="mr-6 flex items-end gap-2">
                  <Pollo shape={agent.shape} color={agent.color} face={agent.face} size={26} alive={false} />
                  <div className="rounded-2xl rounded-bl-md bg-panel px-3.5 py-2 text-[15px] leading-relaxed ring-1 ring-line">
                    {m.demo && <span className="mb-1 block text-xs text-amber-700">demonstração</span>}
                    <RichText text={m.text} />
                  </div>
                </li>
              ),
            )}
            {typing && (
              <li className="flex items-end gap-2" aria-live="polite">
                <Pollo shape={agent.shape} color={agent.color} face={agent.face} mood="pulando" size={26} />
                <span className="rounded-2xl rounded-bl-md bg-panel px-3.5 py-2 text-sm text-muted ring-1 ring-line">
                  {agent.name} está digitando…
                </span>
              </li>
            )}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      {sendError && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-600">
          {sendError}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-none items-end gap-2 border-t border-line p-3"
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={`Mensagem para ${agent.name}`}
          aria-label={`Mensagem para ${agent.name}`}
          className="max-h-36 min-h-11 flex-1 resize-none rounded-2xl bg-field px-3.5 py-2.5 text-[15px] ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Enviar"
          className="flex size-11 flex-none items-center justify-center rounded-full bg-brand text-brand-foreground transition disabled:opacity-40"
        >
          <ArrowUp className="size-5" />
        </button>
      </form>
    </section>
  );
}
