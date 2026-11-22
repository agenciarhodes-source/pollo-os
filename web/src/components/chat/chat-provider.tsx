"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { POLLO, useAgents, type Agent } from "@/lib/agents";

export type Message = {
  id: string;
  from: "voce" | "agente";
  text: string;
};

type ChatState = {
  isOpen: boolean;
  agent: Agent;
  /** Os agentes com quem se pode conversar: os criados ou, sem nenhum, o Pollo. */
  agents: Agent[];
  messages: Message[];
  typing: boolean;
  open: (agentId?: string) => void;
  close: () => void;
  switchTo: (agentId: string) => void;
  send: (text: string) => void;
};

const ChatContext = createContext<ChatState | null>(null);

/*
 * Ainda não há servidor nem inteligência artificial ligados. O agente responde
 * com uma mensagem que diz isso, para a conversa já funcionar de ponta a ponta.
 */
function replyFor(agent: Agent, text: string) {
  const asked = text.length > 80 ? `${text.slice(0, 80)}…` : text;
  return `Anotei: “${asked}”. Ainda não estou ligado à inteligência artificial, então por enquanto só consigo conversar assim. Quando o servidor do Pollo OS estiver pronto, eu respondo de verdade${
    agent.purpose ? " e cuido disso por você" : ""
  }.`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const saved = useAgents();
  const agents = useMemo(() => (saved.length > 0 ? saved : [POLLO]), [saved]);

  const [isOpen, setOpen] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [byAgent, setByAgent] = useState<Record<string, Message[]>>({});
  const [typingFor, setTypingFor] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const agent = agents.find((a) => a.id === agentId) ?? agents[0];

  const open = useCallback((id?: string) => {
    if (id) setAgentId(id);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const switchTo = useCallback((id: string) => setAgentId(id), []);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const to = agent;
      setByAgent((m) => ({
        ...m,
        [to.id]: [...(m[to.id] ?? []), { id: crypto.randomUUID(), from: "voce", text }],
      }));
      setTypingFor(to.id);
      const t = window.setTimeout(() => {
        setTypingFor((cur) => (cur === to.id ? null : cur));
        setByAgent((m) => ({
          ...m,
          [to.id]: [...(m[to.id] ?? []), { id: crypto.randomUUID(), from: "agente", text: replyFor(to, text) }],
        }));
      }, 1100);
      timers.current.push(t);
    },
    [agent],
  );

  const value: ChatState = {
    isOpen,
    agent,
    agents,
    messages: byAgent[agent.id] ?? [],
    typing: typingFor === agent.id,
    open,
    close,
    switchTo,
    send,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat precisa estar dentro de ChatProvider.");
  return ctx;
}
