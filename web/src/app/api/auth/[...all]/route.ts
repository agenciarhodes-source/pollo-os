import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// Todas as rotas de login (entrar, criar conta, sair, empresas) passam por aqui.
export async function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
