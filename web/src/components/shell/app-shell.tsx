"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CircleHelp,
  LayoutGrid,
  ListChecks,
  MoreHorizontal,
  Settings,
  Shapes,
  Workflow,
} from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";

const MAIN = [
  { href: "/", label: "Agentes", icon: Bot },
  { href: "/rotinas", label: "Rotinas", icon: Workflow },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/apps", label: "Apps Pollo", icon: LayoutGrid },
  { href: "/criaturas", label: "Criaturas", icon: Shapes },
];

const FOOT = [
  { href: "/ajuda", label: "Ajuda", icon: CircleHelp },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function RailLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Bot;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex size-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
        active ? "bg-card text-foreground shadow-sm ring-1 ring-line" : "text-muted hover:bg-card/60 hover:text-foreground"
      }`}
    >
      <Icon className="size-5" strokeWidth={1.75} />
    </Link>
  );
}

/**
 * A moldura do Pollo OS: o menu de ícones à esquerda (no celular, uma barra embaixo)
 * e o espaço do conteúdo.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div className="flex h-dvh overflow-hidden bg-panel text-foreground">
      <nav
        aria-label="Menu principal"
        className="hidden w-16 flex-none flex-col items-center gap-1 py-3 md:flex"
      >
        <Link href="/" aria-label="Pollo OS, início" className="mb-3 flex size-11 items-center justify-center">
          <Pollo shape="quadrado" color="marrom" face="olhos" mood="calmo" size={30} />
        </Link>
        {MAIN.map((item) => (
          <RailLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
        <button
          type="button"
          aria-label="Mais"
          title="Mais"
          className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-card/60 hover:text-foreground"
        >
          <MoreHorizontal className="size-5" strokeWidth={1.75} />
        </button>
        <div className="mt-auto flex flex-col items-center gap-1">
          {FOOT.map((item) => (
            <RailLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
          <span
            aria-label="Sua conta"
            className="mt-2 flex size-8 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-brand-foreground"
          >
            A
          </span>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 pb-16 md:p-2 md:pb-2 md:pl-0">{children}</div>

      {/* Celular: barra de baixo com os mesmos destinos. */}
      <nav
        aria-label="Menu principal"
        className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t border-line bg-panel/95 backdrop-blur md:hidden"
      >
        {MAIN.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex min-w-16 flex-col items-center gap-1 text-[11px] ${
              isActive(href) ? "text-brand" : "text-muted"
            }`}
          >
            <Icon className="size-5" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
        <Link href="/configuracoes" className="flex min-w-16 flex-col items-center gap-1 text-[11px] text-muted">
          <Settings className="size-5" strokeWidth={1.75} />
          Ajustes
        </Link>
      </nav>
    </div>
  );
}
