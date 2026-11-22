import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChooseCompany } from "@/components/auth/choose-company";
import { getAuth } from "@/lib/auth";
import { listMyOrganizations } from "@/lib/server/session";

// Depende de quem está logado: gerada na hora do acesso.
export const dynamic = "force-dynamic";

/** Escolher a empresa em que trabalhar, ou criar uma. */
export default async function CompanyPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const organizations = await listMyOrganizations(session.user.id);
  return (
    <ChooseCompany
      userName={session.user.name}
      organizations={organizations.map(({ id, name }) => ({ id, name }))}
      activeId={session.session.activeOrganizationId ?? null}
    />
  );
}
