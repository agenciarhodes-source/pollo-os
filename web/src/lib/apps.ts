"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  Calendar,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  Handshake,
  HardDrive,
  Hash,
  Mail,
  MessageCircle,
  Radar,
  type LucideIcon,
} from "lucide-react";

export type AppStatus = "disponivel" | "em-breve";

export type PolloApp = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** As duas cores do degradê do ícone. */
  from: string;
  to: string;
  status: AppStatus;
  /** O que um agente faz dentro do app. approval = pede a sua aprovação antes. */
  abilities: { text: string; approval?: boolean }[];
};

/** Os apps da Pollo: os sistemas que o Pollo OS reúne. */
export const POLLO_APPS: PolloApp[] = [
  {
    id: "flipform",
    name: "Flipform",
    tagline: "Formulários inteligentes",
    description:
      "Crie formulários, pesquisas e quizzes em minutos e receba as respostas já organizadas, prontas para decidir.",
    icon: ClipboardList,
    from: "#F7AE6B",
    to: "#CA6E23",
    status: "disponivel",
    abilities: [
      { text: "Criar um formulário a partir de uma conversa" },
      { text: "Resumir as respostas e apontar o que chama atenção" },
      { text: "Avisar quando chegar uma resposta nova" },
      { text: "Enviar o link do formulário para os seus contatos", approval: true },
    ],
  },
  {
    id: "flip-intelligence",
    name: "Flip Intelligence",
    tagline: "Inteligência de negócios",
    description:
      "Os números da empresa em painéis claros: vendas, metas e resultados, atualizados sem planilha.",
    icon: ChartNoAxesCombined,
    from: "#8CC0FF",
    to: "#3478E0",
    status: "disponivel",
    abilities: [
      { text: "Ler os painéis e explicar o que mudou" },
      { text: "Montar o relatório da semana" },
      { text: "Alertar quando um número sair do normal" },
      { text: "Compartilhar um painel com outra pessoa", approval: true },
    ],
  },
  {
    id: "mercado",
    name: "Painel de Mercado",
    tagline: "Inteligência de mercado",
    description: "Preços, concorrentes e tendências do seu setor, acompanhados de perto e num lugar só.",
    icon: Radar,
    from: "#7FE3B9",
    to: "#22A774",
    status: "em-breve",
    abilities: [
      { text: "Acompanhar os concorrentes que você escolher" },
      { text: "Avisar quando um preço do mercado mudar" },
      { text: "Mandar um resumo semanal do setor" },
    ],
  },
  {
    id: "crm-erp",
    name: "CRM de Vendas",
    tagline: "Vendas integradas ao ERP",
    description: "Clientes, funil e pedidos conversando com o seu ERP, sem digitar a mesma coisa duas vezes.",
    icon: Handshake,
    from: "#C6ADFF",
    to: "#8A5CE6",
    status: "em-breve",
    abilities: [
      { text: "Registrar contatos e conversas com clientes" },
      { text: "Consultar pedidos e estoque no ERP" },
      { text: "Lembrar de quem está esperando retorno" },
      { text: "Mudar a etapa de uma venda no funil", approval: true },
    ],
  },
];

/** Outros apps que a empresa já usa e que os agentes poderão acessar. */
export const CONNECTIONS: { id: string; name: string; icon: LucideIcon }[] = [
  { id: "gmail", name: "Gmail", icon: Mail },
  { id: "agenda", name: "Google Agenda", icon: Calendar },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle },
  { id: "drive", name: "Google Drive", icon: HardDrive },
  { id: "slack", name: "Slack", icon: Hash },
  { id: "notion", name: "Notion", icon: FileText },
];

/*
 * Quais agentes podem trabalhar em cada app: { [appId]: agentIds[] }.
 * Guardado neste navegador até o servidor existir.
 */
const KEY = "pollo-os:apps-acesso";
const CHANGED = "pollo-os:apps-acesso-mudou";
let memory = "{}";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "{}";
  } catch {
    return memory;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

export function useAppAccess(): Record<string, string[]> {
  const raw = useSyncExternalStore(subscribe, read, () => "{}");
  return useMemo(() => {
    try {
      return JSON.parse(raw) as Record<string, string[]>;
    } catch {
      return {};
    }
  }, [raw]);
}

export function setAppAccess(access: Record<string, string[]>) {
  memory = JSON.stringify(access);
  try {
    localStorage.setItem(KEY, memory);
  } catch {
    // Fica só na memória.
  }
  window.dispatchEvent(new Event(CHANGED));
}
