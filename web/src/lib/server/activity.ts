import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { schema } from "@/lib/db";

/*
 * O registro de atividade: o que aconteceu, quem fez e quando. Só se acrescenta.
 * Quem lê vê só o que poderia ver no próprio app: itens privados, só o autor; reuniões, só os
 * participantes.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<PgQueryResultHKT, typeof schema, any>;

export type ActivityTarget = "agente" | "acesso" | "reuniao" | "ata" | "memoria";

export const ACTIVITY_TYPES: { id: ActivityTarget; label: string }[] = [
  { id: "agente", label: "Agentes" },
  { id: "acesso", label: "Acessos aos apps" },
  { id: "reuniao", label: "Reuniões" },
  { id: "ata", label: "Atas" },
  { id: "memoria", label: "Segundo Cérebro" },
];

export async function recordActivity(
  db: Db,
  event: {
    orgId: string;
    userId: string;
    action: string;
    targetType: ActivityTarget;
    targetId?: string | null;
    summary: string;
    visibility?: "empresa" | "privada";
  },
) {
  await db.insert(schema.activityEvents).values({
    organizationId: event.orgId,
    actorUserId: event.userId,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId ?? null,
    summary: event.summary,
    visibility: event.visibility ?? "empresa",
  });
}

const PAGE = 50;

/** A atividade da empresa que esta pessoa pode ver, da mais nova para a mais antiga, de 50 em 50. */
export async function listActivity(
  db: Db,
  orgId: string,
  userId: string,
  options: { type?: ActivityTarget; before?: Date } = {},
) {
  const e = schema.activityEvents;
  const canSee = and(
    or(eq(e.visibility, "empresa"), eq(e.actorUserId, userId)),
    // Reuniões e atas: só para os participantes da reunião.
    or(
      sql`${e.targetType} not in ('reuniao', 'ata')`,
      sql`exists (select 1 from ${schema.meetingParticipants} mp where mp.meeting_id::text = ${e.targetId} and mp.user_id = ${userId})`,
    ),
  );
  const rows = await db
    .select({
      id: e.id,
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId,
      summary: e.summary,
      createdAt: e.createdAt,
      actorName: schema.user.name,
    })
    .from(e)
    .leftJoin(schema.user, eq(e.actorUserId, schema.user.id))
    .where(
      and(
        eq(e.organizationId, orgId),
        canSee,
        options.type ? eq(e.targetType, options.type) : undefined,
        options.before ? lt(e.createdAt, options.before) : undefined,
      ),
    )
    .orderBy(desc(e.createdAt))
    .limit(PAGE + 1);
  return { events: rows.slice(0, PAGE), hasMore: rows.length > PAGE };
}
