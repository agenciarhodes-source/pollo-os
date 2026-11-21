'use client';

import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/ui';
import { APPS, ENT, type AppKey } from '@/demo/data';
import { useCompany, useSession } from '@/demo/session';

export default function AppsPage() {
  const s = useSession();
  const c = useCompany();
  if (!c) return null;
  return (
    <div className="stack">
      <PageHead title="Seus aplicativos" sub={`Aplicativos contratados por ${c.n}. Uma conta para todos.`} />
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        {(['os', 'ff', 'fi'] as AppKey[]).map((k) => {
          const e = s.ent(k);
          return (
            <section key={k} className="card" style={{ display: 'grid', gap: 10 }}>
              <div className="row"><span className="tile-app" style={{ background: e === 'ok' ? APPS[k].c : 'var(--sand-2)' }}><Icon name={APPS[k].i} size="sm" /></span><b style={{ fontFamily: 'var(--font-d)', fontSize: 16 }}>{APPS[k].n}</b></div>
              <p className="muted">{APPS[k].p}</p>
              <div className="row wrap">
                <span className={`chip ${ENT[e][1]}`}><Icon name={e === 'ok' ? 'check' : 'lock'} size="xs" />{ENT[e][0]}</span>
                {k !== 'os' && <span className="chip dash">Conexão numa próxima etapa</span>}
              </div>
            </section>
          );
        })}
      </div>
      <div className="caveat"><Icon name="info" size="sm" /><span>O Pollo OS está sendo construído separado. FlipForm e Flip Intelligence serão conectados depois, por API e com login único.</span></div>
    </div>
  );
}
