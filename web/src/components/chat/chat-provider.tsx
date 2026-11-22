"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { POLLO_CEO, type Agent } from "@/lib/agents";
import { useAgents } from "@/lib/client/data";

type ChatState = {
  isOpen: boolean;
  agent: Agent;
  /** Os agentes com quem se pode conversar: o Pollo CEO primeiro, depois os da empresa. */
  agents: Agent[];
  open: (agentId?: string) => void;
  close: () => void;
  switchTo: (agentId: string) => void;
};

const ChatContext = createContext<ChatState | null>(null);

/**
 * Qual conversa está aberta no painel e com quem. As mensagens em si vêm do servidor
 * (useMessages), salvas por empresa, pessoa e agente.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { agents: saved } = useAgents();
  const agents = useMemo(() => [POLLO_CEO, ...saved], [saved]);

  const [isOpen, setOpen] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const agent = agents.find((a) => a.id === agentId) ?? agents[0];

  const open = useCallback((id?: string) => {
    if (id) setAgentId(id);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const switchTo = useCallback((id: string) => setAgentId(id), []);

  return (
    <ChatContext.Provider value={{ isOpen, agent, agents, open, close, switchTo }}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat precisa estar dentro de ChatProvider.");
  return ctx;
}
