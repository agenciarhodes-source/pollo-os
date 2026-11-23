"use client";

import { useState } from "react";
import useSWR, { mutate, useSWRConfig } from "swr";
import { ApiError, type ChatMessage } from "./data";

/* A Agenda vista do navegador: sempre pela API, que confere empresa e participantes. */

export type MeetingStatus = "rascunho" | "agendada" | "em_andamento" | "concluida" | "cancelada";
export type MeetingAction = "agendar" | "iniciar" | "encerrar" | "cancelar";

export type MeetingSummary = {
  id: string;
  title: string;
  agenda: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: MeetingStatus;
  createdBy: string;
};

export type Minutes = {
  summary: string;
  decisions: { text: string }[];
  actionItems: { text: string; owner: string; due: string }[];
  openQuestions: string;
  confirmedAt?: string | null;
};

export type Meeting = MeetingSummary & {
  startedAt: string | null;
  finishedAt: string | null;
  canceledAt: string | null;
  participants: { id: string; name: string }[];
  minutes: Minutes | null;
  isOwner: boolean;
};

export type MeetingDraft = {
  title: string;
  agenda: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  participantIds: string[];
  schedule: boolean;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, (body as { error?: string } | null)?.error ?? "Não foi possível falar com o servidor.");
  }
  return body as T;
}
const fetcher = <T>(url: string) => request<T>(url);

const listUrl = (scope: "proximas" | "historico") => `/api/meetings?escopo=${scope}`;
const meetingUrl = (id: string) => `/api/meetings/${id}`;

/** Atualiza tudo o que mostra reuniões depois de uma mudança. */
async function refresh(id?: string) {
  await Promise.all([
    mutate(listUrl("proximas")),
    mutate(listUrl("historico")),
    id ? mutate(meetingUrl(id)) : Promise.resolve(),
  ]);
}

export function useMeetings(scope: "proximas" | "historico") {
  const { data, error, isLoading } = useSWR<{ meetings: MeetingSummary[] }>(listUrl(scope), fetcher);
  return { meetings: data?.meetings ?? [], error: error as ApiError | undefined, isLoading };
}

export function useMeeting(id: string) {
  const { data, error, isLoading } = useSWR<{ meeting: Meeting }>(meetingUrl(id), fetcher);
  return { meeting: data?.meeting, error: error as ApiError | undefined, isLoading };
}

export function useOrgMembers() {
  const { data } = useSWR<{ members: { id: string; name: string; email: string }[]; me: string }>("/api/org/members", fetcher);
  return { members: data?.members ?? [], me: data?.me };
}

export async function createMeeting(draft: MeetingDraft) {
  const { id } = await request<{ id: string }>("/api/meetings", { method: "POST", body: JSON.stringify(draft) });
  await refresh();
  return id;
}

export async function updateMeeting(id: string, draft: MeetingDraft) {
  await request(meetingUrl(id), { method: "PATCH", body: JSON.stringify(draft) });
  await refresh(id);
}

export async function changeStatus(id: string, action: MeetingAction) {
  await request(`${meetingUrl(id)}/status`, { method: "POST", body: JSON.stringify({ action }) });
  await refresh(id);
}

export async function saveMinutes(id: string, minutes: Minutes) {
  await request(`${meetingUrl(id)}/minutes`, { method: "PUT", body: JSON.stringify(minutes) });
  await mutate(meetingUrl(id));
}

export async function confirmMinutes(id: string) {
  await request(`${meetingUrl(id)}/minutes/confirm`, { method: "POST" });
  await mutate(meetingUrl(id));
}

/** A conversa por texto da reunião. */
export function useMeetingChat(id: string) {
  const url = `${meetingUrl(id)}/messages`;
  const { mutate: bound } = useSWRConfig();
  const { data } = useSWR<{ messages: ChatMessage[] }>(url, fetcher);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setSending(true);
    setError(null);
    try {
      await bound(
        url,
        async (current?: { messages: ChatMessage[] }) => {
          const { messages } = await request<{ messages: ChatMessage[] }>(url, { method: "POST", body: JSON.stringify({ text: clean }) });
          return { messages: [...(current?.messages ?? []), ...messages] };
        },
        {
          optimisticData: (current?: { messages: ChatMessage[] }) => ({
            messages: [...(current?.messages ?? []), { id: `temp-${Date.now()}`, role: "user" as const, text: clean, demo: false }],
          }),
          rollbackOnError: true,
          revalidate: false,
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  return { messages: data?.messages ?? [], send, sending, error };
}

/* ---------- Datas, no horário de Brasília ou no fuso da reunião ---------- */

export function formatDay(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date(iso));
}

export function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso));
}

export function dayParts(iso: string, timeZone: string) {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone }).format(d),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone }).format(d).replace(".", ""),
  };
}

export const STATUS_LABEL: Record<MeetingStatus, string> = {
  rascunho: "Rascunho",
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
