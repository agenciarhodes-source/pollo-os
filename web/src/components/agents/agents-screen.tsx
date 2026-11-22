"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Filter, LayoutGrid, MessageCircle, Plus, Search, X } from "lucide-react";
import {
  COLORS,
  FACES,
  MOODS,
  Pollo,
  SHAPES,
} from "@/components/pollo/pollo";
import { saveAgents, toDraft, useAgents, type Agent, type Draft } from "@/lib/agents";
import { useChat } from "@/components/chat/chat-provider";

const MODELS = [
  { id: "equilibrado", label: "Pollo IA", detail: "Equilibrado" },
  { id: "rapido", label: "Pollo IA", detail: "Rápido" },
  { id: "avancado", label: "Pollo IA", detail: "Avançado" },
];

const SUGGESTIONS: (Draft & { blurb: string })[] = [
  {
    name: "Assistente de e-mail",
    blurb: "Rascunha respostas e não deixa nenhum retorno passar.",
    purpose: "Ler meus e-mails, rascunhar respostas e me lembrar de quem está esperando retorno.",
    model: "equilibrado",
    shape: "gota",
    color: "rosa",
    face: "sorriso",
    mood: "animado",
  },
  {
    name: "Atendimento",
    blurb: "Responde clientes no site e no WhatsApp e chama você quando precisa.",
    purpose: "Responder dúvidas de clientes e me chamar quando o assunto precisar de uma pessoa.",
    model: "rapido",
    shape: "nuvem",
    color: "turquesa",
    face: "feliz",
    mood: "balancando",
  },
  {
    name: "Analista de dados",
    blurb: "Lê os painéis do Flip Intelligence e explica o que mudou.",
    purpose: "Acompanhar os números do Flip Intelligence e me avisar do que mudou e por quê.",
    model: "avancado",
    shape: "hexagono",
    color: "azul",
    face: "olhos",
    mood: "calmo",
  },
  {
    name: "Formulários",
    blurb: "Cria formulários no Flipform e resume as respostas.",
    purpose: "Criar formulários no Flipform e me entregar um resumo das respostas.",
    model: "equilibrado",
    shape: "quadrado",
    color: "laranja",
    face: "piscada",
    mood: "pulando",
  },
  {
    name: "Organizador pessoal",
    blurb: "Transforma notas e pendências em um plano simples.",
    purpose: "Organizar minhas notas e pendências num plano do dia, com o que é mais importante primeiro.",
    model: "equilibrado",
    shape: "estrela",
    color: "amarelo",
    face: "olhos",
    mood: "animado",
  },
  {
    name: "Secretária executiva",
    blurb: "Cuida da agenda, marca reuniões e prepara a pauta.",
    purpose: "Cuidar da minha agenda, marcar reuniões e preparar a pauta de cada uma.",
    model: "equilibrado",
    shape: "coracao",
    color: "roxo",
    face: "sorriso",
    mood: "calmo",
  },
];

const EMPTY: Draft = {
  name: "",
  purpose: "",
  model: "equilibrado",
  shape: "quadrado",
  color: "laranja",
  face: "olhos",
  mood: "animado",
};

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap justify-center gap-1.5">
      {children}
    </div>
  );
}

