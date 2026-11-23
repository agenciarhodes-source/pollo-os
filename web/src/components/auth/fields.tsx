"use client";

/** Um campo de formulário com rótulo visível e o erro dele logo abaixo. */
export function Field({
  label,
  error,
  ...input
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        {...input}
        aria-invalid={Boolean(error)}
        className={`h-11 rounded-xl bg-field px-3.5 text-[15px] ring-1 outline-none placeholder:text-muted focus:ring-2 focus:ring-brand ${
          error ? "ring-red-500" : "ring-line"
        }`}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="h-11 w-full rounded-xl bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
      {message}
    </p>
  );
}

/** Um endereço curto e único para a empresa, a partir do nome. */
export function slugFor(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "empresa"}-${Math.random().toString(36).slice(2, 6)}`;
}
