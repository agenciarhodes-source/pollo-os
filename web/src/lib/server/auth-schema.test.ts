// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createAuth } from "@/lib/auth";
import { createTestDb } from "@/lib/db/test-db";

describe("login e empresas no esquema do banco", () => {
  it("cria conta, cria empresa e a deixa ativa", async () => {
    const db = await createTestDb();
    const auth = createAuth(db);

    const signUp = await auth.api.signUpEmail({
      body: { name: "Ana", email: "ana@exemplo.com", password: "senha-segura-1" },
      returnHeaders: true,
    });
    const cookie = signUp.headers.get("set-cookie") ?? "";
    const headers = new Headers({ cookie: cookie.split(";")[0] });

    const org = await auth.api.createOrganization({
      body: { name: "Padaria Pollo", slug: "padaria-pollo" },
      headers,
    });
    expect(org?.name).toBe("Padaria Pollo");

    const session = await auth.api.getSession({ headers });
    expect(session?.user.email).toBe("ana@exemplo.com");
    expect(session?.session.activeOrganizationId).toBe(org?.id);
  });
});
