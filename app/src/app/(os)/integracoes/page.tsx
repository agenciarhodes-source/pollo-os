'use client';

import { Icon } from '@/components/Icon';
import { Ill, PageHead } from '@/components/ui';
import { INTEGRATIONS } from '@/demo/data';
import { useCompany } from '@/demo/session';

const STC: Record<string, string> = { conectado: 'ok', erro: 'err', 'requer configuração': 'warn', disponível: '', indisponível: 'dash' };

export default function IntegrationsPage() {
  const c = useCompany();
  if (!c) return null;
  const list = c.empty ? INTEGRATIONS.map((i) => ({ ...i, st: (i.st === 'indisponível' ? i.st : 'disponível') as typeof i.st, sync: '—' })) : INTEGRATIONS;
  return (
    <div className="stack">
      <PageHead title="Integrações" sub={`Fontes de dados de ${c.n}. Cada empresa tem as suas conexões.`} right={<Ill />} />
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        {list.map((i) => (
          <section key={i.n} className="card" style={{ display: 'grid', gap: 8 }}>
            <div className="row between"><b>{i.n}</b><span className={`chip ${STC[i.st]}`}>{i.st}</span></div>
            <p className="muted" style={{ fontSize: 13 }}>{i.d}</p>
            <div className="faint" style={{ fontSize: 12 }}>Última sincronização: {i.sync}</div>
            <button className="btn line sm" disabled title="Conexões reais entram numa próxima etapa">
              <Icon name="plug" size="sm" />{i.st === 'conectado' ? 'Gerenciar' : i.st === 'erro' ? 'Reconectar' : 'Conectar'}
            </button>
          </section>
        ))}
      </div>
      <div className="caveat"><Icon name="shield" size="sm" /><span>Nesta demonstração nenhuma conexão é feita. No produto, cada conexão usa o login oficial do serviço (OAuth), com o mínimo de permissões.</span></div>
    </div>
  );
}
