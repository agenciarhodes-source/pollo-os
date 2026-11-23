"use client";

import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { ApiError } from "./data";

/* O Segundo Cérebro e a Atividade vistos do navegador. */

export type MemoryKind = "nota" | "decisao" | "aprendizado" | "documento" | "fonte";

export const KIND_LABEL: Record<MemoryKind, string> = {
  nota: "Nota",
  decisao: "Decisão",
  aprendizado: "Aprendizado",
  documento: "Documento",
  fonte: "Fonte",
};

export type MemoryItem = {
  id: string;
  kind: MemoryKind;
  title: string;
  body: string;
  source: string;
  url: string | null;
  sourceMeetingId: string | null;
  visibility: "empresa" | "privada";
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemoryDetail = MemoryItem & { links: { id: string; title: string; kind: MemoryKind }[]; isOwner: boolean };

export type MemoryDraft = {
  kind: MemoryKind;
  title: string;
  body: string;
  source: string;
  url: string;
  visibility: "empresa" | "privada";
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string } | null)?.error ?? "Não foi possível falar com o servidor.");
  return body as T;
}
const fetcher = <T>(url: string) => request<T>(url);

const listKey = (q: string, kind: MemoryKind | "") => {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (kind) p.set("tipo", kind);
  const s = p.toString();
  return `/api/memory${s ? `?${s}` : ""}`;
};

const isMemoryKey = (key: unknown) => typeof key === "string" && key.startsWith("/api/memory");

export function useMemoryList(q: string, kind: MemoryKind | "") {
  const { data, error, isLoading } = useSWR<{ items: MemoryItem[] }>(listKey(q, kind), fetcher, { keepPreviousData: true });
  return { items: data?.items ?? [], error: error as ApiError | undefined, isLoading };
}

export function useMemoryItem(id: string | null) {
  const { data, error, isLoading } = useSWR<{ item: MemoryDetail }>(id ? `/api/memory/${id}` : null, fetcher);
  return { item: data?.item, error: error as ApiError | undefined, isLoading };
}

const refreshAll = () => mutate(isMemoryKey);

export async function createMemory(draft: MemoryDraft) {
  const { id } = await request<{ id: string }>("/api/memory", { method: "POST", body: JSON.stringify(draft) });
  await refreshAll();
  return id;
}

export async function updateMemory(id: string, draft: MemoryDraft) {
  await request(`/api/memory/${id}`, { method: "PATCH", body: JSON.stringify(draft) });
  await refreshAll();
}

export async function deleteMemory(id: string) {
  await request(`/api/memory/${id}`, { method: "DELETE" });
  await refreshAll();
}

export async function linkMemory(id: string, targetId: string) {
  await request(`/api/memory/${id}/links`, { method: "POST", body: JSON.stringify({ targetId }) });
  await refreshAll();
}

export async function unlinkMemory(id: string, otherId: string) {
  await request(`/api/memory/${id}/links?com=${otherId}`, { method: "DELETE" });
  await refreshAll();
}

/* ---------- Atividade ---------- */

export type ActivityEvent = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  createdAt: string;
  actorName: string | null;
};

type ActivityPage = { events: ActivityEvent[]; hasMore: boolean };

export function useActivity(type: string) {
  const { data, error, isLoading, size, setSize } = useSWRInfinite<ActivityPage>(
    (index, previous: ActivityPage | null) => {
      if (previous && !previous.hasMore) return null;
      const p = new URLSearchParams();
      if (type) p.set("tipo", type);
      const last = previous?.events.at(-1);
      if (index > 0 && last) p.set("antes", last.createdAt);
      const s = p.toString();
      return `/api/activity${s ? `?${s}` : ""}`;
    },
    fetcher,
  );
  const pages = data ?? [];
  return {
    events: pages.flatMap((p) => p.events),
    hasMore: pages.at(-1)?.hasMore ?? false,
    loadMore: () => setSize(size + 1),
    loadingMore: isLoading || (size > 0 && pages.length < size),
    error: error as ApiError | undefined,
    isLoading,
  };
}
