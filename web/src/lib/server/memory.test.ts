// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { createAuth } from "@/lib/auth";
import { createTestDb, type TestDb } from "@/lib/db/test-db";
import { listActivity, recordActivity } from "./activity";
import { confirmMinutes, createMeeting, meetingInput, saveMinutes, transitionMeeting } from "./meetings";
import { createMemory, deleteMemory, getMemory, linkMemory, listMemory, memoryInput, unlinkMemory, updateMemory } from "./memory";

let db: TestDb;
let auth: ReturnType<typeof createAuth>;
let A: { userId: string; orgId: string };
let A2: { userId: string };
let B: { userId: string; orgId: string };

async function signUp(who: string) {
  const res = await auth.api.signUpEmail({
    body: { name: who, email: `${who}@exemplo.com`, password: "senha-segura-1" },
    returnHeaders: true,
  });
  return { userId: res.response.user.id, headers: new Headers({ cookie: (res.headers.get("set-cookie") ?? "").split(";")[0] }) };
}

const note = (over: Record<string, unknown> = {}) => memoryInput.parse({ title: "Clientes preferem WhatsApp", body: "Visto nas vendas de outubro", ...over });

beforeAll(async () => {
  db = await createTestDb();
  auth = createAuth(db);
  const ana = await signUp("ana");
  const orgA = await auth.api.createOrganization({ body: { name: "A", slug: "a" }, headers: ana.headers });
  A = { userId: ana.userId, orgId: orgA!.id };
  const carla = await signUp("carla");
  await auth.api.addMember({ body: { userId: carla.userId, organizationId: A.orgId, role: "member" } });
  A2 = { userId: carla.userId };
  const bruno = await signUp("bruno");
  const orgB = await auth.api.createOrganization({ body: { name: "B", slug: "b" }, headers: bruno.headers });
  B = { userId: bruno.userId, orgId: orgB!.id };
});

describe("Segundo Cérebro: quem vê", () => {
  it("itens da empresa: todos da empresa; outra empresa, ninguém", async () => {
    const id = await createMemory(db, A.orgId, A.userId, note());
    expect((await getMemory(db, A.orgId, A2.userId, id)).title).toBe("Clientes preferem WhatsApp");
    await expect(getMemory(db, B.orgId, B.userId, id)).rejects.toMatchObject({ status: 404 });
    expect((await listMemory(db, B.orgId, B.userId)).map((i) => i.id)).not.toContain(id);
  });

  it("itens privados: só quem criou", async () => {
    const id = await createMemory(db, A.orgId, A.userId, note({ title: "Ideia minha", visibility: "privada" }));
    expect((await getMemory(db, A.orgId, A.userId, id)).visibility).toBe("privada");
    await expect(getMemory(db, A.orgId, A2.userId, id)).rejects.toMatchObject({ status: 404 });
    expect((await listMemory(db, A.orgId, A2.userId)).map((i) => i.id)).not.toContain(id);
  });

  it("só quem registrou altera ou apaga", async () => {
    const id = await createMemory(db, A.orgId, A.userId, note({ title: "Original" }));
    await expect(updateMemory(db, A.orgId, A2.userId, id, note({ title: "Mudado" }))).rejects.toMatchObject({ status: 403 });
    await expect(deleteMemory(db, A.orgId, A2.userId, id)).rejects.toMatchObject({ status: 403 });
    await expect(updateMemory(db, B.orgId, B.userId, id, note({ title: "Invasão" }))).rejects.toMatchObject({ status: 404 });
    await updateMemory(db, A.orgId, A.userId, id, note({ title: "Revisto" }));
    expect((await getMemory(db, A.orgId, A.userId, id)).title).toBe("Revisto");
  });

  it("busca no título e no texto, e filtra por tipo", async () => {
    await createMemory(db, A.orgId, A.userId, note({ title: "Preço do pão francês", body: "Subiu 10% em novembro", kind: "aprendizado" }));
    expect((await listMemory(db, A.orgId, A.userId, { q: "pão" })).map((i) => i.title)).toContain("Preço do pão francês");
    expect((await listMemory(db, A.orgId, A.userId, { q: "novembro" })).map((i) => i.title)).toContain("Preço do pão francês");
    expect((await listMemory(db, A.orgId, A.userId, { kind: "aprendizado" })).every((i) => i.kind === "aprendizado")).toBe(true);
    // "%" e "_" são buscados como texto, não como curinga.
    expect((await listMemory(db, A.orgId, A.userId, { q: "10%" })).map((i) => i.title)).toContain("Preço do pão francês");
    expect(await listMemory(db, A.orgId, A.userId, { q: "1_%" })).toEqual([]);
  });

  it("recusa endereço que não seja http(s)", () => {
    expect(() => note({ kind: "documento", url: "javascript:alert(1)" })).toThrow();
    expect(note({ kind: "documento", url: "https://exemplo.com/doc" }).url).toBe("https://exemplo.com/doc");
  });
});