function PickButton({
  selected,
  onClick,
  label,
  children,
  round = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  round?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex items-center justify-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        round ? "size-8 rounded-full" : "size-10 rounded-xl"
      } ${selected ? "bg-card ring-2 ring-brand" : "hover:bg-card/70"}`}
    >
      {children}
    </button>
  );
}

export function AgentsScreen() {
  const agents = useAgents();
  const chat = useChat();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  const selected = agents.find((a) => a.id === selectedId) ?? null;
  const filtered = useMemo(
    () => agents.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase())),
    [agents, query],
  );

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const title = draft.name.trim() || (selected ? selected.name : "Novo agente");

  function startNew() {
    setSelectedId(null);
    setDraft(EMPTY);
    setNameError(false);
  }

  function open(agent: Agent) {
    setSelectedId(agent.id);
    setDraft(toDraft(agent));
    setNameError(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setNameError(true);
      return;
    }
    if (selected) {
      const next = agents.map((a) => (a.id === selected.id ? { ...a, ...draft, name } : a));
      saveAgents(next);
      setNotice(`${name} foi atualizado.`);
    } else {
      const agent: Agent = { ...draft, name, id: crypto.randomUUID() };
      const next = [agent, ...agents];
      saveAgents(next);
      setSelectedId(agent.id);
      setNotice(`${name} chegou. Diga oi!`);
    }
  }

  function remove() {
    if (!selected) return;
    const next = agents.filter((a) => a.id !== selected.id);
    saveAgents(next);
    setNotice(`${selected.name} foi removido.`);
    startNew();
  }

  return (
    <>
      {/* Lista de agentes */}
      <aside className="hidden w-72 flex-none flex-col gap-3 px-2 py-3 md:flex">
        <div className="flex items-center gap-1.5">
          <label className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-card/70 px-3 ring-1 ring-line focus-within:ring-brand">
            <Search className="size-4 text-muted" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </label>
          <button
            type="button"
            aria-label="Filtrar"
            className="flex size-10 items-center justify-center rounded-xl text-muted hover:bg-card/70 hover:text-foreground"
          >
            <Filter className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={startNew}
            aria-label="Novo agente"
            className="flex size-10 items-center justify-center rounded-xl text-muted hover:bg-card/70 hover:text-foreground"
          >
            <Plus className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {!selected && (
            <li>
              <div className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-line">
                <Pollo {...draft} size={40} />
                <span className="truncate text-sm font-medium">
                  {agents.length === 0 ? "Crie seu primeiro agente" : draft.name.trim() || "Novo agente"}
                </span>
              </div>
            </li>
          )}
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => open(a)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                  a.id === selectedId ? "bg-card ring-1 ring-line" : "hover:bg-card/60"
                }`}
              >
                <Pollo {...a} size={40} alive={a.id === selectedId} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{a.name}</span>
                  <span className="block truncate text-xs text-muted">{a.purpose || "Sem descrição"}</span>
                </span>
              </button>
            </li>
          ))}
          {agents.length > 0 && filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">Nenhum agente com esse nome.</li>
          )}
        </ul>

        <Link href="/apps" className="rounded-2xl bg-card/70 p-4 ring-1 ring-line transition hover:ring-brand/50">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LayoutGrid className="size-4 text-brand" strokeWidth={1.75} />
            Seus apps Pollo
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Flipform, Flip Intelligence e os outros apps. Escolha onde cada agente pode trabalhar.
          </p>
        </Link>
      </aside>

      {/* Área de trabalho */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-2xl md:ring-1 md:ring-line">
        <header className="flex h-12 flex-none items-center gap-2.5 border-b border-line px-4">
          <Pollo {...draft} size={22} alive={false} />
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h1>
          {selected && (
            <button
              type="button"
              onClick={() => chat.open(selected.id)}
              className="flex h-8 items-center gap-1.5 rounded-full bg-brand px-3.5 text-sm font-medium text-brand-foreground hover:opacity-90"
            >
              <MessageCircle className="size-4" strokeWidth={2} />
              Conversar
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Celular: os agentes numa faixa no topo. */}
          {agents.length > 0 && (
            <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3 md:hidden">
              <button
                type="button"
                onClick={startNew}
                className="flex flex-none items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm ring-1 ring-line"
              >
                <Plus className="size-4" /> Novo
              </button>
              {agents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => open(a)}
                  className={`flex flex-none items-center gap-1.5 rounded-full px-2 py-1 pr-3 text-sm ring-1 ${
                    a.id === selectedId ? "bg-card ring-brand" : "ring-line"
                  }`}
                >
                  <Pollo {...a} size={24} alive={false} />
                  {a.name}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pt-10 pb-8">
            <div className="flex flex-col items-center gap-5">
              <Pollo {...draft} size={112} />

              <Picker label="Cor">
                {COLORS.map((c) => (
                  <PickButton key={c.id} round selected={draft.color === c.id} onClick={() => set("color", c.id)} label={c.label}>
                    <span className="size-5 rounded-full" style={{ background: c.base }} />
                  </PickButton>
                ))}
              </Picker>

              <Picker label="Formato">
                {SHAPES.map((s) => (
                  <PickButton key={s.id} selected={draft.shape === s.id} onClick={() => set("shape", s.id)} label={s.label}>
                    <Pollo shape={s.id} color={draft.color} face={draft.face} size={30} alive={false} />
                  </PickButton>
                ))}
              </Picker>

              <Picker label="Rosto">
                {FACES.map((f) => (
                  <PickButton key={f.id} selected={draft.face === f.id} onClick={() => set("face", f.id)} label={f.label}>
                    <Pollo shape={draft.shape} color={draft.color} face={f.id} size={30} alive={false} />
                  </PickButton>
                ))}
              </Picker>

              <div role="radiogroup" aria-label="Jeito" className="flex flex-wrap justify-center gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={draft.mood === m.id}
                    onClick={() => set("mood", m.id)}
                    className={`rounded-full px-3 py-1.5 text-xs transition ${
                      draft.mood === m.id ? "bg-brand text-brand-foreground" : "text-muted ring-1 ring-line hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                Nome <span className="text-brand">*</span>
              </span>
              <input
                value={draft.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (nameError) setNameError(false);
                }}
                placeholder="Novo agente"
                aria-invalid={nameError}
                className={`h-11 rounded-xl bg-field px-3.5 text-[15px] ring-1 outline-none placeholder:text-muted focus:ring-2 focus:ring-brand ${
                  nameError ? "ring-red-500" : "ring-line"
                }`}
              />
              {nameError && <span className="text-xs text-red-500">Dê um nome para o seu agente.</span>}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Em que este agente deve ajudar?</span>
              <textarea
                value={draft.purpose}
                onChange={(e) => set("purpose", e.target.value)}
                rows={3}
                placeholder="Responder clientes, organizar a agenda ou acompanhar as vendas do dia."
                className="resize-y rounded-xl bg-field px-3.5 py-3 text-[15px] leading-relaxed ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
              />
            </label>

            <label className="flex h-12 items-center justify-between gap-3 rounded-xl bg-field px-3.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
              <span className="text-sm text-muted">Modelo</span>
              <span className="relative flex items-center">
                <select
                  value={draft.model}
                  onChange={(e) => set("model", e.target.value)}
                  className="appearance-none bg-transparent pr-6 text-right text-sm font-medium outline-none"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} · {m.detail}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 size-4 text-muted" />
              </span>
            </label>

            <div className="flex justify-center gap-2 pt-1">
              {selected && (
                <button
                  type="button"
                  onClick={remove}
                  className="h-11 rounded-xl px-5 text-sm text-muted ring-1 ring-line hover:text-foreground"
                >
                  Remover
                </button>
              )}
              <button
                type="submit"
                className="h-11 rounded-xl bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {selected ? "Salvar alterações" : "Criar agente"}
              </button>
            </div>
          </form>

          {!selected && (
            <section className="mx-auto w-full max-w-6xl px-4 pb-12">
              <h2 className="mb-3 text-sm text-muted">Sugestões</h2>
              <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                {SUGGESTIONS.map(({ blurb, ...s }) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => {
                      setDraft(s);
                      setNameError(false);
                    }}
                    className="flex w-72 flex-none snap-start items-center gap-4 rounded-2xl bg-card p-4 text-left ring-1 ring-line transition hover:ring-brand/60"
                  >
                    <Pollo {...s} size={52} alive={false} />
                    <span className="min-w-0">
                      <span className="block font-medium">{s.name}</span>
                      <span className="mt-1 block text-sm leading-snug text-muted">{blurb}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {notice && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-lg md:bottom-6"
        >
          {notice}
          <button type="button" aria-label="Fechar aviso" onClick={() => setNotice(null)} className="rounded-full p-1 opacity-70 hover:opacity-100">
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
