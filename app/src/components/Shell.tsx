'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { APPS, COMPANIES, ENT, PROFILES, type AppKey } from '@/demo/data';
import { useCompany, useSession } from '@/demo/session';

export const NAV: { href: string; t: string; i: string }[] = [
  { href: '/ceo', t: 'Pollo CEO', i: 'msg' },
  { href: '/visao-executiva', t: 'Visão Executiva', i: 'compass' },
  { href: '/visao-analitica', t: 'Visão Analítica', i: 'chart' },
  { href: '/reunioes', t: 'Reuniões', i: 'video' },
  { href: '/agentes', t: 'Agentes & Operações', i: 'network' },
  { href: '/decisoes', t: 'Decisões & Aprovações', i: 'checksq' },
  { href: '/segundo-cerebro', t: 'Segundo Cérebro', i: 'book' },
  { href: '/integracoes', t: 'Integrações', i: 'plug' },
  { href: '/consumo', t: 'Consumo & Custos', i: 'coins' },
];
const GROUPS: [string, string[]][] = [
  ['Principal', ['/ceo', '/visao-executiva', '/visao-analitica']],
  ['Gestão', ['/reunioes', '/agentes', '/decisoes', '/segundo-cerebro']],
  ['Sistema', ['/integracoes', '/consumo']],
];
const TITLES: Record<string, string> = { ...Object.fromEntries(NAV.map((n) => [n.href, n.t])), '/apps': 'Seus aplicativos', '/configuracoes': 'Configurações' };

