// @vitest-environment node
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createAuth } from "@/lib/auth";
import { schema } from "@/lib/db";
import { createTestDb, type TestDb } from "@/lib/db/test-db";
import { costMicros, monthSpendMicros, runTurn, systemPrompt, type TurnContext } from "./ai";
import { createMemory, memoryInput } from "./memory";
import { listMessages } from "./repo";

let db: TestDb;
let A: TurnContext;
let B: TurnContext;

const usage = (input: number, output: number) => ({
  inputTokens: { total: input, noCache: input, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: output, text: output, reasoning: 0 },
});

/** Um modelo falso que responde com estes pedaços de texto. */
function fakeModel(chunks: string[], opts: { failFirst?: boolean; cost?: string } = {}) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream<LanguageModelV4StreamPart>({
        chunks: opts.failFirst
          ? [{ type: "error" as const, error: new Error("sem crédito") }]
          : [
              { type: "text-start" as const, id: "t" },
              ...chunks.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
              { type: "text-end" as const, id: "t" },
              {
                type: "finish" as const,
                finishReason: { unified: "stop" as const, raw: "stop" },
                usage: usage(1000, 200),
                providerMetadata: opts.cost ? { gateway: { cost: opts.cost } } : undefined,
              },
            ],
      }),
    }),
  });
}

async function makeCompany(auth: ReturnType<typeof createAuth>, who: string): Promise<TurnContext> {
  const res = await auth.api.signUpEmail({ body: { name: who, email: `${who}@exemplo.com`, password: "senha-segura-1" }, returnHeaders: true });
  const headers = new Headers({ cookie: (res.headers.get("set-cookie") ?? "").split(";")[0] });
  const org = await auth.api.createOrganization({ body: { name: `Padaria ${who}`, slug: `padaria-${who}` }, headers });
  return {
    orgId: org!.id,
    userId: res.response.user.id,
    userName: who,
    agent: { key: "pollo-ceo", name: "Pollo CEO", purpose: "", model: "equilibrado" },
  };
}

beforeAll(async () => {
  db = await createTestDb();
  const auth = createAuth(db);
  A = await makeCompany(auth, "ana");
  B = await makeCompany(auth, "bruno");
});

afterEach(() => vi.unstubAllEnvs());

describe("conversa com a IA", () => {
  it("devolve a resposta em fluxo e salva as mensagens e o consumo", async () => {
    const res = await runTurn(db, A, "pollo-ceo", "Como vamos?", { model: fakeModel(["Olá, ", "Ana!"], { cost: "0.0042" }) });
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe("Olá, Ana!");

    const saved = await listMessages(db, A.orgId, A.userId, "pollo-ceo");
    expect(saved.map((m) => [m.role, m.text, m.demo])).toEqual([
      ["user", "Como vamos?", false],
      ["assistant", "Olá, Ana!", false],
    ]);

    const [event] = await db.select().from(schema.usageEvents).where(eq(schema.usageEvents.organizationId, A.orgId));
    expect(event).toMatchObject({ agentKey: "pollo-ceo", service: "anthropic/claude-sonnet-5.5", modality: "texto", tokensIn: 1000, tokensOut: 200, costMicros: 4200 });
    // O consumo de uma empresa não aparece na outra.
    expect(await monthSpendMicros(db, B.orgId)).toBe(0);
  });

  it("sem custo informado, estima pelos tokens do modelo", () => {
    expect(costMicros("anthropic/claude-sonnet-5.5", { inputTokens: 1000, outputTokens: 200 })).toBe(4000);
    expect(costMicros("anthropic/claude-haiku-5.5", { inputTokens: 1000, outputTokens: 200 })).toBe(200);
    expect(costMicros("anthropic/claude-sonnet-5.5", { inputTokens: 1, outputTokens: 1 }, { gateway: { cost: "0.01" } })).toBe(10000);
  });

  it("recusa com 402 quando a empresa passa do limite do mês, sem chamar a IA", async () => {
    vi.stubEnv("AI_MONTHLY_LIMIT_USD", "0.004");
    const model = fakeModel(["não devia"]);
    await expect(runTurn(db, A, "pollo-ceo", "Mais uma?", { model })).rejects.toMatchObject({ status: 402 });
    expect(model.doStreamCalls).toHaveLength(0);
    // A outra empresa, sem gasto, continua conversando.
    const res = await runTurn(db, B, "pollo-ceo", "Oi", { model: fakeModel(["Oi, Bruno."]) });
    expect(await res.text()).toBe("Oi, Bruno.");
  });

  it("se a IA falha antes de escrever, responde 502 com mensagem clara", async () => {
    await expect(runTurn(db, B, "pollo-ceo", "Teste de falha", { model: fakeModel([], { failFirst: true }) })).rejects.toMatchObject({
      status: 502,
      message: "A IA não respondeu agora. Tente de novo em instantes.",
    });
  });

  it("manda o histórico da conversa ao modelo", async () => {
    const model = fakeModel(["Sim."]);
    await (await runTurn(db, A, "pollo-ceo", "Lembra o que eu perguntei?", { model })).text();
    const prompt = model.doStreamCalls[0].prompt;
    const userTexts = prompt.filter((m) => m.role === "user").map((m) => JSON.stringify(m.content));
    expect(userTexts.some((t) => t.includes("Como vamos?"))).toBe(true);
    expect(userTexts.some((t) => t.includes("Lembra o que eu perguntei?"))).toBe(true);
  });

  it("sem IA ligada e sem modelo, responde em demonstração e diz isso", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_OIDC_TOKEN", "");
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    const res = await runTurn(db, B, "pollo-ceo", "Tem alguém aí?");
    expect(res.headers.get("x-pollo-demo")).toBe("1");
    expect(await res.text()).toContain("Esta não é uma resposta real");
  });
});

describe("contexto da IA", () => {
  it("leva a empresa, as regras e a memória que a pessoa pode ver — e só da empresa dela", async () => {
    await createMemory(db, A.orgId, A.userId, memoryInput.parse({ kind: "decisao", title: "Abrir aos domingos", source: "Ata da reunião X" }));
    await createMemory(db, B.orgId, B.userId, memoryInput.parse({ title: "Segredo da padaria do Bruno" }));
    const prompt = await systemPrompt(db, A);
    expect(prompt).toContain("Padaria ana");
    expect(prompt).toContain("Nunca invente números");
    expect(prompt).toContain("[decisao] Abrir aos domingos (fonte: Ata da reunião X)");
    expect(prompt).not.toContain("Segredo da padaria do Bruno");
  });

  it("numa reunião, leva o título, os participantes e a pauta", async () => {
    const prompt = await systemPrompt(db, { ...A, meeting: { title: "Revisão", agenda: "1. Vendas", participants: ["ana", "carla"] } });
    expect(prompt).toContain("“Revisão”");
    expect(prompt).toContain("ana, carla");
    expect(prompt).toContain("1. Vendas");
  });
});
