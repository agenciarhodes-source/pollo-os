"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, FormError, SubmitButton, slugFor } from "@/components/auth/fields";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const company = String(form.get("empresa")).trim();
    setBusy(true);
    setError(null);

    const signUp = await authClient.signUp.email({
      name: String(form.get("nome")).trim(),
      email: String(form.get("email")).trim(),
      password: String(form.get("senha")),
    });
    if (signUp.error) {
      const code = signUp.error.code ?? "";
      setError(
        code.includes("ALREADY_EXISTS")
          ? "Já existe uma conta com este e-mail. Entre com ela."
          : code.includes("PASSWORD_TOO_SHORT")
            ? "A senha precisa ter pelo menos 8 caracteres."
            : "Não foi possível criar a conta agora. Tente de novo.",
      );
      setBusy(false);
      return;
    }

    // A empresa nasce junto com a conta, e a pessoa é a dona dela.
    const org = await authClient.organization.create({ name: company, slug: slugFor(company) });
    if (org.error) {
      router.replace("/empresa");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Criar conta</h1>
      <Field label="Seu nome" name="nome" autoComplete="name" required maxLength={80} />
      <Field label="Nome da empresa" name="empresa" autoComplete="organization" required maxLength={80} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" required />
      <Field label="Senha" name="senha" type="password" autoComplete="new-password" required minLength={8} />
      <p className="-mt-2 text-xs text-muted">Pelo menos 8 caracteres.</p>
      <FormError message={error} />
      <SubmitButton busy={busy}>{busy ? "Criando…" : "Criar conta"}</SubmitButton>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-brand">
          Entrar
        </Link>
      </p>
    </form>
  );
}
