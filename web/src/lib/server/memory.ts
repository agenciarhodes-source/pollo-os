import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as z from "zod";
import { schema } from "@/lib/db";
import { HttpError } from "./tenant";

/*
 * O Segundo Cérebro: a memória da empresa. Como no resto do Pollo OS, toda função filtra pela
 * empresa. Itens privados só aparecem para quem os criou.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<PgQueryResultHKT, typeof schema, any>;

export const KINDS = ["nota", "decisao", "aprendizado", "documento", "fonte"] as const;
export type MemoryKind = (typeof KINDS)[number];

export const memoryInput = z.object({
  kind: z.enum(KINDS).default("nota"),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(20000).default(""),
  source: z.string().trim().max(300).default(""),
  url: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), { message: "O endereço precisa começar com http:// ou https://." })
    .default(""),
  visibility: z.enum(["empresa", "privada"]).default("empresa"),
});
export type MemoryInput = z.infer<typeof memoryInput>;

export const linkInput = z.object({ targetId: z.uuid() });

const m = schema.memoryItems;

/** A condição "esta pessoa pode ver este item". */
const visibleTo = (orgId: string, userId: string) =>
  and(eq(m.organizationId, orgId), or(eq(m.visibility, "empresa"), eq(m.createdBy, userId)));

const cols = {
  id: m.id,
  kind: m.kind,
  title: m.title,
  body: m.body,
  source: m.source,
  url: m.url,
  sourceMeetingId: m.sourceMeetingId,
  visibility: m.visibility,
  createdBy: m.createdBy,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
};

/** Os itens que a pessoa pode ver, com busca no título e no texto e filtro por tipo. */
export function listMemory(db: Db, orgId: string, userId: string, options: { q?: string; kind?: MemoryKind } = {}) {
  const q = options.q?.trim();
  const like = q ? `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%` : null;
  return db
    .select(cols)
    .from(m)
    .where(
      and(
        visibleTo(orgId, userId),
        options.kind ? eq(m.kind, options.kind) : undefined,
        like ? or(ilike(m.title, like), ilike(m.body, like)) : undefined,
      ),
    )
    .orderBy(desc(m.updatedAt))
    .limit(200);
}

const NOT_FOUND = "Este item não existe ou é privado.";

export async function getMemory(db: Db, orgId: string, userId: string, id: string) {
  if (!z.uuid().safeParse(id).success) throw new HttpError(404, NOT_FOUND);
  const [item] = await db.select(cols).from(m).where(and(eq(m.id, id), visibleTo(orgId, userId))).limit(1);
  if (!item) throw new HttpError(404, NOT_FOUND);

  // Ligações nos dois sentidos, só com itens que a pessoa também pode ver.
  const l = schema.memoryLinks;
  const pairs = await db
    .select({ fromId: l.fromId, toId: l.toId })
    .from(l)
    .where(and(eq(l.organizationId, orgId), or(eq(l.fromId, id), eq(l.toId, id))));
  const otherIds = [...new Set(pairs.map((p) => (p.fromId === id ? p.toId : p.fromId)))];
  const links = otherIds.length
    ? await db
        .select({ id: m.id, title: m.title, kind: m.kind })
        .from(m)
        .where(and(inArray(m.id, otherIds), visibleTo(orgId, userId)))
    : [];

  return { ...item, links, isOwner: item.createdBy === userId };
}

/** Só quem criou muda ou apaga um item (os que vieram de uma ata, quem confirmou a ata). */
async function requireAuthor(db: Db, orgId: string, userId: string, id: string) {
  const item = await getMemory(db, orgId, userId, id);
  if (!item.isOwner) throw new HttpError(403, "Só quem registrou este item pode mudá-lo.");
  return item;
}

export async function createMemory(db: Db, orgId: string, userId: string, input: MemoryInput, extra: { sourceMeetingId?: string } = {}) {
  const [row] = await db
    .insert(m)
    .values({ ...input, url: input.url || null, organizationId: orgId, createdBy: userId, sourceMeetingId: extra.sourceMeetingId ?? null })
    .returning({ id: m.id });
  return row.id;
}

export async function updateMemory(db: Db, orgId: string, userId: string, id: string, input: MemoryInput) {
  await requireAuthor(db, orgId, userId, id);
  await db
    .update(m)
    .set({ ...input, url: input.url || null })
    .where(and(eq(m.id, id), eq(m.organizationId, orgId)));
}

export async function deleteMemory(db: Db, orgId: string, userId: string, id: string) {
  const item = await requireAuthor(db, orgId, userId, id);
  await db.delete(m).where(and(eq(m.id, id), eq(m.organizationId, orgId)));
  return item;
}

/** Liga dois itens. Os dois precisam ser visíveis para a pessoa, na mesma empresa. */
export async function linkMemory(db: Db, orgId: string, userId: string, fromId: string, toId: string) {
  if (fromId === toId) throw new HttpError(422, "Um item não se liga a ele mesmo.");
  await getMemory(db, orgId, userId, fromId);
  await getMemory(db, orgId, userId, toId);
  const [a, b] = fromId < toId ? [fromId, toId] : [toId, fromId];
  await db.insert(schema.memoryLinks).values({ organizationId: orgId, fromId: a, toId: b, createdBy: userId }).onConflictDoNothing();
}

export async function unlinkMemory(db: Db, orgId: string, userId: string, fromId: string, toId: string) {
  await getMemory(db, orgId, userId, fromId);
  const [a, b] = fromId < toId ? [fromId, toId] : [toId, fromId];
  await db
    .delete(schema.memoryLinks)
    .where(and(eq(schema.memoryLinks.organizationId, orgId), eq(schema.memoryLinks.fromId, a), eq(schema.memoryLinks.toId, b)));
}

/**
 * Leva para a memória da empresa o que uma ata confirmada decidiu: um item com o resumo e um
 * item por decisão, ligados entre si, com a reunião e a data como fonte.
 */
export async function ingestConfirmedMinutes(
  db: Db,
  orgId: string,
  userId: string,
  meeting: { id: string; title: string; startsAt: Date; timezone: string },
  minutes: { summary: string; decisions: { text: string }[] },
) {
  const day = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: meeting.timezone }).format(meeting.startsAt);
  const source = `Ata da reunião “${meeting.title}”, ${day}`;
  const summaryId = await createMemory(
    db,
    orgId,
    userId,
    { kind: "nota", title: `Ata: ${meeting.title}`, body: minutes.summary, source, url: "", visibility: "empresa" },
    { sourceMeetingId: meeting.id },
  );
  const decisionIds: string[] = [];
  for (const d of minutes.decisions) {
    const id = await createMemory(
      db,
      orgId,
      userId,
      { kind: "decisao", title: d.text.slice(0, 200), body: d.text, source, url: "", visibility: "empresa" },
      { sourceMeetingId: meeting.id },
    );
    decisionIds.push(id);
    await linkMemory(db, orgId, userId, summaryId, id);
  }
  return { summaryId, decisionIds };
}
