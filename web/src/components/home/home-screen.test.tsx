import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatProvider } from "@/components/chat/chat-provider";
import { fakeAuthClient, installFakeApi, renderWithData } from "@/test/fake-api";
import { HomeScreen } from "./home-screen";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", async () => ({ authClient: (await import("@/test/fake-api")).fakeAuthClient }));

beforeEach(() => {
  installFakeApi();
});

function renderHome() {
  return renderWithData(
    <ChatProvider>
      <HomeScreen />
    </ChatProvider>,
  );
}

describe("Home", () => {
  it("tem o Pollo CEO no centro e a pergunta de abertura", () => {
    renderHome();
    expect(screen.getByRole("heading", { level: 1, name: "O que vamos resolver hoje?" })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Pollo CEO" }).length).toBeGreaterThan(0);
  });

  it("mostra a empresa ativa", () => {
    renderHome();
    expect(screen.getByText(fakeAuthClient.useActiveOrganization().data.name)).toBeInTheDocument();
  });

  it("deixa claro que é uma demonstração", () => {
    renderHome();
    expect(screen.getAllByText(/Em demonstração/).length).toBeGreaterThan(0);
    expect(screen.getByRole("note")).toHaveTextContent("não são reais");
  });

  it("só habilita a ação que funciona, e diz o motivo das outras", () => {
    renderHome();
    const actions = screen.getByRole("list", { name: "Ações rápidas" });
    for (const name of ["Conversar por voz", "Analisar empresa"]) {
      const button = within(actions).getByRole("button", { name: new RegExp(name) });
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription(/.+/);
    }
    expect(within(actions).getByRole("link", { name: /Acompanhar agentes/ })).toHaveAttribute("href", "/agentes");
    expect(within(actions).getByRole("link", { name: /Preparar reunião/ })).toHaveAttribute("href", "/agenda/nova");
  });

  it("não habilita microfone nem anexos sem servidor", () => {
    renderHome();
    expect(screen.getByRole("button", { name: /Falar/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Anexar arquivo/ })).toBeDisabled();
  });

  it("não mostra destaques inventados", () => {
    renderHome();
    const highlights = screen.getByRole("region", { name: "Destaques do dia" });
    expect(highlights).toHaveTextContent("nenhuma fonte de dados da empresa está conectada");
    expect(highlights).not.toHaveTextContent(/\d+%|R\$/);
  });

  it("a mensagem enviada aparece na conversa, com a resposta marcada como demonstração", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.type(screen.getByRole("textbox", { name: "Mensagem para o Pollo CEO" }), "Como foram as vendas?{Enter}");
    expect(await screen.findByText("Como foram as vendas?")).toBeInTheDocument();
    expect(await screen.findByText(/Esta não é uma resposta real/, undefined, { timeout: 3000 })).toBeInTheDocument();
  });
});
