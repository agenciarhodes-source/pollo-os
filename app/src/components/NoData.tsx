'use client';

import Link from 'next/link';
import { Icon } from './Icon';
import { Empty } from './ui';
import { useCompany } from '@/demo/session';

// Empresa sem fontes conectadas: nenhum dado de outra empresa é mostrado.
export function NoData({ children }: { children: React.ReactNode }) {
  const c = useCompany();
  if (!c) return null;
  if (c.empty) {
    return (
      <Empty icon="building" title="Sem dados para esta empresa"
        text={`${c.n} ainda não tem fontes conectadas. Nada da Horizonte Imóveis aparece aqui.`}
        action={<Link className="btn line" href="/integracoes"><Icon name="plug" size="sm" />Ver integrações</Link>} />
    );
  }
  return <>{children}</>;
}
