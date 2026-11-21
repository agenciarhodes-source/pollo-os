'use client';

import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/ui';
import { PROFILES } from '@/demo/data';
import { useCompany, useSession } from '@/demo/session';

export default function SettingsPage() {
  const s = useSession();
  const c = useCompany();
  if (!c || !s.profile) return null;
  const t = s.tenant();
  return (
    <div className="stack">
      <PageHead title="Configurações" sub="Sua conta e a empresa atual." />
      <section className="card stack">
        <div className="row"><span className="avatar" style={{ background: 'var(--brand)' }}>{PROFILES[s.profile].in}</span><div><b>{PROFILES[s.profile].n}</b><div className="faint" style={{ fontSize: 12.5 }}>{PROFILES[s.profile].mail}</div></div></div>
        <div className="row wrap"><span className="chip line"><Icon name="building" size="xs" />{c.n}</span><span className="chip line"><Icon name="users" size="xs" />{t?.role}</span>{t?.admin && <span className="chip brand">Administrador</span>}</div>
      </section>
      <section className="card stack">
        <h3 style={{ fontSize: 15 }}>Limites do Pollo CEO</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Autonomia: <b>somente consultivo</b>. Não executa ações; toda proposta precisa de aprovação humana.</li>
          <li>Teto para aprovação individual: <b>R$ 5.000</b>. Acima disso, dois aprovadores.</li>
          <li>Pagamentos, contratos e campanhas nunca são alterados automaticamente.</li>
        </ul>
      </section>
    </div>
  );
}
