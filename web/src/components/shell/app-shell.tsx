"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";
import { ChatPanel, PolloButton } from "@/components/chat/chat-panel";
import { ChatProvider } from "@/components/chat/chat-provider";
import { MORE_NAV, PRIMARY_NAV, isActive, type NavItem } from "@/lib/navigation";

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`group relative flex size-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
        active ? "bg-card text-foreground shadow-sm ring-1 ring-line" : "text-muted hover:bg-card/60 hover:text-foreground"
      }`}
    >
      <Icon className="size-5" strokeWidth={1.75} />
      {/* Dica com o nome, ao passar o mouse ou chegar pelo teclado. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-full z-50 ml-2 rounded-lg bg-foreground px-2.5 py-1 text-xs whitespace-nowrap text-background opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {item.label}
      </span>
    </Link>
  );
}

/** A lista "Mais": um menu que sai do botão, no computador; uma folha de baixo, no celular. */
function MoreMenu({
  items,
  pathname,
  onClose,
  id,
  variant,
}: {
  items: NavItem[];
  pathname: string;
  onClose: () => void;
  id: string;
  variant: "popover" | "sheet";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    ref.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [onClose]);

  const list = (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-panel font-medium text-foreground" : "text-foreground/85 hover:bg-panel"
              }`}
            >
              <Icon className="size-[18px] text-muted" strokeWidth={1.75} />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (variant === "popover") {
    return (
      <div
        ref={ref}
        id={id}
        role="region"
        aria-label="Mais opções"
        className="absolute bottom-0 left-full z-50 ml-2 w-60 rounded-2xl bg-card p-2 shadow-xl ring-1 ring-line"
      >
        {list}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/20 md:hidden">
      <div ref={ref} id={id} role="region" aria-label="Mais opções" className="w-full rounded-t-3xl bg-card p-3 pb-6 shadow-2xl">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-sm font-medium text-muted">Mais</span>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-2 text-muted hover:bg-panel">
            <X className="size-5" />
          </button>
        </div>
        {list}
      </div>
    </div>
  );
}

/** Na barra do celular cabem quatro destinos; o resto vai para "Mais". */
const MOBILE_BAR = ["/", "/agenda", "/agentes", "/apps"];

/**
 * A moldura do Pollo OS: o menu de ícones à esquerda (no celular, uma barra embaixo)
 * e o espaço do conteúdo.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Qual "Mais" está aberto: o do menu lateral ou o da barra do celular.
  const [more, setMore] = useState<"rail" | "bar" | null>(null);
  const closeMore = () => setMore(null);
  const moreId = useId();
  const moreActive = MORE_NAV.some((i) => isActive(i.href, pathname));

  const mobilePrimary = PRIMARY_NAV.filter((i) => MOBILE_BAR.includes(i.href));
  const mobileMore = [...PRIMARY_NAV.filter((i) => !MOBILE_BAR.includes(i.href)), ...MORE_NAV];
  const mobileMoreActive = mobileMore.some((i) => isActive(i.href, pathname));

  return (
    <div className="flex h-dvh overflow-hidden bg-panel text-foreground">
      <nav aria-label="Menu principal" className="hidden w-16 flex-none flex-col items-center gap-1 py-3 md:flex">
        <Link href="/" aria-label="Pollo OS, Home" className="mb-3 flex size-11 items-center justify-center">
          <Pollo shape="quadrado" color="laranja" face="olhos" mood="calmo" size={30} />
        </Link>
        {PRIMARY_NAV.map((item) => (
          <RailLink key={item.href} item={item} active={isActive(item.href, pathname)} />
        ))}
        <div className="relative mt-auto">
          <button
            type="button"
            onClick={() => setMore((v) => (v === "rail" ? null : "rail"))}
            // Sem isto, o clique "fora do menu" fecharia e o mesmo clique reabriria.
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Mais"
            aria-expanded={more === "rail"}
            aria-controls={more === "rail" ? moreId : undefined}
            className={`flex size-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
              moreActive || more === "rail" ? "bg-card text-foreground ring-1 ring-line" : "text-muted hover:bg-card/60 hover:text-foreground"
            }`}
          >
            <MoreHorizontal className="size-5" strokeWidth={1.75} />
          </button>
          {more === "rail" && (
            <MoreMenu items={MORE_NAV} pathname={pathname} onClose={closeMore} id={moreId} variant="popover" />
          )}
        </div>
        <span
          role="img"
          aria-label="Sua conta"
          className="mt-2 flex size-8 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-brand-foreground"
        >
          A
        </span>
      </nav>

      <div className="flex min-w-0 flex-1 pb-16 md:p-2 md:pb-2 md:pl-0">{children}</div>

      {/* Celular: barra de baixo com os destinos principais e "Mais". */}
      <nav
        aria-label="Menu principal"
        className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t border-line bg-panel/95 backdrop-blur md:hidden"
      >
        {mobilePrimary.map(({ href, label, short, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-16 flex-col items-center gap-1 text-[11px] ${active ? "text-brand" : "text-muted"}`}
            >
              <Icon className="size-5" strokeWidth={1.75} />
              {short ?? label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMore("bar")}
          aria-expanded={more === "bar"}
          className={`flex min-w-16 flex-col items-center gap-1 text-[11px] ${mobileMoreActive ? "text-brand" : "text-muted"}`}
        >
          <MoreHorizontal className="size-5" strokeWidth={1.75} />
          Mais
        </button>
      </nav>
      {more === "bar" && (
        <MoreMenu items={mobileMore} pathname={pathname} onClose={closeMore} id={`${moreId}-m`} variant="sheet" />
      )}

      <PolloButton />
      <ChatPanel />
    </div>
  );
}

/** A moldura com a conversa disponível em qualquer tela. */
export function AppShellWithChat({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <AppShell>{children}</AppShell>
    </ChatProvider>
  );
}
