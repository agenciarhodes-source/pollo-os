// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { createAuth } from "@/lib/auth";
import { createTestDb, type TestDb } from "@/lib/db/test-db";
import {
  confirmMinutes,
  createMeeting,
  getMeeting,
  listMeetingMessages,
  listMeetings,
  meetingInput,
  saveMinutes,
  sendMeetingMessage,
  transitionMeeting,
  updateMeeting,
} from "./meetings";

let db: TestDb;
let auth: ReturnType<typeof createAuth>;
let A: { userId: string; orgId: string; headers: Headers };
let A2: { userId: string }; // segunda pessoa da empresa A
let B: { userId: string; orgId: string };

async function signUp(who: string) {
  const res = await auth.api.signUpEmail({
    body: { name: who, email: `${who}@exemplo.com`, password: "senha-segura-1" },
    returnHeaders: true,
  });
  return { userId: res.response.user.id, headers: new Headers({ cookie: (res.headers.get("set-cookie") ?? "").split(";")[0] }) };
}

const at = (h: number) => new Date(Date.UTC(2026, 11, 1, h));
const input = (over: Partial<Record<string, unknown>> = {}) =>
  meetingInput.parse({ title: "Reunião de segunda", agenda: "Vendas da semana", startsAt: at(12), endsAt: at(13), ...over });

beforeAll(async () => {
  db = await createTestDb();
  auth = createAuth(db);

  const ana = await signUp("ana");
  const orgA = await auth.api.createOrganization({ body: { name: "A", slug: "a" }, headers: ana.headers });
  A = { userId: ana.userId, orgId: orgA!.id, headers: ana.headers };

  const carla = await signUp("carla");
  await auth.api.addMember({ body: { userId: carla.userId, organizationId: A.orgId, role: "member" } });
  A2 = { userId: carla.userId };

  const bruno = await signUp("bruno");
  const orgB = await auth.api.createOrganization({ body: { name: "B", slug: "b" }, headers: bruno.headers });
  B = { userId: bruno.userId, orgId: orgB!.id };
});

describe("validação", () => {
  it("o fim tem de ser depois do início, e até 8 horas", () => {
    expect(() => input({ endsAt: at(11) })).toThrow();
    expect(() => input({ endsAt: at(21) })).toThrow();
    expect(() => input({ title: " " })).toThrow();
  });
});

