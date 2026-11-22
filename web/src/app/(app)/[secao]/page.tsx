import { notFound } from "next/navigation";
import { UnavailableModule } from "@/components/modules/unavailable-module";
import { UNAVAILABLE_MODULES } from "@/lib/modules";

export function generateStaticParams() {
  return Object.keys(UNAVAILABLE_MODULES).map((secao) => ({ secao }));
}

export const dynamicParams = false;

export default async function ModulePage({ params }: { params: Promise<{ secao: string }> }) {
  const { secao } = await params;
  const info = UNAVAILABLE_MODULES[secao];
  if (!info) notFound();
  return <UnavailableModule info={info} />;
}
