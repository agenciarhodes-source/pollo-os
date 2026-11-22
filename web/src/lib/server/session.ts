import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

/** As empresas de que a pessoa faz parte, da mais antiga para a mais nova. */
export async function listMyOrganizations(userId: string) {
  return getDb()
    .select({ id: schema.organization.id, name: schema.organization.name, slug: schema.organization.slug, role: schema.member.role })
    .from(schema.member)
    .innerJoin(schema.organization, eq(schema.member.organizationId, schema.organization.id))
    .where(eq(schema.member.userId, userId))
    .orderBy(asc(schema.member.createdAt));
}

/**
 * Para as telas do app: exige sessão e uma empresa ativa da qual a pessoa é membro.
 * Sem sessão, vai para "Entrar"; sem empresa ativa válida, para a escolha de empresa.
 */
export async function requireAppSession() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const orgId = session.session.activeOrganizationId;
  if (!orgId) redirect("/empresa");

  const [membership] = await getDb()
    .select({ role: schema.member.role })
    .from(schema.member)
    .where(and(eq(schema.member.organizationId, orgId), eq(schema.member.userId, session.user.id)))
    .limit(1);
  if (!membership) redirect("/empresa");

  return { user: session.user, orgId, role: membership.role };
}
