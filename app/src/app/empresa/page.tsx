'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { APPS, COMPANIES, ENT, PROFILES, type AppKey } from '@/demo/data';
import { useSession } from '@/demo/session';

export default function EmpresaPage() {
  const s = useSession();
  const router = useRouter();
  useEffect(() => { if (s.ready && !s.profile) router.replace('/login'); }, [s.ready, s.profile, router]);
  if (!s.ready || !s.profile) return null;
  const p = PROFILES[s.profile];

  return (
    <div className="app">
      <div className="ws-page">
        <div className="row between wrap">
          <div className="brand" style={{ padding: 0 }}><span className="logo"><i /></span><span className="n">Pollo <em>OS</em></span></div>
          <button className="btn ghost sm" onClick={() => { s.logout(); router.replace('/login'); }}><Icon name="logout" size="sm" />Sair</button>
        </div>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800 }}>Olá, {p.n.split(' ')[0]}. Qual empresa você quer acessar?</h2>
          <p className="muted" style={{ marginTop: 6 }}>Cada empresa tem seus próprios aplicativos, dados e permissões. Os dados de uma nunca aparecem na outra.</p>
        </div>
        <div className="ws-cards">
          {p.tenants.map((t) => {
            const c = COMPANIES[t.co];
            return (
              <section key={t.co} className="card ws-card">
                <div className="row">
                  <span className="co" style={{ background: c.c }}>{c.in}</span>
                  <div><b style={{ fontSize: 16, fontFamily: 'var(--font-d)' }}>{c.n}</b><div className="faint" style={{ fontSize: 12.5 }}>{c.s}</div></div>
                </div>
                <div className="row wrap"><span className="chip line"><Icon name="users" size="xs" />{t.role}</span></div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {(['os', 'ff', 'fi'] as AppKey[]).map((k) => (
                    <div key={k} className="kv2">
                      <span className="row">
                        <span className="tile-app" style={{ width: 22, height: 22, borderRadius: 6, background: t.apps[k] === 'ok' ? APPS[k].c : 'var(--sand-2)' }}><Icon name={APPS[k].i} size="xs" /></span>
                        {APPS[k].n}
                      </span>
                      <span className={`chip ${ENT[t.apps[k]][1]}`}><Icon name={t.apps[k] === 'ok' ? 'check' : 'lock'} size="xs" />{ENT[t.apps[k]][0]}</span>
                    </div>
                  ))}
                </div>
                <button className="btn primary" onClick={() => { s.enter(t.co); router.push('/ceo'); }}>Acessar empresa <Icon name="arrow" size="sm" /></button>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
