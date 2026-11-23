"use client";

import useSWR, { mutate } from "swr";
import { useStreamingChat } from "./stream";
import type { Agent, Draft } from "@/lib/agents";

/*
 * Como o navegador lê e grava os dados do Pollo OS: sempre pela API, que decide a empresa a
 * partir da sessão. Nada aqui é a autoridade; o servidor é.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
    credentials: "same-origin",
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, (body as { error?: string } | null)?.error ?? "Não foi possível falar com o servidor.");
  }
  return body as T;
}

const fetcher = <T>(url: string) => request<T>(url);

/* ---------- Agentes ---------- */

const AGENTS = "/api/agents";

export function useAgents() {
  const { data, error, isLoading } = useSWR<{ agents: Agent[] }>(AGENTS, fetcher);
  return { agents: data?.agents ?? [], error: error as ApiError | undefined, isLoading };
}

export async function createAgent(draft: Draft) {
  const { agent } = await request<{ agent: Agent }>(AGENTS, { method: "POST", body: JSON.stringify(draft) });
  await mutate(AGENTS);
  return agent;
}

export async function updateAgent(id: string, draft: Draft) {
  const { agent } = await request<{ agent: Agent }>(`${AGENTS}/${id}`, { method: "PATCH", body: JSON.stringify(draft) });
  await mutate(AGENTS);
  return agent;
}

export async function deleteAgent(id: string) {
  await request(`${AGENTS}/${id}`, { method: "DELETE" });
  await Promise.all([mutate(AGENTS), mutate(ACCESS)]);
}

export async function importAgents(agents: Draft[]) {
  const res = await request<{ imported: number }>(`${AGENTS}/import`, {
    method: "POST",
    body: JSON.stringify({ agents }),
  });
  await mutate(AGENTS);
  return res.imported;
}

/* ---------- Acesso aos apps ---------- */

const ACCESS = "/api/app-access";

export function useAppAccess() {
  const { data } = useSWR<{ access: Record<string, string[]> }>(ACCESS, fetcher);
  return data?.access ?? {};
}

export async function setAppAccess(appId: string, agentId: string, allowed: boolean) {
  await mutate(
    ACCESS,
    async (current?: { access: Record<string, string[]> }) => {
      await request(ACCESS, { method: "PUT", body: JSON.stringify({ appId, agentId, allowed }) });
      return current;
    },
    {
      optimisticData: (current?: { access: Record<string, string[]> }) => {
        const access = { ...(current?.access ?? {}) };
        const list = new Set(access[appId] ?? []);
        if (allowed) list.add(agentId);
        else list.delete(agentId);
        access[appId] = [...list];
        return { access };
      },
      rollbackOnError: true,
      revalidate: true,
    },
  );
}

/* ---------- Conversas ---------- */

export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; demo: boolean };

/** A conversa com um agente (ou com o Pollo CEO), com a resposta em fluxo. */
export function useAgentChat(agentKey: string) {
  const key = encodeURIComponent(agentKey);
  return useStreamingChat(`/api/conversations/${key}/messages`, `/api/conversations/${key}/stream`);
}
