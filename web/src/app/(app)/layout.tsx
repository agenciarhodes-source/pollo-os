import { AppShellWithChat } from "@/components/shell/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellWithChat>{children}</AppShellWithChat>;
}
