import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type LanguageModel, type ModelMessage } from "ai";
import { and, asc, desc, eq, gte, or, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { schema } from "@/lib/db";
import { conversationId, demoReply } from "./repo";
import { HttpError } from "./tenant";

/*
 * A IA do Pollo OS, pela conta da OpenAI (OPENAI_API_KEY). Sem a chave, as respostas voltam a
 * ser de demonstração, e dizem isso.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<PgQueryResultHKT, typeof schema, any>;

/** O modelo de cada opção de agente. Dá para trocar por variável de ambiente, sem mexer no código. */
export const MODELS = {
  rapido: process.env.OPENAI_MODEL_RAPIDO || "gpt-6-luna",
  equilibrado: process.env.OPENAI_MODEL_EQUILIBRADO || "gpt-6.1-sol",
  avancado: process.env.OPENAI_MODEL_AVANCADO || "gpt-6.1-sol",
};
export type ModelChoice = keyof typeof MODELS;

/** Preço em US$ por token (tabela da OpenAI, nov/2026), para calcular o custo de cada resposta. */
const PRICES: Record<string, { input: number; output: number }> = {
  "gpt-6-luna": { input: 0.0000001, output: 0.0000005 },
  "gpt-6.1-sol": { input: 0.000002, output: 0.00001 },
};
/** Modelo sem preço na tabela: conta como caro, para o limite do mês nunca ficar frouxo. */
const FALLBACK_PRICE = { input: 0.00001, output: 0.00005 };

export function aiEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function openaiModel(id: string): LanguageModel {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(id);
}

/** O limite de gasto por empresa por mês, em milionésimos de dólar. */
export function monthlyLimitMicros() {
  const usd = Number(process.env.AI_MONTHLY_LIMIT_USD ?? "5");
  return Math.round((Number.isFinite(usd) && usd >= 0 ? usd : 5) * 1_000_000);
}

function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function monthSpendMicros(db: Db, orgId: string, now = new Date()) {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${schema.usageEvents.costMicros}), 0)` })
    .from(schema.usageEvents)
    .where(and(eq(schema.usageEvents.organizationId, orgId), gte(schema.usageEvents.createdAt, monthStart(now))));
  return Number(row?.total ?? 0);
}

/** O consumo do mês, por agente, para a tela Consumo & Custos. */
export async function monthUsage(db: Db, orgId: string, now = new Date()) {
  const u = schema.usageEvents;
  const rows = await db
    .select({
      agentKey: u.agentKey,
      service: u.service,
      calls: sql<string>`count(*)`,
      tokensIn: sql<string>`coalesce(sum(${u.tokensIn}), 0)`,
      tokensOut: sql<string>`coalesce(sum(${u.tokensOut}), 0)`,
      costMicros: sql<string>`coalesce(sum(${u.costMicros}), 0)`,
    })
    .from(u)
    .where(and(eq(u.organizationId, orgId), gte(u.createdAt, monthStart(now))))
    .groupBy(u.agentKey, u.service);
  return rows.map((r) => ({
    agentKey: r.agentKey,
    service: r.service,
    calls: Number(r.calls),
    tokensIn: Number(r.tokensIn),
    tokensOut: Number(r.tokensOut),
    costMicros: Number(r.costMicros),
  }));
}

/** O custo de uma resposta, pelos tokens usados e o preço do modelo. */
export function costMicros(model: string, usage: { inputTokens?: number; outputTokens?: number }) {
  const price = PRICES[model] ?? FALLBACK_PRICE;
  return Math.round(((usage.inputTokens ?? 0) * price.input + (usage.outputTokens ?? 0) * price.output) * 1_000_000);
}

/* ---------- Contexto ---------- */

export type TurnContext = {
  orgId: string;
  userId: string;
  userName: string;
  agent: { key: string; name: string; purpose: string; model: ModelChoice };
  /** Uma reunião em andamento, quando a conversa é dela. */
  meeting?: { title: string; agenda: string; participants: string[] };
};

async function memoryFor(db: Db, orgId: string, userId: string) {
  const m = schema.memoryItems;
  return db
    .select({ kind: m.kind, title: m.title, body: m.body, source: m.source })
    .from(m)
    .where(and(eq(m.organizationId, orgId), or(eq(m.visibility, "empresa"), eq(m.createdBy, userId))))
    .orderBy(desc(m.updatedAt))
    .limit(12);
}

export async function systemPrompt(db: Db, ctx: TurnContext, now = new Date()) {
  const [org] = await db.select({ name: schema.organization.name }).from(schema.organization).where(eq(schema.organization.id, ctx.orgId)).limit(1);
  const memory = await memoryFor(db, ctx.orgId, ctx.userId);
  const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(now);

  const lines = [
    ctx.agent.key === "pollo-ceo"
      ? "Você é o Pollo CEO, o agente executivo do Pollo OS: conversa com o empresário, organiza o raciocínio, sugere caminhos e coordena os outros agentes. Você não substitui o empresário."
      : `Você é ${ctx.agent.name}, um agente do Pollo OS. Sua função: ${ctx.agent.purpose || "ajudar a empresa no que for pedido"}.`,
    `Empresa: ${org?.name ?? "não informada"}. Quem fala com você: ${ctx.userName}. Agora: ${when} (horário de Brasília).`,
    "",
    "Regras:",
    "- Responda em português do Brasil, direto e cordial, em poucas frases ou listas curtas.",
    "- Você ainda NÃO tem acesso aos dados do FlipForm (CRM, vendas, atendimento), do Flip Intelligence (indicadores, Painel de Mercado), do ERP, de faturamento ou de agenda externa. Nunca invente números, nomes de clientes ou resultados. Se precisar deles, diga que a fonte ainda não está conectada e peça o dado à pessoa.",
    "- Ao falar da empresa, deixe claro o tipo de cada afirmação: **Fato** (só o que está na memória abaixo, citando a fonte), **Hipótese**, **Recomendação** ou **Decisão aprovada** (só as que estão na memória como decisão).",
    "- Você ainda não executa ações fora do Pollo OS (enviar mensagens, mudar dados em outros sistemas). Se pedirem, explique o que faria e que isso dependerá de aprovação quando estiver disponível.",
    "- O Pollo OS não é um CRM: para operar vendas, a pessoa usa o FlipForm.",
  ];

  if (ctx.meeting) {
    lines.push(
      "",
      `Você está numa reunião executiva em andamento: “${ctx.meeting.title}”.`,
      `Participantes: ${ctx.meeting.participants.join(", ") || ctx.userName}.`,
      `Pauta:\n${ctx.meeting.agenda || "(sem pauta)"}`,
      "Ajude a conduzir a pauta, registre decisões e próximos passos com clareza; lembre que a ata só vale depois que a pessoa confirmar.",
    );
  }

  lines.push("", "Memória da empresa (Segundo Cérebro), mais recente primeiro:");
  if (memory.length === 0) lines.push("(vazia)");
  for (const item of memory) {
    const body = item.body.length > 400 ? `${item.body.slice(0, 400)}…` : item.body;
    lines.push(`- [${item.kind}] ${item.title}${item.source ? ` (fonte: ${item.source})` : ""}${body && body !== item.title ? `: ${body}` : ""}`);
  }
  return lines.join("\n");
}

/* ---------- Um turno de conversa ---------- */

const HISTORY = 20;
const encoder = new TextEncoder();

/**
 * Guarda a mensagem da pessoa, chama o modelo e devolve a resposta em fluxo (texto puro). Ao
 * terminar, guarda a resposta e o consumo. Se o modelo falhar antes de escrever, responde com
 * erro (a mensagem da pessoa fica salva).
 */
export async function runTurn(
  db: Db,
  ctx: TurnContext,
  conversationKey: string,
  text: string,
  options: { model?: LanguageModel; now?: Date } = {},
): Promise<Response> {
  const now = options.now ?? new Date();
  const convId = await conversationId(db, ctx.orgId, ctx.userId, conversationKey, true);
  if (!convId) throw new Error("Conversa não encontrada.");

  const insertMessage = (role: "user" | "assistant", body: string, demo = false) =>
    db.insert(schema.messages).values({ organizationId: ctx.orgId, conversationId: convId, role, text: body, demo });

  // Sem IA ligada: resposta de demonstração, dita como tal.
  if (!options.model && !aiEnabled()) {
    await insertMessage("user", text);
    const reply = demoReply(ctx.agent.name, text);
    await insertMessage("assistant", reply, true);
    return new Response(reply, { headers: { "content-type": "text/plain; charset=utf-8", "x-pollo-demo": "1" } });
  }

  const limit = monthlyLimitMicros();
  if (limit > 0 && (await monthSpendMicros(db, ctx.orgId, now)) >= limit) {
    throw new HttpError(
      402,
      `A empresa chegou ao limite de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }).format(limit / 1_000_000)} de IA neste mês. As respostas voltam no dia 1º, ou quando o limite for aumentado.`,
    );
  }

  await insertMessage("user", text);

  const history = await db
    .select({ role: schema.messages.role, text: schema.messages.text })
    .from(schema.messages)
    .where(and(eq(schema.messages.conversationId, convId), eq(schema.messages.organizationId, ctx.orgId)))
    .orderBy(desc(schema.messages.createdAt))
    .limit(HISTORY);
  const messages: ModelMessage[] = history
    .reverse()
    .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));

  const modelId = MODELS[ctx.agent.model] ?? MODELS.equilibrado;
  const result = streamText({
    model: options.model ?? openaiModel(modelId),
    system: await systemPrompt(db, ctx, now),
    messages,
    // Inclui o raciocínio interno do modelo, que também conta como saída.
    maxOutputTokens: 4000,
  });

  const parts = result.fullStream[Symbol.asyncIterator]();
  let reply = "";
  let usage: { inputTokens?: number; outputTokens?: number } = {};
  const buffered: string[] = [];

  // Espera o primeiro pedaço de texto: se o modelo falhar antes, responde com erro claro.
  for (;;) {
    const { value, done } = await parts.next();
    if (done) break;
    if (value.type === "error") {
      console.error("Falha da IA:", value.error);
      throw new HttpError(502, "A IA não respondeu agora. Tente de novo em instantes.");
    }
    if (value.type === "text-delta") {
      buffered.push(value.text);
      reply += value.text;
      break;
    }
  }

  async function finish(interrupted: boolean) {
    const text = interrupted ? `${reply}\n\n(A resposta foi interrompida.)` : reply;
    if (text.trim()) await insertMessage("assistant", text);
    await db.insert(schema.usageEvents).values({
      organizationId: ctx.orgId,
      agentKey: ctx.agent.key,
      service: modelId,
      modality: "texto",
      tokensIn: usage.inputTokens ?? 0,
      tokensOut: usage.outputTokens ?? 0,
      costMicros: costMicros(modelId, usage),
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (chunk: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          open = false; // A pessoa fechou a página: segue até o fim para salvar.
        }
      };
      for (const b of buffered) send(b);
      let interrupted = false;
      try {
        for (;;) {
          const { value, done } = await parts.next();
          if (done) break;
          if (value.type === "text-delta") {
            reply += value.text;
            send(value.text);
          } else if (value.type === "finish") {
            usage = { inputTokens: value.totalUsage.inputTokens, outputTokens: value.totalUsage.outputTokens };
          } else if (value.type === "error") {
            console.error("Falha da IA no meio da resposta:", value.error);
            interrupted = true;
            send("\n\n(A resposta foi interrompida.)");
            break;
          }
        }
      } finally {
        await finish(interrupted);
        if (open) controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

/** As mensagens de uma conversa, para o histórico na tela. */
export async function loadHistory(db: Db, orgId: string, convId: string) {
  return db
    .select()
    .from(schema.messages)
    .where(and(eq(schema.messages.conversationId, convId), eq(schema.messages.organizationId, orgId)))
    .orderBy(asc(schema.messages.createdAt));
}
