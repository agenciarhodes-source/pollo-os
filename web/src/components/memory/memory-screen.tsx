"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Link2, Lock, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";
import {
  KIND_LABEL,
  createMemory,
  deleteMemory,
  linkMemory,
  unlinkMemory,
  updateMemory,
  useMemoryItem,
  useMemoryList,
  type MemoryDetail,
  type MemoryDraft,
  type MemoryKind,
} from "@/lib/client/memory";

const KINDS = Object.keys(KIND_LABEL) as MemoryKind[];

const KIND_STYLE: Record<MemoryKind, string> = {
  nota: "bg-panel text-foreground ring-line",
  decisao: "bg-amber-50 text-amber-900 ring-amber-200",
  aprendizado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  documento: "bg-blue-50 text-blue-800 ring-blue-200",
  fonte: "bg-violet-50 text-violet-800 ring-violet-200",
};

export function KindBadge({ kind }: { kind: MemoryKind }) {
  return <span className={`flex-none rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${KIND_STYLE[kind]}`}>{KIND_LABEL[kind]}</span>;
}

const EMPTY: MemoryDraft = { kind: "nota", title: "", body: "", source: "", url: "", visibility: "empresa" };

/* ---------- Editor ---------- */

function Editor({ initial, onDone, onCancel }: { initial?: MemoryDetail; onDone: (id: string) => void; onCancel: () => void }) {
  const [d, setD] = useState<MemoryDraft>(
    initial
      ? { kind: initial.kind, title: initial.title, body: initial.body, source: initial.source, url: initial.url ?? "", visibility: initial.visibility }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = "h-11 rounded-xl bg-field px-3.5 text-[15px] ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) {
      setError("Dê um título.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (initial) {
        await updateMemory(initial.id, d);
        onDone(initial.id);
      } else {
        onDone(await createMemory(d));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{initial ? "Editar item" : "Novo item"}</h2>
        <button type="button" onClick={onCancel} aria-label="Fechar" className="rounded-full p-2 text-muted hover:bg-panel">
          <X className="size-5" />
        </button>
      </div>
      <div role="radiogroup" aria-label="Tipo" className="flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={d.kind === k}
            onClick={() => setD({ ...d, kind: k })}
            className={`rounded-full px-3 py-1.5 text-sm transition ${d.kind === k ? "bg-foreground text-background" : "text-muted ring-1 ring-line hover:text-foreground"}`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Título</span>
        <input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} maxLength={200} className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Texto</span>
        <textarea
          value={d.body}
          onChange={(e) => setD({ ...d, body: e.target.value })}
          rows={7}
          className="resize-y rounded-xl bg-field px-3.5 py-3 text-[15px] leading-relaxed ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Fonte</span>
        <input
          value={d.source}
          onChange={(e) => setD({ ...d, source: e.target.value })}
          maxLength={300}
          placeholder="De onde veio: reunião, relatório, conversa…"
          className={field}
        />
      </label>
      {(d.kind === "documento" || d.kind === "fonte" || d.url) && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Endereço (opcional)</span>
          <input
            value={d.url}
            onChange={(e) => setD({ ...d, url: e.target.value })}
            placeholder="https://"
            inputMode="url"
            className={field}
          />
        </label>
      )}
      <label className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-line">
        <input
          type="checkbox"
          checked={d.visibility === "privada"}
          onChange={(e) => setD({ ...d, visibility: e.target.checked ? "privada" : "empresa" })}
          className="size-4 accent-[var(--brand)]"
        />
        <span className="flex-1 text-sm">
          <span className="font-medium">Só para mim</span>
          <span className="block text-xs text-muted">Sem marcar, todos da empresa veem.</span>
        </span>
        <Lock className="size-4 text-muted" />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-11 rounded-xl px-5 text-sm ring-1 ring-line hover:bg-panel">
          Cancelar
        </button>
        <button type="submit" disabled={busy} className="h-11 rounded-xl bg-foreground px-6 text-sm font-medium text-background disabled:opacity-60">
          {busy ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

/* ---------- Detalhe ---------- */

function LinkPicker({ item, onClose }: { item: MemoryDetail; onClose: () => void }) {
  const [q, setQ] = useState("");
  const { items } = useMemoryList(q, "");
  const [error, setError] = useState<string | null>(null);
  const linked = new Set([item.id, ...item.links.map((l) => l.id)]);
  const options = items.filter((i) => !linked.has(i.id)).slice(0, 8);

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-panel/60 p-3 ring-1 ring-line">
      <label className="flex h-10 items-center gap-2 rounded-xl bg-card px-3 ring-1 ring-line">
        <Search className="size-4 text-muted" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ligar a qual item?" className="w-full bg-transparent text-sm outline-none" />
      </label>
      <ul className="flex flex-col gap-1">
        {options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={async () => {
                try {
                  await linkMemory(item.id, o.id);
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Não foi possível ligar.");
                }
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-card"
            >
              <KindBadge kind={o.kind} />
              <span className="truncate">{o.title}</span>
            </button>
          </li>
        ))}
        {options.length === 0 && <li className="px-3 py-2 text-sm text-muted">Nada para ligar.</li>}
      </ul>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={onClose} className="self-end text-sm text-muted hover:text-foreground">
        Fechar
      </button>
    </div>
  );
}

function Detail({ id, onEdit, onDeleted, onOpen }: { id: string; onEdit: (item: MemoryDetail) => void; onDeleted: () => void; onOpen: (id: string) => void }) {
  const { item, error, isLoading } = useMemoryItem(id);
  const [picking, setPicking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error) return <p role="alert" className="text-sm text-red-700">{error.message}</p>;
  if (isLoading || !item) return <p className="text-sm text-muted">Carregando…</p>;

  async function remove() {
    if (!item || !window.confirm(`Apagar “${item.title}”? Não dá para desfazer.`)) return;
    try {
      await deleteMemory(item.id);
      onDeleted();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Não foi possível apagar.");
    }
  }

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={item.kind} />
          {item.visibility === "privada" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Lock className="size-3.5" /> Só para você
            </span>
          )}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{item.title}</h2>
        <p className="text-xs text-muted">
          Atualizado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.updatedAt))}
        </p>
      </header>

      {item.body && <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">{item.body}</p>}

      {(item.source || item.url || item.sourceMeetingId) && (
        <dl className="flex flex-col gap-2 rounded-2xl bg-panel/60 p-4 text-sm ring-1 ring-line">
          {item.source && (
            <div>
              <dt className="text-xs text-muted">Fonte</dt>
              <dd>{item.source}</dd>
            </div>
          )}
          {item.sourceMeetingId && (
            <Link href={`/agenda/${item.sourceMeetingId}`} className="font-medium text-brand">
              Ver a reunião
            </Link>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand">
              Abrir o endereço <ExternalLink className="size-3.5" />
            </a>
          )}
        </dl>
      )}

      <section aria-label="Ligações" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Ligado a</h3>
          {!picking && (
            <button type="button" onClick={() => setPicking(true)} className="inline-flex items-center gap-1 text-sm font-medium text-brand">
              <Link2 className="size-4" /> Ligar a outro item
            </button>
          )}
        </div>
        {picking && <LinkPicker item={item} onClose={() => setPicking(false)} />}
        {item.links.length === 0 && !picking ? (
          <p className="text-sm text-muted">Nenhuma ligação ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {item.links.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-panel/60">
                <KindBadge kind={l.kind} />
                <button type="button" onClick={() => onOpen(l.id)} className="min-w-0 flex-1 truncate text-left text-sm hover:underline">
                  {l.title}
                </button>
                <button
                  type="button"
                  aria-label={`Desfazer a ligação com ${l.title}`}
                  onClick={() => unlinkMemory(item.id, l.id).catch((e) => setActionError(e.message))}
                  className="rounded-lg p-1.5 text-muted hover:bg-panel hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}

      {item.isOwner && (
        <div className="flex gap-2 border-t border-line pt-4">
          <button type="button" onClick={() => onEdit(item)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm ring-1 ring-line hover:bg-panel">
            <Pencil className="size-4" /> Editar
          </button>
          <button type="button" onClick={remove} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm text-red-700 ring-1 ring-line hover:bg-red-50">
            <Trash2 className="size-4" /> Apagar
          </button>
        </div>
      )}
    </article>
  );
}

/* ---------- Tela ---------- */

export function MemoryScreen() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<MemoryKind | "">("");
  const { items, isLoading, error } = useMemoryList(q, kind);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<MemoryDetail | "novo" | null>(null);

  const showRight = editing !== null || selected !== null;

  return (
    <main className="flex min-w-0 flex-1 overflow-hidden bg-background md:rounded-2xl md:ring-1 md:ring-line">
      {/* Lista */}
      <section aria-label="Itens da memória" className={`flex w-full flex-col border-line md:w-[380px] md:flex-none md:border-r ${showRight ? "hidden md:flex" : "flex"}`}>
        <header className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Segundo Cérebro</h1>
              <p className="text-sm text-muted">A memória da empresa.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing("novo");
                setSelected(null);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-3.5 text-sm font-medium text-background"
            >
              <Plus className="size-4" /> Novo
            </button>
          </div>
          <label className="flex h-10 items-center gap-2 rounded-xl bg-panel/70 px-3 ring-1 ring-line focus-within:ring-brand">
            <Search className="size-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar na memória" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
          </label>
          <div role="radiogroup" aria-label="Filtrar por tipo" className="flex flex-wrap gap-1.5">
            {([["", "Tudo"], ...KINDS.map((k) => [k, KIND_LABEL[k]])] as [MemoryKind | "", string][]).map(([k, label]) => (
              <button
                key={k || "tudo"}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={`rounded-full px-2.5 py-1 text-xs transition ${kind === k ? "bg-foreground text-background" : "text-muted ring-1 ring-line hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>
        <ul className="flex-1 overflow-y-auto px-2 pb-4" aria-busy={isLoading}>
          {error && <li role="alert" className="px-3 py-2 text-sm text-red-700">{error.message}</li>}
          {!isLoading && items.length === 0 && (
            <li className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <Pollo shape="flor" color="roxo" face="olhos" mood="calmo" size={56} title="Segundo Cérebro" />
              <p className="text-sm text-muted">
                {q || kind
                  ? "Nada encontrado com esse filtro."
                  : "A memória está vazia. Registre uma nota, ou confirme a ata de uma reunião: as decisões entram aqui sozinhas."}
              </p>
            </li>
          )}
          {items.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(i.id);
                  setEditing(null);
                }}
                aria-current={selected === i.id ? "true" : undefined}
                className={`flex w-full flex-col gap-1 rounded-2xl px-3 py-2.5 text-left transition ${selected === i.id ? "bg-card ring-1 ring-line" : "hover:bg-panel/60"}`}
              >
                <span className="flex items-center gap-2">
                  <KindBadge kind={i.kind} />
                  {i.visibility === "privada" && <Lock className="size-3.5 text-muted" aria-label="Só para você" />}
                </span>
                <span className="truncate text-sm font-medium">{i.title}</span>
                {(i.source || i.body) && <span className="truncate text-xs text-muted">{i.source || i.body}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Detalhe / editor */}
      <section aria-label="Item" className={`min-w-0 flex-1 overflow-y-auto ${showRight ? "block" : "hidden md:block"}`}>
        <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:py-8">
          {showRight && (
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setEditing(null);
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted md:hidden"
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
          )}
          {editing ? (
            <Editor
              initial={editing === "novo" ? undefined : editing}
              onCancel={() => setEditing(null)}
              onDone={(id) => {
                setEditing(null);
                setSelected(id);
              }}
            />
          ) : selected ? (
            <Detail id={selected} onEdit={(item) => setEditing(item)} onDeleted={() => setSelected(null)} onOpen={setSelected} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-center text-sm text-muted">
              Escolha um item à esquerda, ou registre um novo.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
