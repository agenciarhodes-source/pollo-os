import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShellWithChat } from "./app-shell";

const nav = vi.hoisted(() => ({ path: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path }));

function renderShell() {
  return render(
    <AppShellWithChat>
      <p>conteúdo</p>
    </AppShellWithChat>,
  );
}

describe("moldura do app", () => {
  beforeEach(() => {
    nav.path = "/";
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
