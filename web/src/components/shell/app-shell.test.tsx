import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeApi, renderWithData } from "@/test/fake-api";
import { AppShellWithChat } from "./app-shell";

const nav = vi.hoisted(() => ({ path: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path, useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", async () => ({ authClient: (await import("@/test/fake-api")).fakeAuthClient }));

function renderShell() {
  return renderWithData(
    <AppShellWithChat>
      <p>conteúdo</p>
    </AppShellWithChat>,
  );
}

describe("moldura do app", () => {
  beforeEach(() => {
    nav.path = "/";
    installFakeApi();
  });

  it("mostra a conta com as iniciais e o menu dela", async () => {
    const user = userEvent.setup();
    renderShell();
    const account = screen.getByRole("button", { name: "Sua conta: Ana Souza" });
    expect(account).toHaveTextContent("AS");
    await user.click(account);
    const menu = screen.getByRole("region", { name: "Sua conta" });
    expect(within(menu).getByText("Empresa: Padaria Pollo")).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: /Trocar de empresa/ })).toHaveAttribute("href", "/empresa");
    expect(within(menu).getByRole("button", { name: /Sair/ })).toBeInTheDocument();
  });

  it("tem o menu principal com os seis destinos, todos com nome", () => {
    renderShell();
    const [rail] = screen.getAllByRole("navigation", { name: "Menu principal" });
    for (const name of ["Home", "Agenda", "Visão Geral", "Agentes & Operações", "Segundo Cérebro", "Apps"]) {
      expect(within(rail).getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("marca o item da página atual", () => {
    nav.path = "/agenda";
    renderShell();
    const [rail] = screen.getAllByRole("navigation", { name: "Menu principal" });
    expect(within(rail).getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page");
    expect(within(rail).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("abre e fecha o Mais", async () => {
    const user = userEvent.setup();
    renderShell();
    const [rail] = screen.getAllByRole("navigation", { name: "Menu principal" });
    const more = within(rail).getByRole("button", { name: "Mais" });
    expect(more).toHaveAttribute("aria-expanded", "false");

    await user.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("region", { name: "Mais opções" });
    expect(within(menu).getByRole("link", { name: /Decisões & Aprovações/ })).toHaveAttribute("href", "/aprovacoes");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Mais opções" })).not.toBeInTheDocument();
  });

  it("esconde o botão Pollo na Home, onde a conversa já é o centro", () => {
    renderShell();
    expect(screen.queryByRole("button", { name: /Conversar com/ })).not.toBeInTheDocument();
  });

  it("mostra o botão Pollo nas outras telas", () => {
    nav.path = "/apps";
    renderShell();
    expect(screen.getByRole("button", { name: "Conversar com Pollo CEO" })).toBeInTheDocument();
  });
});
