"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";
import { authClient } from "@/lib/auth-client";

/** Só aceita voltar para um endereço do próprio app. */
function safeReturn(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")).trim(),
      password: String(form.get("senha")),
    });
    if (error) {
      setError(error.status === 401 ? "E-mail ou senha não conferem." : "Não foi possível entrar agora. Tente de novo.");
      setBusy(false);
      return;
    }
    // Sem empresa ativa, o app leva para a escolha de empresa.
    router.replace(safeReturn(params.get("voltar")));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
      <Field label="E-mail" name="email" type="email" autoComplete="email" required />
      <Field label="Senha" name="senha" type="password" autoComplete="current-password" required />
      <FormError message={error} />
      <SubmitButton busy={busy}>{busy ? "Entrando…" : "Entrar"}</SubmitButton>
      <p className="text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/criar-conta" className="font-medium text-brand">
          Criar conta
        </Link>
      </p>
    </form>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
