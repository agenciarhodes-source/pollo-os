"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { POLLO_CEO, useAgents, type Agent } from "@/lib/agents";

export type Message = {
  id: string;
  from: "voce" | "agente";
  text: string;
};

type ChatState = {
  isOpen: boolean;
  agent: Agent;
  /** Os agentes com quem se pode conversar: o Pollo CEO primeiro, depois os criados. */
  agents: Agent[];
  messages: Message[];
  typing: boolean;
  open: (agentId?: string) => void;
  close: () => void;
  switchTo: (agentId: string) => void;
  send: (text: string) => void;
  /** A conversa de um agente qualquer, como a Home lê a do Pollo CEO sem abrir o painel. */
  threadOf: (agentId: string) => { messages: Message[]; typing: boolean };
  sendTo: (agentId: string, text: string) => void;
};

const ChatContext = createContext<ChatState | null>(null);

/*
 * Ainda não há servidor nem inteligência artificial ligados. O agente responde
 * com uma mensagem que diz isso, para a conversa já funcionar de ponta a ponta.
 */
function replyFor(agent: Agent, text: string) {
  const asked = text.length > 80 ? `${text.slice(0, 80)}…` : text;
  return `Em demonstração: recebi “${asked}”, mas ainda não estou ligado à inteligência artificial nem aos dados da sua empresa. Esta não é uma resposta real. Quando o servidor do Pollo OS estiver pronto, ${agent.name === POLLO_CEO.name ? "eu respondo" : `${agent.name} responde`} de verdade.`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const saved = useAgents();
  const agents = useMemo(() => [POLLO_CEO, ...saved], [saved]);

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

  const sendTo = useCallback(
    (toId: string, raw: string) => {
      const text = raw.trim();
      const to = agents.find((a) => a.id === toId);
      if (!text || !to) return;
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
    [agents],
  );

  const send = useCallback((raw: string) => sendTo(agent.id, raw), [sendTo, agent.id]);
  const threadOf = useCallback(
    (id: string) => ({ messages: byAgent[id] ?? [], typing: typingFor === id }),
    [byAgent, typingFor],
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
    threadOf,
    sendTo,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat precisa estar dentro de ChatProvider.");
  return ctx;
}
