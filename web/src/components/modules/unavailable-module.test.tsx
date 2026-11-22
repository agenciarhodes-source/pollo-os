import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UNAVAILABLE_MODULES } from "@/lib/modules";
import { UnavailableModule } from "./unavailable-module";

describe("módulos indisponíveis", () => {
  it.each(Object.entries(UNAVAILABLE_MODULES))("%s: diz que está indisponível, o que falta e oferece um caminho", (_, info) => {
    render(<UnavailableModule info={info} />);
    expect(screen.getByRole("heading", { level: 1, name: info.title })).toBeInTheDocument();
    expect(screen.getByText("Indisponível nesta versão")).toBeInTheDocument();
    expect(screen.getByText("O que falta:")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: info.link.label })).toHaveAttribute("href", info.link.href);
  });

  it("nenhum módulo traz números, valores ou datas inventados", () => {
    const text = JSON.stringify(UNAVAILABLE_MODULES);
    expect(text).not.toMatch(/R\$\s?\d|\d+%|\d{2}\/\d{2}/);
  });

  it("a Agenda é a da relação com a IA, não a de vendas", () => {
    expect(UNAVAILABLE_MODULES.agenda.note).toMatch(/FlipForm/);
  });
});
