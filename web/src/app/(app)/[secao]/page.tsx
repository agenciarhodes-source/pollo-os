import { notFound } from "next/navigation";
import { Pollo } from "@/components/pollo/pollo";

const SECTIONS: Record<string, { title: string; text: string }> = {
  rotinas: { title: "Rotinas", text: "Tarefas que os seus agentes fazem sozinhos, no horário que você escolher." },
  tarefas: { title: "Tarefas", text: "O que os agentes estão fazendo agora e o que espera a sua aprovação." },
  apps: { title: "Apps Pollo", text: "Flipform, Flip Intelligence e os outros apps da Pollo, todos num lugar só." },
  ajuda: { title: "Ajuda", text: "Guias rápidos para tirar o melhor dos seus agentes." },
  configuracoes: { title: "Configurações", text: "Sua conta, sua empresa e as preferências do Pollo OS." },
};

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((secao) => ({ secao }));
}

export const dynamicParams = false;

export default async function SectionPage({ params }: { params: Promise<{ secao: string }> }) {
  const { secao } = await params;
  const section = SECTIONS[secao];
  if (!section) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 text-center md:rounded-2xl md:ring-1 md:ring-line">
      <Pollo shape="nuvem" color="grafite" face="dormindo" mood="dormindo" size={96} />
      <h1 className="text-2xl font-semibold tracking-tight">{section.title}</h1>
      <p className="max-w-sm text-muted">{section.text}</p>
      <p className="text-sm text-muted">Em construção.</p>
    </main>
  );
}