describe("Segundo Cérebro: ligações", () => {
  it("ligam nos dois sentidos e somem ao desfazer", async () => {
    const a = await createMemory(db, A.orgId, A.userId, note({ title: "Item 1" }));
    const b = await createMemory(db, A.orgId, A.userId, note({ title: "Item 2" }));
    await linkMemory(db, A.orgId, A.userId, a, b);
    expect((await getMemory(db, A.orgId, A.userId, a)).links.map((l) => l.title)).toEqual(["Item 2"]);
    expect((await getMemory(db, A.orgId, A.userId, b)).links.map((l) => l.title)).toEqual(["Item 1"]);
    await unlinkMemory(db, A.orgId, A.userId, b, a);
    expect((await getMemory(db, A.orgId, A.userId, a)).links).toEqual([]);
  });

  it("não liga a item de outra empresa nem a item privado de outra pessoa", async () => {
    const mine = await createMemory(db, A.orgId, A.userId, note({ title: "Meu" }));
    const other = await createMemory(db, B.orgId, B.userId, note({ title: "Da B" }));
    await expect(linkMemory(db, A.orgId, A.userId, mine, other)).rejects.toMatchObject({ status: 404 });
    const secret = await createMemory(db, A.orgId, A2.userId, note({ title: "Segredo da Carla", visibility: "privada" }));
    await expect(linkMemory(db, A.orgId, A.userId, mine, secret)).rejects.toMatchObject({ status: 404 });
    await expect(linkMemory(db, A.orgId, A.userId, mine, mine)).rejects.toMatchObject({ status: 422 });
  });

  it("uma ligação com item privado de outra pessoa não aparece para quem não pode vê-lo", async () => {
    const shared = await createMemory(db, A.orgId, A2.userId, note({ title: "Compartilhado" }));
    const secret = await createMemory(db, A.orgId, A2.userId, note({ title: "Só da Carla", visibility: "privada" }));
    await linkMemory(db, A.orgId, A2.userId, shared, secret);
    expect((await getMemory(db, A.orgId, A2.userId, shared)).links.map((l) => l.title)).toEqual(["Só da Carla"]);
    expect((await getMemory(db, A.orgId, A.userId, shared)).links).toEqual([]);
  });
});

describe("ata confirmada vai para o Segundo Cérebro", () => {
  it("cria o resumo e uma decisão por item, ligados, com a reunião como fonte", async () => {
    const id = await createMeeting(
      db,
      A.orgId,
      A.userId,
      meetingInput.parse({ title: "Revisão", startsAt: new Date(Date.UTC(2026, 10, 23, 17)), endsAt: new Date(Date.UTC(2026, 10, 23, 18)) }),
    );
    await transitionMeeting(db, A.orgId, A.userId, id, "iniciar");
    await saveMinutes(db, A.orgId, A.userId, id, {
      summary: "Semana boa",
      decisions: [{ text: "Abrir aos domingos" }, { text: "Rever preços" }],
      actionItems: [],
      openQuestions: "",
    });
    await transitionMeeting(db, A.orgId, A.userId, id, "encerrar");
    await confirmMinutes(db, A.orgId, A.userId, id);

    const decisions = await listMemory(db, A.orgId, A2.userId, { kind: "decisao" });
    const fromMeeting = decisions.filter((d) => d.sourceMeetingId === id);
    expect(fromMeeting.map((d) => d.title).sort()).toEqual(["Abrir aos domingos", "Rever preços"]);
    expect(fromMeeting[0].source).toContain("Revisão");

    const summary = (await listMemory(db, A.orgId, A.userId, { q: "Ata: Revisão" }))[0];
    expect((await getMemory(db, A.orgId, A.userId, summary.id)).links).toHaveLength(2);
    expect(await listMemory(db, B.orgId, B.userId, { q: "Abrir aos domingos" })).toEqual([]);
  });
});

describe("Atividade", () => {
  it("cada empresa vê só a sua; privados, só o autor; reuniões, só participantes", async () => {
    await recordActivity(db, { orgId: A.orgId, userId: A.userId, action: "agente.criado", targetType: "agente", summary: "Ana criou o agente Vendas." });
    await recordActivity(db, { orgId: A.orgId, userId: A.userId, action: "memoria.criada", targetType: "memoria", summary: "Ana registrou algo privado.", visibility: "privada" });
    const meeting = await createMeeting(
      db,
      A.orgId,
      A.userId,
      meetingInput.parse({ title: "Só Ana", startsAt: new Date(Date.UTC(2026, 11, 1, 12)), endsAt: new Date(Date.UTC(2026, 11, 1, 13)) }),
    );
    await recordActivity(db, { orgId: A.orgId, userId: A.userId, action: "reuniao.agendada", targetType: "reuniao", targetId: meeting, summary: "Ana agendou a reunião “Só Ana”." });

    const ana = (await listActivity(db, A.orgId, A.userId)).events.map((e) => e.summary);
    expect(ana).toEqual(expect.arrayContaining(["Ana criou o agente Vendas.", "Ana registrou algo privado.", "Ana agendou a reunião “Só Ana”."]));

    const carla = (await listActivity(db, A.orgId, A2.userId)).events.map((e) => e.summary);
    expect(carla).toContain("Ana criou o agente Vendas.");
    expect(carla).not.toContain("Ana registrou algo privado.");
    expect(carla).not.toContain("Ana agendou a reunião “Só Ana”.");

    expect((await listActivity(db, B.orgId, B.userId)).events).toEqual([]);
  });

  it("filtra por tipo e traz o nome de quem fez", async () => {
    const { events } = await listActivity(db, A.orgId, A.userId, { type: "agente" });
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.targetType === "agente")).toBe(true);
    expect(events[0].actorName).toBe("ana");
  });
});
