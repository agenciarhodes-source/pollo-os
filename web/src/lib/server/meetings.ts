import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as z from "zod";
import { schema } from "@/lib/db";
import { listMessages, sendMessage } from "./repo";
import { HttpError } from "./tenant";

/*
 * Reuniões executivas com o Pollo CEO. Como no resto do Pollo OS, toda função recebe a empresa
 * e filtra por ela; além disso, uma reunião só é vista pelos participantes dela.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<PgQueryResultHKT, typeof schema, any>;

export const STATUSES = ["rascunho", "agendada", "em_andamento", "concluida", "cancelada"] as const;
export type MeetingStatus = (typeof STATUSES)[number];

/** As mudanças de status possíveis, e de onde cada uma pode partir. */
export const TRANSITIONS = {
  agendar: { from: ["rascunho"], to: "agendada" },
  iniciar: { from: ["rascunho", "agendada"], to: "em_andamento" },
  encerrar: { from: ["em_andamento"], to: "concluida" },
  cancelar: { from: ["rascunho", "agendada"], to: "cancelada" },
} as const satisfies Record<string, { from: readonly MeetingStatus[]; to: MeetingStatus }>;
export type MeetingAction = keyof typeof TRANSITIONS;

const EDITABLE: readonly MeetingStatus[] = ["rascunho", "agendada"];

/* ---------- Validação ---------- */

const MAX_HOURS = 8;

export const meetingInput = z
  .object({
    title: z.string().trim().min(1).max(120),
    agenda: z.string().trim().max(4000).default(""),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    timezone: z.string().trim().min(1).max(64).default("America/Sao_Paulo"),
    participantIds: z.array(z.string().min(1)).max(20).default([]),
    /** true: já entra agendada; false: fica como rascunho. */
    schedule: z.boolean().default(true),
  })
  .refine((m) => m.endsAt > m.startsAt, { message: "O fim tem de ser depois do início.", path: ["endsAt"] })
  .refine((m) => m.endsAt.getTime() - m.startsAt.getTime() <= MAX_HOURS * 3600_000, {
    message: `Uma reunião vai até ${MAX_HOURS} horas.`,
    path: ["endsAt"],
  });
export type MeetingInput = z.infer<typeof meetingInput>;

export const statusInput = z.object({ action: z.enum(Object.keys(TRANSITIONS) as [MeetingAction, ...MeetingAction[]]) });

const item = z.object({ text: z.string().trim().min(1).max(500) });
const actionItem = item.extend({
  owner: z.string().trim().max(120).default(""),
  due: z.string().trim().max(40).default(""),
});

export const minutesInput = z.object({
  summary: z.string().trim().max(8000).default(""),
  decisions: z.array(item).max(50).default([]),
  actionItems: z.array(actionItem).max(50).default([]),
  openQuestions: z.string().trim().max(4000).default(""),
});
export type MinutesInput = z.infer<typeof minutesInput>;

/* ---------- Pessoas da empresa ---------- */

export function listOrgMembers(db: Db, orgId: string) {
  return db
    .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
    .from(schema.member)
    .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
    .where(eq(schema.member.organizationId, orgId))
    .orderBy(asc(schema.user.name));
}

/** Só aceita participantes que são membros desta empresa; quem cria entra sempre. */
async function validParticipants(db: Db, orgId: string, creatorId: string, ids: string[]) {
  const wanted = [...new Set([creatorId, ...ids])];
  const rows = await db
    .select({ id: schema.member.userId })
    .from(schema.member)
    .where(and(eq(schema.member.organizationId, orgId), inArray(schema.member.userId, wanted)));
  const ok = new Set(rows.map((r) => r.id));
  if (wanted.some((id) => !ok.has(id))) throw new HttpError(422, "Só pessoas desta empresa podem participar.");
  return wanted;
}

/* ---------- Leitura ---------- */

const meetingCols = {
  id: schema.executiveMeetings.id,
  title: schema.executiveMeetings.title,
  agenda: schema.executiveMeetings.agenda,
  startsAt: schema.executiveMeetings.startsAt,
  endsAt: schema.executiveMeetings.endsAt,
  timezone: schema.executiveMeetings.timezone,
  status: schema.executiveMeetings.status,
  createdBy: schema.executiveMeetings.createdBy,
  startedAt: schema.executiveMeetings.startedAt,
  finishedAt: schema.executiveMeetings.finishedAt,
  canceledAt: schema.executiveMeetings.canceledAt,
};

