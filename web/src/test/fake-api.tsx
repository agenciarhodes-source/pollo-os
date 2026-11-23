import { render } from "@testing-library/react";
import { SWRConfig } from "swr";
import { vi } from "vitest";

type Msg = { id: string; role: "user" | "assistant"; text: string; demo: boolean };

/**
 * Uma API falsa, em memória, com as mesmas respostas da real, para testar as telas sem servidor.
 * O servidor de verdade é testado à parte (isolation.test.ts, tenant.test.ts).
 */
export function installFakeApi() {
  const state = { agents: [] as unknown[], access: {} as Record<string, string[]>, messages: {} as Record<string, Msg[]> };

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), "http://localhost");
      const method = init?.method ?? "GET";
      if (url.pathname === "/api/agents" && method === "GET") return json({ agents: state.agents });
      if (url.pathname === "/api/app-access" && method === "GET") return json({ access: state.access });
      if (url.pathname === "/api/ai/status") return json({ enabled: false, spentUsd: 0, limitUsd: 5, blocked: false });
      const s = url.pathname.match(/^\/api\/conversations\/([^/]+)\/stream$/);
      if (s && method === "POST") {
        // Sem IA no teste: a resposta de demonstração, em texto, como o servidor faz.
        const key = decodeURIComponent(s[1]);
        const list = (state.messages[key] ??= []);
        const { text } = JSON.parse(String(init?.body));
        const reply = `Em demonstração: recebi “${text}”. Esta não é uma resposta real.`;
        list.push({ id: `u${list.length}`, role: "user", text, demo: false }, { id: `a${list.length}`, role: "assistant", text: reply, demo: true });
        return new Response(reply, { status: 200, headers: { "content-type": "text/plain; charset=utf-8", "x-pollo-demo": "1" } });
      }
      const m = url.pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
      if (m) {
        const key = decodeURIComponent(m[1]);
        const list = (state.messages[key] ??= []);
        if (method === "GET") return json({ messages: list });
        const { text } = JSON.parse(String(init?.body));
        const made: Msg[] = [
          { id: `u${list.length}`, role: "user", text, demo: false },
          { id: `a${list.length}`, role: "assistant", text: `Em demonstração: recebi “${text}”. Esta não é uma resposta real.`, demo: true },
        ];
        list.push(...made);
        return json({ messages: made }, 201);
      }
      return json({ error: "Rota não simulada no teste." }, 404);
    }),
  );
  return state;
}

/** O login visto do navegador, simulado: uma pessoa numa empresa. */
export const fakeAuthClient = {
  useSession: () => ({ data: { user: { name: "Ana Souza", email: "ana@exemplo.com" } } }),
  useActiveOrganization: () => ({ data: { id: "org-a", name: "Padaria Pollo" } }),
  signOut: vi.fn(async () => ({})),
};

/** Renderiza com um cache de dados novo, para um teste não ver o do outro. */
export function renderWithData(ui: React.ReactElement) {
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{ui}</SWRConfig>);
}
