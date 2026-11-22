import { and, asc, desc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { schema } from "@/lib/db";
import type { AgentInput } from "./validation";

/*
 * Acesso aos dados do Pollo OS. TODA função recebe a empresa (orgId) e filtra por ela: é aqui
 * que uma empresa fica separada da outra. As rotas só chamam estas funções.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<PgQueryResultHKT, typeof schema, any>;

export const POLLO_CEO_KEY = "pollo-ceo";

/* ---------- Agentes ---------- */

export function listAgents(db: Db, orgId: string) {
  return db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.organizationId, orgId))
    .orderBy(desc(schema.agents.createdAt));
}

export async function createAgent(db: Db, orgId: string, userId: string, input: AgentInput) {
  const [row] = await db
    .insert(schema.agents)
    .values({ ...input, organizationId: orgId, createdBy: userId })
    .returning();
  return row;
}

export async function updateAgent(db: Db, orgId: string, id: string, input: AgentInput) {
  const [row] = await db
    .update(schema.agents)
    .set(input)
    .where(and(eq(schema.agents.id, id), eq(schema.agents.organizationId, orgId)))
    .returning();
  return row ?? null;
}

export async function deleteAgent(db: Db, orgId: string, id: string) {
  const rows = await db
    .delete(schema.agents)
    .where(and(eq(schema.agents.id, id), eq(schema.agents.organizationId, orgId)))
    .returning({ id: schema.agents.id });
  return rows.length > 0;
}

export async function findAgent(db: Db, orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(schema.agents)
    .where(and(eq(schema.agents.id, id), eq(schema.agents.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

/* ---------- Acesso dos agentes aos apps ---------- */

export async function listAppAccess(db: Db, orgId: string): Promise<Record<string, string[]>> {
  const rows = await db
    .select({ appId: schema.agentAppAccess.appId, agentId: schema.agentAppAccess.agentId })
    .from(schema.agentAppAccess)
    .where(eq(schema.agentAppAccess.organizationId, orgId));
  const out: Record<string, string[]> = {};
  for (const r of rows) (out[r.appId] ??= []).push(r.agentId);
  return out;
}

/** Dá ou tira o acesso. Devolve false se o agente não for desta empresa. */
export async function setAppAccess(
  db: Db,
  orgId: string,
  userId: string,
  appId: string,
  agentId: string,
  allowed: boolean,
) {
  if (!(await findAgent(db, orgId, agentId))) return false;
  if (allowed) {
    await db
      .insert(schema.agentAppAccess)
      .values({ organizationId: orgId, agentId, appId, grantedBy: userId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(schema.agentAppAccess)
      .where(
        and(
          eq(schema.agentAppAccess.organizationId, orgId),
          eq(schema.agentAppAccess.agentId, agentId),
          eq(schema.agentAppAccess.appId, appId),
        ),
      );
  }
  return true;
}

/* ---------- Conversas ---------- */

/** O agente da conversa: o Pollo CEO ou um agente desta empresa. null se não existir aqui. */
export async function resolveAgentName(db: Db, orgId: string, agentKey: string) {
  if (agentKey === POLLO_CEO_KEY) return "Pollo CEO";
  if (!/^[0-9a-f-]{36}$/i.test(agentKey)) return null;
  return (await findAgent(db, orgId, agentKey))?.name ?? null;
}

async function conversationId(db: Db, orgId: string, userId: string, agentKey: string, create: boolean) {
  const where = and(
    eq(schema.conversations.organizationId, orgId),
    eq(schema.conversations.userId, userId),
    eq(schema.conversations.agentKey, agentKey),
  );
  const [found] = await db.select({ id: schema.conversations.id }).from(schema.conversations).where(where).limit(1);
  if (found || !create) return found?.id ?? null;
  const [made] = await db
    .insert(schema.conversations)
    .values({ organizationId: orgId, userId, agentKey })
    .onConflictDoNothing()
    .returning({ id: schema.conversations.id });
  if (made) return made.id;
  const [again] = await db.select({ id: schema.conversations.id }).from(schema.conversations).where(where).limit(1);
  return again.id;
}

export async function listMessages(db: Db, orgId: string, userId: string, agentKey: string) {
  const id = await conversationId(db, orgId, userId, agentKey, false);
  if (!id) return [];
  return db
    .select({
      id: schema.messages.id,
      role: schema.messages.role,
      text: schema.messages.text,
      demo: schema.messages.demo,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.messages)
    .where(and(eq(schema.messages.conversationId, id), eq(schema.messages.organizationId, orgId)))
    .orderBy(asc(schema.messages.createdAt));
}

/** A resposta enquanto a IA não está ligada: diz que é demonstração e que não é real. */
export function demoReply(agentName: string, text: string) {
  const asked = text.length > 80 ? `${text.slice(0, 80)}…` : text;
  return `Em demonstração: recebi “${asked}”, mas ainda não estou ligado à inteligência artificial nem aos dados da sua empresa. Esta não é uma resposta real. Quando a IA for ligada, ${agentName === "Pollo CEO" ? "eu respondo" : `${agentName} responde`} de verdade.`;
}

/** Guarda a mensagem da pessoa e a resposta de demonstração. */
export async function sendMessage(db: Db, orgId: string, userId: string, agentKey: string, agentName: string, text: string) {
  const id = await conversationId(db, orgId, userId, agentKey, true);
  if (!id) throw new Error("Conversa não encontrada.");
  const now = Date.now();
  const rows = await db
    .insert(schema.messages)
    .values([
      { organizationId: orgId, conversationId: id, role: "user", text, createdAt: new Date(now) },
      {
        organizationId: orgId,
        conversationId: id,
        role: "assistant",
        text: demoReply(agentName, text),
        demo: true,
        createdAt: new Date(now + 1),
      },
    ])
    .returning({
      id: schema.messages.id,
      role: schema.messages.role,
      text: schema.messages.text,
      demo: schema.messages.demo,
      createdAt: schema.messages.createdAt,
    });
  return rows;
}
