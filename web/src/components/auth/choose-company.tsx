"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check } from "lucide-react";
import { Field, FormError, SubmitButton, slugFor } from "./fields";
import { authClient } from "@/lib/auth-client";

type Org = { id: string; name: string };

export function ChooseCompany({
  userName,
  organizations,
  activeId,
}: {
  userName: string;
  organizations: Org[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoPicked = useRef(false);

  async function choose(id: string) {
    setBusy(id);
    setError(null);
    const { error } = await authClient.organization.setActive({ organizationId: id });
    if (error) {
      setError("Não foi possível abrir esta empresa. Tente de novo.");
      setBusy(null);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  // Com uma empresa só e nenhuma ativa (logo depois de entrar), abre ela direto.
  useEffect(() => {
    if (autoPicked.current || organizations.length !== 1 || activeId) return;
    autoPicked.current = true;
    void choose(organizations[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("empresa")).trim();
    setBusy("nova");
    setError(null);
    const { error } = await authClient.organization.create({ name, slug: slugFor(name) });
    if (error) {
      setError(
        (error.code ?? "").includes("MAXIMUM")
          ? "Você chegou ao limite de 5 empresas."
          : "Não foi possível criar a empresa agora. Tente de novo.",
      );
      setBusy(null);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function signOut() {
    await authClient.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Olá, {userName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted">
          {organizations.length > 0 ? "Em qual empresa você vai trabalhar agora?" : "Crie a sua empresa para começar."}
        </p>
      </div>

      {organizations.length > 0 && (
        <ul className="flex flex-col gap-2">
          {organizations.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => choose(o.id)}
                disabled={busy !== null}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ring-1 ring-line transition hover:ring-brand disabled:opacity-60"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-panel text-muted">
                  <Building2 className="size-5" strokeWidth={1.75} />
                </span>
                <span className="flex-1 font-medium">{o.name}</span>
                {busy === o.id ? (
                  <span className="text-xs text-muted">Abrindo…</span>
                ) : (
                  o.id === activeId && <Check className="size-4 text-brand" aria-label="Empresa atual" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={create} className="flex flex-col gap-3 border-t border-line pt-5">
        <Field
          label={organizations.length > 0 ? "Ou crie outra empresa" : "Nome da empresa"}
          name="empresa"
          required
          maxLength={80}
        />
        <SubmitButton busy={busy === "nova"}>{busy === "nova" ? "Criando…" : "Criar empresa"}</SubmitButton>
      </form>

      <FormError message={error} />

      <button type="button" onClick={signOut} className="text-sm text-muted hover:text-foreground">
        Sair da conta
      </button>
    </div>
  );
}
