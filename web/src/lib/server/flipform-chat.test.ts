// @vitest-environment node
import { describe, expect, it } from "vitest";
import { catalogIntent, catalogForChat } from "./flipform-chat";

describe("Pollo CEO: consultas FlipForm", () => {
  it("reconhece pedidos de catálogo sem acesso irrestrito", () => {
    expect(catalogIntent("Quais pipelines temos no FlipForm?")).toBe("pipelines");
    expect(catalogIntent("Quais formulários estão cadastrados?")).toBe("forms");
    expect(catalogIntent("Liste os funis existentes")).toBe("pipelines");
    expect(catalogIntent("Quanto faturamos hoje?")).toBe(null);
    expect(catalogIntent("Mostre os leads do CRM")).toBe(null);
  });

  it("não consulta banco ou API quando a pessoa não é proprietária", async () => {
    const denied = await catalogForChat("empresa-A", "member", "pipelines");
    expect(denied.status).toBe("denied");
    expect(denied.context).toContain("proprietário");
    const unknown = await catalogForChat("empresa-B", undefined, "forms");
    expect(unknown.status).toBe("denied");
  });
});
