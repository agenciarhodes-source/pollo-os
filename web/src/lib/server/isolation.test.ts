// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { createAuth } from "@/lib/auth";
import { createTestDb, type TestDb } from "@/lib/db/test-db";
import {
  createAgent,
  deleteAgent,
  findAgent,
  listAgents,
  listAppAccess,
  listMessages,
  resolveAgentName,
  sendMessage,
  setAppAccess,
  updateAgent,
} from "./repo";
import { agentInput } from "./validation";

/*
 * Isolamento entre empresas (A/B): duas empresas no mesmo banco. Tudo o que uma faz tem de ser
 * invisível e intocável para a outra, mesmo sabendo o id exato do que é da outra.
 */

const draft = agentInput.parse({ name: "Vendas", purpose: "Cuida dos leads", shape: "quadrado", color: "azul", face: "olhos", mood: "calmo" });

let db: TestDb;
let A: { userId: string; orgId: string };
let B: { userId: string; orgId: string };

async function makeCompany(auth: ReturnType<typeof createAuth>, who: string) {
  const res = await auth.api.signUpEmail({
    body: { name: who, email: `${who}@exemplo.com`, password: "senha-segura-1" },
    returnHeaders: true,
  });
  const headers = new Headers({ cookie: (res.headers.get("set-cookie") ?? "").split(";")[0] });
  const org = await auth.api.createOrganization({ body: { name: `Empresa ${who}`, slug: `empresa-${who}` }, headers });
  return { userId: res.response.user.id, orgId: org!.id };
}

beforeAll(async () => {
  db = await createTestDb();
  const auth = createAuth(db);
  A = await makeCompany(auth, "ana");
  B = await makeCompany(auth, "bruno");
});

describe("isolamento entre empresas", () => {
  it("cada empresa só lista os próprios agentes", async () => {
    const a = await createAgent(db, A.orgId, A.userId, draft);
    await createAgent(db, B.orgId, B.userId, { ...draft, name: "Atendimento" });

    const listA = await listAgents(db, A.orgId);
    const listB = await listAgents(db, B.orgId);
    expect(listA.map((x) => x.name)).toEqual(["Vendas"]);
    expect(listB.map((x) => x.name)).toEqual(["Atendimento"]);
    expect(await findAgent(db, B.orgId, a.id)).toBeNull();
  });

  it("B não consegue alterar nem apagar um agente de A, mesmo com o id", async () => {
    const a = await createAgent(db, A.orgId, A.userId, { ...draft, name: "Secreto de A" });

    expect(await updateAgent(db, B.orgId, a.id, { ...draft, name: "Invadido" })).toBeNull();
    expect(await deleteAgent(db, B.orgId, a.id)).toBe(false);

    const still = await findAgent(db, A.orgId, a.id);
    expect(still?.name).toBe("Secreto de A");
  });

  it("B não consegue dar a um agente de A acesso a um app", async () => {
    const a = await createAgent(db, A.orgId, A.userId, { ...draft, name: "Analista" });
    expect(await setAppAccess(db, B.orgId, B.userId, "flipform", a.id, true)).toBe(false);
    expect(await listAppAccess(db, A.orgId)).not.toHaveProperty("flipform");

    expect(await setAppAccess(db, A.orgId, A.userId, "flipform", a.id, true)).toBe(true);
    expect((await listAppAccess(db, A.orgId)).flipform).toContain(a.id);
    expect(await listAppAccess(db, B.orgId)).toEqual({});
  });

  it("as conversas ficam separadas por empresa e por pessoa", async () => {
    await sendMessage(db, A.orgId, A.userId, "pollo-ceo", "Pollo CEO", "Como foram as vendas?");

    const mineA = await listMessages(db, A.orgId, A.userId, "pollo-ceo");
    expect(mineA.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(mineA[1].demo).toBe(true);
    expect(mineA[1].text).toContain("não é uma resposta real");

    expect(await listMessages(db, B.orgId, B.userId, "pollo-ceo")).toEqual([]);
    // A mesma pessoa de A não vê a conversa de A pelos olhos de B.
    expect(await listMessages(db, B.orgId, A.userId, "pollo-ceo")).toEqual([]);
  });

  it("B não conversa com um agente de A", async () => {
    const a = await createAgent(db, A.orgId, A.userId, { ...draft, name: "Só de A" });
    expect(await resolveAgentName(db, A.orgId, a.id)).toBe("Só de A");
    expect(await resolveAgentName(db, B.orgId, a.id)).toBeNull();
    expect(await resolveAgentName(db, B.orgId, "pollo-ceo")).toBe("Pollo CEO");
    expect(await resolveAgentName(db, B.orgId, "qualquer-coisa")).toBeNull();
  });

  it("apagar um agente apaga os acessos dele", async () => {
    const a = await createAgent(db, A.orgId, A.userId, { ...draft, name: "Temporário" });
    await setAppAccess(db, A.orgId, A.userId, "flip-intelligence", a.id, true);
    expect(await deleteAgent(db, A.orgId, a.id)).toBe(true);
    expect((await listAppAccess(db, A.orgId))["flip-intelligence"] ?? []).not.toContain(a.id);
  });
});

describe("validação", () => {
  it("recusa agente sem nome ou com opções que não existem", () => {
    expect(() => agentInput.parse({ ...draft, name: "  " })).toThrow();
    expect(() => agentInput.parse({ ...draft, color: "marrom" })).toThrow();
    expect(() => agentInput.parse({ ...draft, shape: "losango" })).toThrow();
  });
});