describe("quem vê a reunião", () => {
  it("só os participantes, e só na empresa da reunião", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input());
    expect((await getMeeting(db, A.orgId, A.userId, id)).title).toBe("Reunião de segunda");

    // Colega da mesma empresa, mas não convidada: não vê.
    await expect(getMeeting(db, A.orgId, A2.userId, id)).rejects.toMatchObject({ status: 404 });
    expect(await listMeetings(db, A.orgId, A2.userId, "proximas")).toEqual([]);

    // Outra empresa, mesmo com o id: não vê.
    await expect(getMeeting(db, B.orgId, B.userId, id)).rejects.toMatchObject({ status: 404 });
    await expect(getMeeting(db, B.orgId, A.userId, id)).rejects.toMatchObject({ status: 404 });
  });

  it("convidar uma colega faz a reunião aparecer para ela", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input({ participantIds: [A2.userId] }));
    const seen = await getMeeting(db, A.orgId, A2.userId, id);
    expect(seen.participants.map((p) => p.name).sort()).toEqual(["ana", "carla"]);
    expect(seen.isOwner).toBe(false);
  });

  it("não aceita como participante alguém de outra empresa", async () => {
    await expect(createMeeting(db, A.orgId, A.userId, input({ participantIds: [B.userId] }))).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe("status", () => {
  it("segue a ordem: agendada → em andamento → concluída", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input());
    expect((await getMeeting(db, A.orgId, A.userId, id)).status).toBe("agendada");
    await expect(transitionMeeting(db, A.orgId, A.userId, id, "encerrar")).rejects.toMatchObject({ status: 409 });
    expect(await transitionMeeting(db, A.orgId, A.userId, id, "iniciar")).toBe("em_andamento");
    await expect(transitionMeeting(db, A.orgId, A.userId, id, "cancelar")).rejects.toMatchObject({ status: 409 });
    expect(await transitionMeeting(db, A.orgId, A.userId, id, "encerrar")).toBe("concluida");

    const m = await getMeeting(db, A.orgId, A.userId, id);
    expect(m.startedAt).toBeInstanceOf(Date);
    expect(m.finishedAt).toBeInstanceOf(Date);
    expect((await listMeetings(db, A.orgId, A.userId, "historico")).map((x) => x.id)).toContain(id);
  });

  it("rascunho pode ser agendado ou cancelado; cancelada não volta", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input({ schedule: false }));
    expect((await getMeeting(db, A.orgId, A.userId, id)).status).toBe("rascunho");
    expect(await transitionMeeting(db, A.orgId, A.userId, id, "cancelar")).toBe("cancelada");
    await expect(transitionMeeting(db, A.orgId, A.userId, id, "agendar")).rejects.toMatchObject({ status: 409 });
    await expect(transitionMeeting(db, A.orgId, A.userId, id, "iniciar")).rejects.toMatchObject({ status: 409 });
  });

  it("dois cliques ao mesmo tempo: só um vale", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input());
    const results = await Promise.allSettled([
      transitionMeeting(db, A.orgId, A.userId, id, "iniciar"),
      transitionMeeting(db, A.orgId, A.userId, id, "iniciar"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await getMeeting(db, A.orgId, A.userId, id)).status).toBe("em_andamento");
  });

  it("só quem marcou muda a reunião; participante convidado não", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input({ participantIds: [A2.userId] }));
    await expect(transitionMeeting(db, A.orgId, A2.userId, id, "cancelar")).rejects.toMatchObject({ status: 403 });
    await expect(updateMeeting(db, A.orgId, A2.userId, id, input({ title: "Outra" }))).rejects.toMatchObject({ status: 403 });
  });

  it("depois de começar, não dá mais para editar", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input());
    await updateMeeting(db, A.orgId, A.userId, id, input({ title: "Título novo" }));
    expect((await getMeeting(db, A.orgId, A.userId, id)).title).toBe("Título novo");
    await transitionMeeting(db, A.orgId, A.userId, id, "iniciar");
    await expect(updateMeeting(db, A.orgId, A.userId, id, input({ title: "Tarde demais" }))).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe("conversa da reunião", () => {
  it("só abre com a reunião em andamento, e a resposta é de demonstração", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input());
    await expect(sendMeetingMessage(db, A.orgId, A.userId, id, "Oi")).rejects.toMatchObject({ status: 409 });
    await transitionMeeting(db, A.orgId, A.userId, id, "iniciar");
    const sent = await sendMeetingMessage(db, A.orgId, A.userId, id, "Vamos começar pela pauta");
    expect(sent[1].demo).toBe(true);
    expect(await listMeetingMessages(db, A.orgId, A.userId, id)).toHaveLength(2);
    await expect(listMeetingMessages(db, B.orgId, B.userId, id)).rejects.toMatchObject({ status: 404 });
  });
});

describe("ata", () => {
  const minutes = { summary: "Vendas subiram", decisions: [{ text: "Manter a campanha" }], actionItems: [{ text: "Revisar preços", owner: "ana", due: "sexta" }], openQuestions: "" };

  it("é escrita durante ou depois, confirmada só depois de encerrar, e então não muda mais", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input());
    await expect(saveMinutes(db, A.orgId, A.userId, id, minutes)).rejects.toMatchObject({ status: 409 });

    await transitionMeeting(db, A.orgId, A.userId, id, "iniciar");
    await saveMinutes(db, A.orgId, A.userId, id, minutes);
    await expect(confirmMinutes(db, A.orgId, A.userId, id)).rejects.toMatchObject({ status: 409 });

    await transitionMeeting(db, A.orgId, A.userId, id, "encerrar");
    await confirmMinutes(db, A.orgId, A.userId, id);

    const m = await getMeeting(db, A.orgId, A.userId, id);
    expect(m.minutes?.confirmedAt).toBeInstanceOf(Date);
    expect(m.minutes?.decisions).toEqual([{ text: "Manter a campanha" }]);

    await expect(saveMinutes(db, A.orgId, A.userId, id, { ...minutes, summary: "Mudado" })).rejects.toMatchObject({
      status: 409,
    });
    await expect(confirmMinutes(db, A.orgId, A.userId, id)).rejects.toMatchObject({ status: 409 });
  });

  it("não confirma ata sem resumo", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input());
    await transitionMeeting(db, A.orgId, A.userId, id, "iniciar");
    await transitionMeeting(db, A.orgId, A.userId, id, "encerrar");
    await saveMinutes(db, A.orgId, A.userId, id, { ...minutes, summary: "" });
    await expect(confirmMinutes(db, A.orgId, A.userId, id)).rejects.toMatchObject({ status: 422 });
  });

  it("outra empresa não escreve nem confirma a ata", async () => {
    const id = await createMeeting(db, A.orgId, A.userId, input());
    await transitionMeeting(db, A.orgId, A.userId, id, "iniciar");
    await expect(saveMinutes(db, B.orgId, B.userId, id, minutes)).rejects.toMatchObject({ status: 404 });
    await expect(confirmMinutes(db, B.orgId, B.userId, id)).rejects.toMatchObject({ status: 404 });
  });
});
