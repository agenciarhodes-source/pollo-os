import {
  Calendar,
  ChartNoAxesCombined,
  FileText,
  HardDrive,
  Hash,
  Layers,
  Mail,
  MessageCircle,
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
  /** Os módulos que vivem dentro do app. */
  includes: string[];
  /** O que um agente faz dentro do app. approval = pede a sua aprovação antes. */
  abilities: { text: string; approval?: boolean }[];
};

/**
 * Os apps da Pollo: os sistemas que o Pollo OS reúne. São dois, e cada um
 * inclui módulos: o CRM de vendas vive dentro do FlipForm e o Painel de
 * Mercado dentro do Flip Intelligence. Cores oficiais: FlipForm #2F6FB8,
 * Flip Intelligence #2E8A68.
 */
export const POLLO_APPS: PolloApp[] = [
  {
    id: "flipform",
    name: "FlipForm",
    tagline: "Operação comercial e relacionamento",
    description:
      "Leads, atendimento e WhatsApp, funil de vendas, tarefas e agenda, com o CRM de vendas integrado ao ERP. Tudo o que a equipe comercial faz, num lugar só.",
    icon: Layers,
    from: "#7FAEE6",
    to: "#2F6FB8",
    status: "disponivel",
    includes: ["CRM de vendas", "Formulários", "Atendimento e WhatsApp", "Funil e agenda", "Integração com o ERP"],
    abilities: [
      { text: "Registrar leads e conversas com clientes" },
      { text: "Sugerir respostas no atendimento para a equipe revisar" },
      { text: "Criar um formulário a partir de uma conversa" },
      { text: "Consultar pedidos e estoque no ERP" },
      { text: "Lembrar de quem está esperando retorno" },
      { text: "Mudar a etapa de uma venda no funil", approval: true },
      { text: "Enviar uma mensagem para um cliente", approval: true },
    ],
  },
  {
    id: "flip-intelligence",
    name: "Flip Intelligence",
    tagline: "Análise e inteligência de negócios",
    description:
      "Os indicadores da empresa em painéis claros e o Painel de Mercado, com preços, concorrentes e tendências do setor. Os números de dentro e de fora, lado a lado.",
    icon: ChartNoAxesCombined,
    from: "#6FCBA5",
    to: "#2E8A68",
    status: "disponivel",
    includes: ["Indicadores e painéis", "Painel de Mercado", "Relatórios", "Alertas"],
    abilities: [
      { text: "Ler os painéis e explicar o que mudou" },
      { text: "Montar o relatório da semana" },
      { text: "Alertar quando um número sair do normal" },
      { text: "Acompanhar concorrentes e preços no Painel de Mercado" },
      { text: "Mandar um resumo semanal do setor" },
      { text: "Compartilhar um painel com outra pessoa", approval: true },
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
