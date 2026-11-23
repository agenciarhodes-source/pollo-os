"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import type { ChatMessage } from "./data";

/*
 * Conversa com resposta em fluxo: a mensagem da pessoa aparece na hora, a resposta vai sendo
 * escrita na tela enquanto chega, e no fim a lista é relida do servidor (com o que foi salvo).
 */

type List = { messages: ChatMessage[] };

async function readError(res: Response) {
  const body = await res.json().catch(() => null);
  return (body as { error?: string } | null)?.error ?? "Não foi possível falar com o servidor.";
}

export function useStreamingChat(listUrl: string, streamUrl: string) {
  const { mutate } = useSWRConfig();
  const { data } = useSWR<List>(listUrl, (url: string) =>
    fetch(url).then(async (r) => {
      if (!r.ok) throw new Error(await readError(r));
      return r.json();
    }),
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);

    const userMsg: ChatMessage = { id: `eu-${Date.now()}`, role: "user", text, demo: false };
    const replyId = `resposta-${Date.now()}`;
    const setReply = (reply: string, demo = false) =>
      mutate(
        listUrl,
        (current?: List) => {
          const others = (current?.messages ?? []).filter((m) => m.id !== replyId);
          return { messages: [...others, { id: replyId, role: "assistant" as const, text: reply, demo }] };
        },
        { revalidate: false },
      );

    await mutate(listUrl, (current?: List) => ({ messages: [...(current?.messages ?? []), userMsg] }), { revalidate: false });

    try {
      const res = await fetch(streamUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok || !res.body) {
        setError(await readError(res));
        return;
      }
      const demo = res.headers.get("x-pollo-demo") === "1";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        await setReply(reply, demo);
      }
    } catch {
      setError("A conexão caiu no meio da resposta. Tente de novo.");
    } finally {
      // Relê do servidor: confirma o que foi salvo (e tira a mensagem se nada foi).
      await mutate(listUrl);
      setSending(false);
    }
  }

  return { messages: data?.messages ?? [], send, sending, error };
}

/** Se a IA está ligada e quanto a empresa já gastou no mês. */
export function useAiStatus() {
  const { data } = useSWR<{ enabled: boolean; spentUsd: number; limitUsd: number; blocked: boolean }>("/api/ai/status", (url: string) =>
    fetch(url).then((r) => (r.ok ? r.json() : null)),
  );
  return data ?? null;
}
