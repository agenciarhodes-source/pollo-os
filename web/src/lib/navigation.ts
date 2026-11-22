import {
  Activity,
  Bot,
  Brain,
  CalendarDays,
  CircleHelp,
  Gauge,
  Home,
  LayoutGrid,
  ListChecks,
  Settings,
  Shapes,
  Sparkles,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Rótulo curto para a barra do celular. */
  short?: string;
  icon: LucideIcon;
};

/**
 * O menu principal, na ordem da diretriz de produto v2. A Pollo OS não é um CRM:
 * nenhum item aqui gere leads, funil ou ERP; isso vive no FlipForm.
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/visao-geral", label: "Visão Geral", short: "Visão", icon: Gauge },
  { href: "/agentes", label: "Agentes & Operações", short: "Agentes", icon: Bot },
  { href: "/segundo-cerebro", label: "Segundo Cérebro", short: "Cérebro", icon: Brain },
  { href: "/apps", label: "Apps", icon: LayoutGrid },
];

/** A área secundária "Mais": as primitivas que não precisam de um item de primeiro nível. */
export const MORE_NAV: NavItem[] = [
  { href: "/rotinas", label: "Rotinas", icon: Workflow },
  { href: "/aprovacoes", label: "Decisões & Aprovações", icon: ListChecks },
  { href: "/atividade", label: "Atividade", icon: Activity },
  { href: "/consumo", label: "Consumo & Custos", icon: Wallet },
  { href: "/habilidades", label: "Habilidades", icon: Sparkles },
  { href: "/agentes/criaturas", label: "Criaturas", icon: Shapes },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/ajuda", label: "Ajuda", icon: CircleHelp },
];

export { LEGACY_REDIRECTS } from "./legacy-redirects";

/** O item está ativo neste endereço? A Home só no próprio "/"; os outros também nas subpáginas. */
export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/agentes") return pathname === "/agentes";
  return pathname === href || pathname.startsWith(`${href}/`);
}
