import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { Pollo } from "@/components/pollo/pollo";

export type ModuleInfo = {
  title: string;
  /** Uma frase: para que o módulo serve. */
  summary: string;
  /** O que ele vai permitir, quando funcionar. */
  will: string[];
  /** O que falta para funcionar. */
  needs: string;
  /** Um limite do módulo que vale deixar claro (por exemplo, o que fica no FlipForm). */
  note?: string;
  link: { href: string; label: string };
};

/**
 * O estado de um módulo que ainda não funciona nesta versão: diz para que serve, o que falta
 * e oferece um caminho útil. Nunca mostra números, reuniões ou atividades inventados.
 */
export function UnavailableModule({ info }: { info: ModuleInfo }) {
  return (
    <main className="flex flex-1 overflow-y-auto bg-background md:rounded-2xl md:ring-1 md:ring-line">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-7 px-5 py-12 sm:py-16">
        <div className="flex flex-col items-start gap-4">
          <Pollo shape="nuvem" color="grafite" face="dormindo" mood="dormindo" size={72} title="Módulo indisponível" />
          <div>
            <span className="inline-flex rounded-full bg-panel px-2.5 py-0.5 text-xs font-medium text-muted ring-1 ring-line">
              Indisponível nesta versão
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{info.title}</h1>
            <p className="mt-2 leading-relaxed text-foreground/80">{info.summary}</p>
          </div>
        </div>

        <section aria-labelledby="quando-funcionar">
          <h2 id="quando-funcionar" className="mb-3 text-sm font-semibold">
            Quando estiver pronto, aqui você vai
          </h2>
          <ul className="flex flex-col gap-2">
            {info.will.map((w) => (
              <li key={w} className="flex items-start gap-3 rounded-xl bg-panel/60 px-3.5 py-2.5 text-sm">
                <span className="mt-1.5 size-1.5 flex-none rounded-full bg-brand" aria-hidden />
                {w}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-2 text-sm">
          <p className="flex items-start gap-2 text-muted">
            <Info className="mt-0.5 size-4 flex-none" />
            <span>
              <strong className="font-medium text-foreground">O que falta:</strong> {info.needs}
            </span>
          </p>
          {info.note && <p className="pl-6 text-muted">{info.note}</p>}
        </div>

        <Link
          href={info.link.href}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
        >
          {info.link.label}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}
