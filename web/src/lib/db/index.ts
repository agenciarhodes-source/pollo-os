import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/*
 * A conexão com o banco. Só no servidor: o endereço tem a senha do banco e nunca vai para o
 * navegador. DATABASE_URL é o endereço "pooled" do Neon.
 */
function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta a variável DATABASE_URL: o endereço do banco no Neon.");
  return drizzle(neon(url), { schema });
}

type Db = ReturnType<typeof connect>;
let cached: Db | null = null;

export function getDb(): Db {
  cached ??= connect();
  return cached;
}

export { schema };
