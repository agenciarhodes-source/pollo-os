import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_REDIRECTS, MORE_NAV, PRIMARY_NAV, isActive } from "./navigation";
import { UNAVAILABLE_MODULES } from "./modules";

const APP_DIR = path.resolve(__dirname, "../app/(app)");

/** As rotas que têm página própria em src/app/(app). */
function staticRoutes(dir = APP_DIR, base = ""): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name.startsWith("[")) continue;
      out.push(...staticRoutes(full, `${base}/${name}`));
    } else if (name === "page.tsx") {
      out.push(base || "/");
    }
  }
  return out;
}

describe("menu principal", () => {
  it("segue a ordem da diretriz v2", () => {
    expect(PRIMARY_NAV.map((i) => i.label)).toEqual([
      "Home",
      "Agenda",
      "Visão Geral",
      "Agentes & Operações",
      "Segundo Cérebro",
      "Apps",
    ]);
    expect(PRIMARY_NAV[0].href).toBe("/");
  });

  it("guarda as primitivas em Mais", () => {
    const labels = MORE_NAV.map((i) => i.label);
    for (const l of ["Rotinas", "Decisões & Aprovações", "Atividade", "Consumo & Custos", "Habilidades", "Configurações"]) {
      expect(labels).toContain(l);
    }
  });

  it("não repete endereços", () => {
    const hrefs = [...PRIMARY_NAV, ...MORE_NAV].map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("não tem nenhum item de CRM, funil, leads ou ERP", () => {
    const text = [...PRIMARY_NAV, ...MORE_NAV].map((i) => `${i.label} ${i.href}`).join(" ").toLowerCase();
    expect(text).not.toMatch(/crm|funil|lead|erp|kanban/);
  });

  it("cada item do menu abre uma página", () => {
    const routes = new Set([...staticRoutes(), ...Object.keys(UNAVAILABLE_MODULES).map((k) => `/${k}`)]);
    for (const item of [...PRIMARY_NAV, ...MORE_NAV]) {
      expect(routes, `sem página para ${item.href}`).toContain(item.href);
    }
  });

  it("os endereços antigos levam a páginas que existem", () => {
    const routes = new Set(staticRoutes());
    for (const r of LEGACY_REDIRECTS) {
      expect(routes).toContain(r.destination);
      expect(routes).not.toContain(r.source);
    }
  });
});

describe("item ativo", () => {
  it("a Home só no próprio endereço", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/", "/agenda")).toBe(false);
  });

  it("Agentes não fica ativo nas Criaturas, que estão em Mais", () => {
    expect(isActive("/agentes", "/agentes")).toBe(true);
    expect(isActive("/agentes", "/agentes/criaturas")).toBe(false);
    expect(isActive("/agentes/criaturas", "/agentes/criaturas")).toBe(true);
  });
});
