"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** A conta da pessoa: quem está logado, em qual empresa, trocar de empresa e sair. */
export function AccountMenu() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: org } = authClient.useActiveOrganization();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  async function signOut() {
    await authClient.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Sua conta${session?.user.name ? `: ${session.user.name}` : ""}`}
        className="flex size-8 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {initials(session?.user.name)}
      </button>
      {open && (
        <div
          role="region"
          aria-label="Sua conta"
          className="absolute bottom-0 left-full z-50 ml-2 w-64 rounded-2xl bg-card p-2 shadow-xl ring-1 ring-line"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{session?.user.name}</p>
            <p className="truncate text-xs text-muted">{session?.user.email}</p>
            {org && <p className="mt-1 truncate text-xs text-muted">Empresa: {org.name}</p>}
          </div>
          <div className="my-1 border-t border-line" />
          <Link
            href="/empresa"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-panel"
          >
            <ArrowLeftRight className="size-[18px] text-muted" strokeWidth={1.75} />
            Trocar de empresa
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-panel"
          >
            <LogOut className="size-[18px] text-muted" strokeWidth={1.75} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

/** Trocar de empresa e sair, para a folha "Mais" do celular. */
export function AccountLinks({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-0.5">
      <Link href="/empresa" onClick={onDone} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-panel">
        <ArrowLeftRight className="size-[18px] text-muted" strokeWidth={1.75} />
        Trocar de empresa
      </Link>
      <button
        type="button"
        onClick={async () => {
          onDone();
          await authClient.signOut();
          router.replace("/entrar");
          router.refresh();
        }}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-panel"
      >
        <LogOut className="size-[18px] text-muted" strokeWidth={1.75} />
        Sair
      </button>
    </div>
  );
}
