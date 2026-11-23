import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

/** Quem está pedindo e em nome de qual empresa. */
export type Tenant = { userId: string; userName: string; orgId: string; role: string };

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Lê a sessão e confirma no banco que a pessoa é membro da empresa ativa. É a única porta de
 * entrada das rotas do Pollo OS: nenhuma consulta usa um organization_id que venha do navegador.
 */
export async function requireTenant(headers: Headers): Promise<Tenant> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) throw new HttpError(401, "Entre na sua conta para continuar.");

  const orgId = session.session.activeOrganizationId;
  if (!orgId) throw new HttpError(409, "Escolha ou crie uma empresa para continuar.");

  const [membership] = await getDb()
    .select({ role: schema.member.role })
    .from(schema.member)
    .where(and(eq(schema.member.organizationId, orgId), eq(schema.member.userId, session.user.id)))
    .limit(1);
  if (!membership) throw new HttpError(403, "Você não faz parte desta empresa.");

  return { userId: session.user.id, userName: session.user.name, orgId, role: membership.role };
}

/** Responde um erro conhecido como JSON com a mensagem; um desconhecido vira 500 sem detalhes. */
export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: "Algo deu errado do nosso lado. Tente de novo." }, { status: 500 });
}

/** Envolve uma rota: resolve a empresa e devolve os erros no mesmo formato. */
export function withTenant<C>(handler: (request: Request, tenant: Tenant, context: C) => Promise<Response>) {
  return async (request: Request, context: C) => {
    try {
      const tenant = await requireTenant(request.headers);
      return await handler(request, tenant, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/** Lê e valida o corpo JSON de um pedido. */
export async function readJson<T>(request: Request, parse: (value: unknown) => T): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "O pedido não veio em JSON.");
  }
  try {
    return parse(body);
  } catch {
    throw new HttpError(422, "Algum campo veio vazio ou num formato que não esperávamos.");
  }
}