/** As reuniões de que a pessoa participa: as próximas (inclui rascunhos e em andamento) ou o histórico. */
export async function listMeetings(db: Db, orgId: string, userId: string, scope: "proximas" | "historico") {
  const open: MeetingStatus[] = ["rascunho", "agendada", "em_andamento"];
  const done: MeetingStatus[] = ["concluida", "cancelada"];
  return db
    .select(meetingCols)
    .from(schema.executiveMeetings)
    .innerJoin(
      schema.meetingParticipants,
      and(
        eq(schema.meetingParticipants.meetingId, schema.executiveMeetings.id),
        eq(schema.meetingParticipants.userId, userId),
      ),
    )
    .where(
      and(
        eq(schema.executiveMeetings.organizationId, orgId),
        inArray(schema.executiveMeetings.status, scope === "proximas" ? open : done),
      ),
    )
    .orderBy(scope === "proximas" ? asc(schema.executiveMeetings.startsAt) : desc(schema.executiveMeetings.startsAt));
}

/** Uma reunião, com participantes e ata. 404 se não existir aqui ou se a pessoa não participar. */
export async function getMeeting(db: Db, orgId: string, userId: string, id: string) {
  if (!z.uuid().safeParse(id).success) throw new HttpError(404, "Esta reunião não existe ou você não participa dela.");
  const [meeting] = await db
    .select(meetingCols)
    .from(schema.executiveMeetings)
    .innerJoin(
      schema.meetingParticipants,
      and(
        eq(schema.meetingParticipants.meetingId, schema.executiveMeetings.id),
        eq(schema.meetingParticipants.userId, userId),
      ),
    )
    .where(and(eq(schema.executiveMeetings.id, id), eq(schema.executiveMeetings.organizationId, orgId)))
    .limit(1);
  if (!meeting) throw new HttpError(404, "Esta reunião não existe ou você não participa dela.");

  const participants = await db
    .select({ id: schema.user.id, name: schema.user.name })
    .from(schema.meetingParticipants)
    .innerJoin(schema.user, eq(schema.meetingParticipants.userId, schema.user.id))
    .where(and(eq(schema.meetingParticipants.meetingId, id), eq(schema.meetingParticipants.organizationId, orgId)))
    .orderBy(asc(schema.user.name));

  const [minutesRow] = await db
    .select()
    .from(schema.meetingMinutes)
    .where(and(eq(schema.meetingMinutes.meetingId, id), eq(schema.meetingMinutes.organizationId, orgId)))
    .limit(1);

  const minutes = minutesRow
    ? {
        summary: minutesRow.summary,
        decisions: JSON.parse(minutesRow.decisions) as { text: string }[],
        actionItems: JSON.parse(minutesRow.actionItems) as { text: string; owner: string; due: string }[],
        openQuestions: minutesRow.openQuestions,
        confirmedAt: minutesRow.confirmedAt,
        confirmedBy: minutesRow.confirmedBy,
      }
    : null;

  return { ...meeting, participants, minutes, isOwner: meeting.createdBy === userId };
}

async function requireOwner(db: Db, orgId: string, userId: string, id: string) {
  const m = await getMeeting(db, orgId, userId, id);
  if (!m.isOwner) throw new HttpError(403, "Só quem marcou a reunião pode mudar isto.");
  return m;
}

/* ---------- Escrita ---------- */

export async function createMeeting(db: Db, orgId: string, userId: string, input: MeetingInput) {
  const participants = await validParticipants(db, orgId, userId, input.participantIds);
  const [row] = await db
    .insert(schema.executiveMeetings)
    .values({
      organizationId: orgId,
      createdBy: userId,
      title: input.title,
      agenda: input.agenda,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      timezone: input.timezone,
      status: input.schedule ? "agendada" : "rascunho",
    })
    .returning({ id: schema.executiveMeetings.id });
  await db
    .insert(schema.meetingParticipants)
    .values(participants.map((p) => ({ meetingId: row.id, organizationId: orgId, userId: p })));
  return row.id;
}

/** Edita título, pauta, horário e participantes. Só antes de começar. */
export async function updateMeeting(db: Db, orgId: string, userId: string, id: string, input: MeetingInput) {
  const m = await requireOwner(db, orgId, userId, id);
  if (!EDITABLE.includes(m.status as MeetingStatus)) {
    throw new HttpError(409, "Esta reunião já começou ou terminou e não pode mais ser editada.");
  }
  const participants = await validParticipants(db, orgId, userId, input.participantIds);
  const updated = await db
    .update(schema.executiveMeetings)
    .set({ title: input.title, agenda: input.agenda, startsAt: input.startsAt, endsAt: input.endsAt, timezone: input.timezone })
    .where(
      and(
        eq(schema.executiveMeetings.id, id),
        eq(schema.executiveMeetings.organizationId, orgId),
        inArray(schema.executiveMeetings.status, [...EDITABLE]),
      ),
    )
    .returning({ id: schema.executiveMeetings.id });
  if (updated.length === 0) throw new HttpError(409, "A reunião mudou enquanto você editava. Abra de novo.");
  await db
    .delete(schema.meetingParticipants)
    .where(and(eq(schema.meetingParticipants.meetingId, id), eq(schema.meetingParticipants.organizationId, orgId)));
  await db
    .insert(schema.meetingParticipants)
    .values(participants.map((p) => ({ meetingId: id, organizationId: orgId, userId: p })));
}

