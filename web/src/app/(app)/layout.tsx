import { AppShellWithChat } from "@/components/shell/app-shell";
import { requireAppSession } from "@/lib/server/session";

// Toda tela do app depende de quem está logado e da empresa ativa: nada é gerado antes.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAppSession();
  return <AppShellWithChat>{children}</AppShellWithChat>;
}
