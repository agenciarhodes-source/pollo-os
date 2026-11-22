// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createAuth } from "@/lib/auth";
import { createTestDb, type TestDb } from "@/lib/db/test-db";

/* A porta de entrada da API, com o login e o banco de verdade, mas em memória. */

const holder = vi.hoisted(() => ({ db: null as unknown, auth: null as unknown }));

vi.mock("@/lib/db", async () => {
  const schema = await import("@/lib/db/schema");
  return { schema, getDb: () => holder.db };
});
vi.mock("@/lib/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/auth")>();
  return { ...real, getAuth: () => holder.auth };
});

const { requireTenant, withTenant } = await import("./tenant");

let auth: ReturnType<typeof createAuth>;

async function signUp(who: string) {
  const res = await auth.api.signUpEmail({
    body: { name: who, email: `${who}@exemplo.com`, password: "senha-segura-1" },
    returnHeaders: true,
  });
  return new Headers({ cookie: (res.headers.get("set-cookie") ?? "").split(";")[0] });
}

beforeAll(async () => {
  const db: TestDb = await createTestDb();
  auth = createAuth(db);
  holder.db = db;
  holder.auth = auth;
});

describe("requireTenant", () => {
  it("sem login: 401", async () => {
    await expect(requireTenant(new Headers())).rejects.toMatchObject({ status: 401 });
  });

  it("logado, mas sem empresa ativa: 409", async () => {
    const headers = await signUp("sem-empresa");
    await expect(requireTenant(headers)).rejects.toMatchObject({ status: 409 });
  });

  it("com empresa ativa: devolve a pessoa, a empresa e o papel", async () => {
    const headers = await signUp("dona");
    const org = await auth.api.createOrganization({ body: { name: "Loja", slug: "loja" }, headers });
    const tenant = await requireTenant(headers);
    expect(tenant.orgId).toBe(org!.id);
    expect(tenant.role).toBe("owner");
  });

  it("uma empresa ativa da qual a pessoa saiu: 403", async () => {
    const headers = await signUp("ex-membro");
    const org = await auth.api.createOrganization({ body: { name: "Antiga", slug: "antiga" }, headers });
    // Tira a pessoa da empresa direto no banco; a sessão ainda aponta para ela.
    const { member } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    await (holder.db as TestDb).delete(member).where(eq(member.organizationId, org!.id));
    await expect(requireTenant(headers)).rejects.toMatchObject({ status: 403 });
  });
});

describe("withTenant", () => {
  it("responde o erro em JSON, sem detalhes internos", async () => {
    const handler = withTenant(async () => new Response("não devia chegar aqui"));
    const res = await handler(new Request("http://localhost/api/agents"), {});
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Entre na sua conta para continuar." });
  });
});