/**
 * Muda o status. A troca é feita com o status de origem na própria condição do UPDATE: se dois
 * pedidos chegam juntos, só um vale e o outro recebe 409.
 */
export async function transitionMeeting(db: Db, orgId: string, userId: string, id: string, action: MeetingAction) {
  const m = await requireOwner(db, orgId, userId, id);
  const { from, to } = TRANSITIONS[action];
  if (!(from as readonly string[]).includes(m.status)) {
    throw new HttpError(409, `Não dá para ${action} uma reunião ${m.status.replace("_", " ")}.`);
  }
  const now = new Date();
  const stamp =
    to === "em_andamento" ? { startedAt: now } : to === "concluida" ? { finishedAt: now } : to === "cancelada" ? { canceledAt: now } : {};
  const rows = await db
    .update(schema.executiveMeetings)
    .set({ status: to, ...stamp })
    .where(
      and(
        eq(schema.executiveMeetings.id, id),
        eq(schema.executiveMeetings.organizationId, orgId),
        inArray(schema.executiveMeetings.status, [...from]),
      ),
    )
    .returning({ status: schema.executiveMeetings.status });
  if (rows.length === 0) throw new HttpError(409, "A reunião mudou de status ao mesmo tempo. Atualize a página.");
  return rows[0].status as MeetingStatus;
}

/** Guarda a ata. Durante ou depois da reunião, enquanto não estiver confirmada. */
export async function saveMinutes(db: Db, orgId: string, userId: string, id: string, input: MinutesInput) {
  const m = await requireOwner(db, orgId, userId, id);
  if (!["em_andamento", "concluida"].includes(m.status)) {
    throw new HttpError(409, "A ata é escrita durante ou depois da reunião.");
  }
  if (m.minutes?.confirmedAt) throw new HttpError(409, "A ata já foi confirmada e não muda mais.");
  const values = {
    summary: input.summary,
    decisions: JSON.stringify(input.decisions),
    actionItems: JSON.stringify(input.actionItems),
    openQuestions: input.openQuestions,
    updatedBy: userId,
  };
  const rows = await db
    .insert(schema.meetingMinutes)
    .values({ meetingId: id, organizationId: orgId, ...values })
    .onConflictDoUpdate({
      target: schema.meetingMinutes.meetingId,
      set: values,
      setWhere: and(isNull(schema.meetingMinutes.confirmedAt), eq(schema.meetingMinutes.organizationId, orgId)),
    })
    .returning({ id: schema.meetingMinutes.meetingId });
  if (rows.length === 0) throw new HttpError(409, "A ata já foi confirmada e não muda mais.");
}

/** Confirma a ata: a partir daqui ela vale e não muda mais. Só depois de encerrada a reunião. */
export async function confirmMinutes(db: Db, orgId: string, userId: string, id: string) {
  const m = await requireOwner(db, orgId, userId, id);
  if (m.status !== "concluida") throw new HttpError(409, "Encerre a reunião antes de confirmar a ata.");
  if (!m.minutes || !m.minutes.summary.trim()) throw new HttpError(422, "Escreva ao menos o resumo antes de confirmar.");
  const rows = await db
    .update(schema.meetingMinutes)
    .set({ confirmedBy: userId, confirmedAt: new Date() })
    .where(
      and(
        eq(schema.meetingMinutes.meetingId, id),
        eq(schema.meetingMinutes.organizationId, orgId),
        isNull(schema.meetingMinutes.confirmedAt),
      ),
    )
    .returning({ id: schema.meetingMinutes.meetingId });
  if (rows.length === 0) throw new HttpError(409, "A ata já foi confirmada.");
}

/* ---------- Conversa da reunião ---------- */

const meetingKey = (id: string) => `reuniao:${id}`;

export async function listMeetingMessages(db: Db, orgId: string, userId: string, id: string) {
  await getMeeting(db, orgId, userId, id);
  return listMessages(db, orgId, userId, meetingKey(id));
}

/** Conversa por texto com o Pollo CEO, só enquanto a reunião está em andamento. */
export async function sendMeetingMessage(db: Db, orgId: string, userId: string, id: string, text: string) {
  const m = await getMeeting(db, orgId, userId, id);
  if (m.status !== "em_andamento") throw new HttpError(409, "A conversa da reunião abre quando ela começa.");
  return sendMessage(db, orgId, userId, meetingKey(id), "Pollo CEO", text);
}
