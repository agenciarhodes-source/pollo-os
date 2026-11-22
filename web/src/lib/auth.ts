import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { getDb, schema } from "./db";

/** O endereço público do app: o configurado, o da Vercel ou o local. */
function baseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Os endereços de onde o navegador pode chamar o login: o atual e os da Vercel para esta publicação. */
function trustedOrigins() {
  const out = [baseURL()];
  for (const v of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (v) out.push(`https://${v}`);
  }
  return out;
}

/**
 * O login do Pollo OS: e-mail e senha, e empresas (organizations). Cada pessoa trabalha numa
 * empresa ativa de cada vez; toda consulta do Pollo OS filtra por ela.
 */
export function createAuth(db: Parameters<typeof drizzleAdapter>[0]) {
  return betterAuth({
    appName: "Pollo OS",
    baseURL: baseURL(),
    trustedOrigins: trustedOrigins(),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        organization: schema.organization,
        member: schema.member,
        invitation: schema.invitation,
      },
    }),
    emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    plugins: [
      // Quem cria a empresa é o dono; só donos e admins convidam. Uma pessoa cria até 5 empresas.
      organization({ allowUserToCreateOrganization: true, organizationLimit: 5, creatorRole: "owner" }),
      nextCookies(),
    ],
  });
}

let cached: ReturnType<typeof createAuth> | null = null;

/** O login usado pelo app, ligado ao banco do Neon. */
export function getAuth() {
  cached ??= createAuth(getDb());
  return cached;
}
