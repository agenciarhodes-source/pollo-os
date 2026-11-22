"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Lock, Plus, Search, Sparkles, X } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";
import { useAgents, type Agent } from "@/lib/agents";
import { CONNECTIONS, POLLO_APPS, setAppAccess, useAppAccess, type PolloApp } from "@/lib/apps";

function AppIcon({ app, size = 64 }: { app: PolloApp; size?: number }) {
  const Icon = app.icon;
  return (
    <span
      className="relative flex flex-none items-center justify-center rounded-[28%] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)]"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 120% at 25% 15%, ${app.from} 0%, ${app.to} 70%)`,
      }}
      aria-hidden
    >
      {/* Reflexo de luz, como nos Pollos. */}
      <span className="absolute top-[10%] left-[16%] h-[22%] w-[34%] rounded-full bg-white/35 blur-[3px]" />
      <Icon className="relative text-white" style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={1.9} />
    </span>
  );
}

/** Os módulos que vivem dentro do app, como etiquetas na cor dele. */
function Modules({ app }: { app: PolloApp }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {app.includes.map((m) => (
        <span
          key={m}
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ color: app.to, background: `${app.to}14`, boxShadow: `inset 0 0 0 1px ${app.to}33` }}
        >
          {m}
        </span>
      ))}
    </span>
  );
}

function StatusBadge({ app }: { app: PolloApp }) {
  return app.status === "disponivel" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Disponível
    </span>
  ) : (
    <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-line">Em breve</span>
  );
}

function AgentStack({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) return <span className="text-xs text-muted">Nenhum agente ainda</span>;
  const shown = agents.slice(0, 4);
  return (
    <span className="flex items-center gap-2">
      <span className="flex -space-x-2">
        {shown.map((a) => (
          <span key={a.id} className="rounded-full bg-card p-0.5 ring-2 ring-card">
            <Pollo {...a} size={22} alive={false} />
          </span>
        ))}
      </span>
      <span className="text-xs text-muted">
        {agents.length === 1 ? "1 agente" : `${agents.length} agentes`}
      </span>
    </span>
  );
}

function AppPanel({
  app,
  agents,
  allowed,
  onToggle,
  onClose,
}: {
  app: PolloApp;
  agents: Agent[];
  allowed: string[];
  onToggle: (agentId: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-label={app.name}
        className="relative flex h-full w-full flex-col overflow-y-auto bg-card shadow-2xl md:m-3 md:h-[calc(100%-24px)] md:max-w-md md:rounded-3xl md:ring-1 md:ring-line"
      >
        <header className="flex items-start gap-4 p-6 pb-4">
          <AppIcon app={app} size={72} />
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-xl font-semibold tracking-tight">{app.name}</h2>
            <p className="text-sm text-muted">{app.tagline}</p>
            <div className="mt-2">
              <StatusBadge app={app} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-panel hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex flex-col gap-7 px-6 pb-6">
          <div className="flex flex-col gap-3">
            <p className="leading-relaxed text-foreground/85">{app.description}</p>
            <Modules app={app} />
          </div>

          <div>
            <button
              type="button"
              disabled
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background disabled:opacity-40"
            >
              Abrir {app.name}
              <ArrowUpRight className="size-4" />
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              {app.status === "disponivel"
                ? "O app abre aqui assim que for ligado ao Pollo OS."
                : "Este app ainda está sendo preparado."}
            </p>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-brand" />O que os seus agentes fazem aqui
            </h3>
            <ul className="flex flex-col gap-2">
              {app.abilities.map((a) => (
                <li key={a.text} className="flex items-start gap-3 rounded-xl bg-panel/60 px-3.5 py-2.5 text-sm">
                  <span className="mt-1.5 size-1.5 flex-none rounded-full bg-brand" />
                  <span className="flex-1">{a.text}</span>
                  {a.approval && (
                    <span className="flex flex-none items-center gap-1 text-xs text-muted" title="Pede a sua aprovação antes">
                      <Lock className="size-3.5" /> Com aprovação
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold">Agentes com acesso</h3>
            <p className="mb-3 text-xs text-muted">Escolha quem pode trabalhar no {app.name}.</p>
            {agents.length === 0 ? (
              <Link
                href="/"
                className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-line ring-dashed hover:ring-brand"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-panel text-muted">
                  <Plus className="size-5" />
                </span>
                <span className="text-sm">
                  <span className="block font-medium">Crie o seu primeiro agente</span>
                  <span className="text-muted">Depois ele aparece aqui.</span>
                </span>
              </Link>
            ) : (
              <ul className="flex flex-col gap-1">
                {agents.map((agent) => {
                  const on = allowed.includes(agent.id);
                  return (
                    <li key={agent.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 hover:bg-panel/60">
                        <Pollo {...agent} size={36} alive={on} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{agent.name}</span>
                          <span className="block truncate text-xs text-muted">{on ? "Pode trabalhar aqui" : "Sem acesso"}</span>
                        </span>
                        <input
                          type="checkbox"
                          role="switch"
                          aria-label={`${agent.name} pode trabalhar no ${app.name}`}
                          checked={on}
                          onChange={() => onToggle(agent.id)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className="relative h-6 w-10 flex-none rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function AppsScreen() {
  const agents = useAgents();
  const access = useAppAccess();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const apps = POLLO_APPS.filter((a) => !q || `${a.name} ${a.tagline}`.toLowerCase().includes(q));
  const connections = CONNECTIONS.filter((c) => !q || c.name.toLowerCase().includes(q));
  const openApp = POLLO_APPS.find((a) => a.id === openId) ?? null;

  const agentsIn = (appId: string) => agents.filter((a) => (access[appId] ?? []).includes(a.id));

  function toggle(appId: string, agentId: string) {
    const current = access[appId] ?? [];
    const next = current.includes(agentId) ? current.filter((id) => id !== agentId) : [...current, agentId];
    setAppAccess({ ...access, [appId]: next });
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Apps Pollo</h1>
            <p className="mt-1.5 max-w-lg text-muted">
              Tudo o que a sua empresa usa, num lugar só. E os seus agentes trabalham dentro de cada app.
            </p>
          </div>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl bg-panel/70 px-3 ring-1 ring-line focus-within:ring-brand sm:w-64">
            <Search className="size-4 text-muted" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar app"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </label>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-medium text-muted">Apps da Pollo</h2>
          {apps.length === 0 ? (
            <p className="rounded-2xl bg-panel/60 p-6 text-center text-sm text-muted">Nenhum app com esse nome.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {apps.map((app) => (
                <li key={app.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(app.id)}
                    className="group flex h-full w-full flex-col gap-5 rounded-3xl bg-card p-5 text-left ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(60,40,20,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="flex items-start gap-4">
                      <AppIcon app={app} />
                      <span className="min-w-0 flex-1 pt-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-lg font-semibold">{app.name}</span>
                          <StatusBadge app={app} />
                        </span>
                        <span className="block text-sm text-muted">{app.tagline}</span>
                      </span>
                    </span>
                    <span className="text-sm leading-relaxed text-foreground/80">{app.description}</span>
                    <Modules app={app} />
                    <span className="mt-auto flex items-center justify-between border-t border-line pt-4">
                      <AgentStack agents={agentsIn(app.id)} />
                      <span className="text-sm font-medium text-brand opacity-80 transition group-hover:opacity-100">
                        Ver detalhes
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {connections.length > 0 && (
          <section>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-sm font-medium text-muted">Outros apps que os agentes vão poder usar</h2>
              <span className="text-xs text-muted">Em breve</span>
            </div>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {connections.map(({ id, name, icon: Icon }) => (
                <li
                  key={id}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-panel/50 px-2 py-4 text-center ring-1 ring-line"
                >
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-card text-muted ring-1 ring-line">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-xs leading-tight">{name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {openApp && (
        <AppPanel
          app={openApp}
          agents={agents}
          allowed={access[openApp.id] ?? []}
          onToggle={(agentId) => toggle(openApp.id, agentId)}
          onClose={() => setOpenId(null)}
        />
      )}
    </main>
  );
}
