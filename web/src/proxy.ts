import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Porta de entrada: sem o cookie de sessão, a pessoa vai para "Entrar". É só uma checagem rápida;
 * quem confirma a sessão de verdade é o servidor, em cada página e em cada rota da API.
 */
const PUBLIC = ["/entrar", "/criar-conta"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();

  const url = new URL("/entrar", request.url);
  if (pathname !== "/") url.searchParams.set("voltar", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Tudo, menos a API (que responde 401 por conta própria) e os arquivos do Next.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|ico)$).*)"],
};