export function Shell({ children }: { children: React.ReactNode }) {
  const s = useSession();
  const c = useCompany();
  const path = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dd, setDd] = useState<null | 'co' | 'sw'>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Guarda de acesso do modo demonstração (no produto real isto é verificado no servidor).
  useEffect(() => {
    if (!s.ready) return;
    if (!s.profile) router.replace('/login');
    else if (!s.company) router.replace('/empresa');
  }, [s.ready, s.profile, s.company, router]);
  useEffect(() => { setNavOpen(false); setDd(null); }, [path]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  if (!s.ready || !s.profile || !c) return null;
  const prof = PROFILES[s.profile];
  const ten = s.tenant();
  const pending = s.decisions.filter((d) => d.s === 'Aguardando aprovação').length;

  const openApp = (k: AppKey) => {
    const e = s.ent(k);
    if (k === 'os') { router.push('/ceo'); return; }
    if (e !== 'ok') { setToast(`${APPS[k].n}: ${ENT[e][0].toLowerCase()} para o seu acesso em ${c.n}.`); return; }
    setToast(`${APPS[k].n} será conectado depois, com a mesma sessão. Nesta etapa o Pollo OS funciona sozinho.`);
  };

  if (s.ent('os') !== 'ok') {
    return (
      <div className="app">
        <div className="ws-page">
          <div className="empty">
            <span className="tile"><Icon name="lock" size="lg" /></span>
            <h3>Sem acesso ao Pollo OS</h3>
            <p>Seu papel em {c.n} ({ten?.role}) dá acesso só ao FlipForm. Nenhum dado executivo foi carregado.</p>
            <button className="btn line" onClick={() => s.logout()}><Icon name="logout" size="sm" />Sair e entrar com outro perfil</button>
          </div>
        </div>
      </div>
    );
  }

  const item = (href: string) => {
    const n = NAV.find((x) => x.href === href)!;
    const cur = path === href;
    return (
      <Link key={href} href={href} className={`nav-i ${cur ? 'cur' : ''}`} title={n.t} aria-current={cur ? 'page' : undefined}>
        <Icon name={n.i} />
        <span className="nt">{n.t}</span>
        {href === '/decisoes' && pending > 0 && !c.empty && <span className="cnt">{pending}</span>}
      </Link>
    );
  };

  const swItem = (k: AppKey) => {
    const e = s.ent(k);
    return (
      <button key={k} className={`sw-i ${k === 'os' ? 'cur' : ''} ${e !== 'ok' ? 'lock' : ''}`} onClick={() => { setDd(null); openApp(k); }}>
        <span className="tile-app" style={{ background: APPS[k].c }}><Icon name={APPS[k].i} size="sm" /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <div className="t1">{k === 'os' ? 'Pollo OS · Pollo CEO' : APPS[k].n}</div>
          <div className="t2">{APPS[k].p}</div>
        </span>
        {k === 'os' ? <span className="chip brand">Aberto</span> : <span className={`chip ${ENT[e][1]}`}>{e !== 'ok' && <Icon name="lock" size="xs" />}{e === 'nao' ? 'Não incluído' : ENT[e][0]}</span>}
      </button>
    );
  };

  return (
    <div className="app">
      <div className={`shell ${collapsed ? 'mini' : ''}`}>
        {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}
        <aside className={`side ${navOpen ? 'open' : ''}`}>
          <div className="brand">
            <span className="logo" aria-hidden="true"><i /></span>
            <span className="n">Pollo <em>OS</em></span>
            <button className="icon-btn collapse desk" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>
              <Icon name="panelL" size="sm" />
            </button>
          </div>
          <div className="dd">
            <button className="co-sel" onClick={() => setDd(dd === 'co' ? null : 'co')} aria-expanded={dd === 'co'} title={c.n}>
              <span className="co" style={{ background: c.c }}>{c.in}</span>
              <span className="meta" style={{ minWidth: 0, flex: 1 }}>
                <div className="t1">{c.n}</div>
                <div className="t2">{ten?.role}</div>
              </span>
              <Icon name="chev" size="sm" />
            </button>
            {dd === 'co' && (
              <div className="dd-menu left" style={{ width: 240 }}>
                <div className="lbl" style={{ padding: '6px 10px' }}>Suas empresas</div>
                {prof.tenants.map((t) => (
                  <button key={t.co} className={`dd-item ${t.co === s.company ? 'cur' : ''}`} onClick={() => { s.enter(t.co); setDd(null); router.push('/ceo'); }}>
                    <span className="avatar sm" style={{ background: COMPANIES[t.co].c, borderRadius: 7 }}>{COMPANIES[t.co].in}</span>
                    <span style={{ flex: 1 }}>{COMPANIES[t.co].n}</span>
                    {t.co === s.company && <Icon name="check" size="sm" />}
                  </button>
                ))}
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', padding: '8px 10px', display: 'flex', gap: 6 }}>
                  <Icon name="shield" size="xs" />Cada empresa tem contexto separado.
                </div>
              </div>
            )}
          </div>
          {GROUPS.map(([g, ks]) => (
            <div key={g}>
              <div className="nav-sec">{g}</div>
              <nav className="nav" aria-label={g}>{ks.map(item)}</nav>
            </div>
          ))}
          <div className="side-foot">
            <div className="nav-sec" style={{ paddingTop: 2 }}>Seus aplicativos</div>
            <nav className="nav" aria-label="Seus aplicativos">
              {(['ff', 'fi'] as AppKey[]).map((k) => {
                const e = s.ent(k);
                return (
                  <button key={k} className="nav-i" onClick={() => openApp(k)} title={APPS[k].n}>
                    <span className="dot" style={{ background: e === 'ok' ? APPS[k].c : 'var(--line-2)' }} />
                    <span className="nt">{APPS[k].n}</span>
                    <span className="lk"><Icon name={e === 'ok' ? 'arrow' : 'lock'} size="xs" /></span>
                  </button>
                );
              })}
              <Link href="/apps" className={`nav-i ${path === '/apps' ? 'cur' : ''}`} title="Ver todos"><Icon name="grid" /><span className="nt">Ver todos</span></Link>
            </nav>
            <Link href="/configuracoes" className={`nav-i ${path === '/configuracoes' ? 'cur' : ''}`} title="Configurações"><Icon name="sliders" /><span className="nt">Configurações</span></Link>
            <div className="user">
              <span className="avatar" style={{ background: 'var(--brand)' }}>{prof.in}</span>
              <span className="meta" style={{ flex: 1, minWidth: 0 }}>
                <div className="t1">{prof.n}</div>
                <div className="t2">{ten?.role}</div>
              </span>
              <button className="icon-btn" onClick={() => { s.logout(); router.replace('/login'); }} aria-label="Sair" title="Sair"><Icon name="logout" size="sm" /></button>
            </div>
          </div>
        </aside>
        <div className="main">
          <header className="top">
            <button className="icon-btn mob" onClick={() => setNavOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
            <div className="ttl">
              <div className="crumb">Pollo OS / {c.n}</div>
              <h1>{TITLES[path] ?? ''}</h1>
            </div>
            <span className="sp" />
            <div className="sync desk">
              {c.empty ? (
                <span className="src off"><i style={{ background: 'var(--ink-3)' }} />Sem fontes conectadas</span>
              ) : (
                <Link href="/integracoes" className="src" title="Estado das fontes" style={{ textDecoration: 'none' }}>
                  <i style={{ background: 'var(--ok)' }} />Dados de 09:42<span className="faint">·</span>
                  <i style={{ background: 'var(--err)' }} />Google com falha<span className="faint">·</span>
                  <i style={{ background: 'var(--ink-3)' }} />Sem ERP
                </Link>
              )}
            </div>
            <div className="dd">
              <button className="sw-btn" onClick={() => setDd(dd === 'sw' ? null : 'sw')} aria-expanded={dd === 'sw'} aria-label="Aplicativos">
                <Icon name="grid" size="sm" /><span className="t">Apps</span><Icon name="chev" size="xs" />
              </button>
              {dd === 'sw' && (
                <div className="dd-menu sw-menu">
                  <div className="lbl" style={{ padding: '6px 10px' }}>Aplicativos de {c.n}</div>
                  {swItem('os')}{swItem('ff')}{swItem('fi')}
                  <Link className="dd-item" href="/apps" style={{ marginTop: 4, textDecoration: 'none', color: 'inherit' }}><Icon name="grid" size="sm" />Ver todos os aplicativos</Link>
                  <div className="sw-foot"><Icon name="shield" size="xs" />Mesma sessão: trocar de aplicativo não pede novo login.</div>
                </div>
              )}
            </div>
          </header>
          <div className="body noctx">
            <main className="center">{children}</main>
          </div>
        </div>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
