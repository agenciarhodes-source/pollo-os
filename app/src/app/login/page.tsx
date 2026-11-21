'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { PROFILES, type ProfileKey } from '@/demo/data';
import { useSession } from '@/demo/session';

export default function LoginPage() {
  const s = useSession();
  const router = useRouter();
  const [who, setWho] = useState<ProfileKey>('marina');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      s.login(who);
      router.push(PROFILES[who].tenants.length > 1 ? '/empresa' : '/ceo');
    }, 450);
  };

  return (
    <div className="app">
      <div className="login">
        <section className="lg-l" aria-hidden="true">
          <div className="brand" style={{ padding: 0 }}><span className="logo"><i /></span><span className="n" style={{ fontSize: 20 }}>Pollo <em>OS</em></span></div>
          <div>
            <h1>Sua empresa. Uma conversa. Mais clareza.</h1>
            <p className="lead">Uma conta para a estratégia, a operação e a análise. Você entra uma vez e abre os aplicativos que a sua empresa contratou.</p>
          </div>
          <div className="eco">
            <div className="eco-r"><span className="tile" style={{ background: 'var(--brand)' }}><Icon name="compass" size="sm" /></span><span style={{ display: 'grid' }}><b>Pollo OS · Pollo CEO</b><span>Conversa executiva, decisões e reuniões</span></span></div>
            <div className="eco-r"><span className="tile" style={{ background: 'var(--ff)' }}><Icon name="layers" size="sm" /></span><span style={{ display: 'grid' }}><b>FlipForm</b><span>CRM, atendimento, funis, tarefas e Flip Ads</span></span></div>
            <div className="eco-r"><span className="tile" style={{ background: 'var(--fi)' }}><Icon name="trend" size="sm" /></span><span style={{ display: 'grid' }}><b>Flip Intelligence</b><span>Indicadores, fontes e hipóteses com evidência</span></span></div>
          </div>
          <span className="faint" style={{ fontSize: 12 }}>Modo demonstração · nenhum dado real</span>
        </section>
        <section className="lg-r">
          <form className="lg-form" onSubmit={submit} noValidate>
            <div className="mob"><div className="brand" style={{ padding: 0 }}><span className="logo"><i /></span><span className="n" style={{ fontSize: 19 }}>Pollo <em>OS</em></span></div></div>
            <div>
              <h2>Entrar na Pollo OS</h2>
              <p className="muted" style={{ marginTop: 4 }}>Escolha um perfil de exemplo para ver o sistema pelos olhos de cada pessoa.</p>
            </div>
            <div className="field">
              <span className="fl">Perfil de demonstração</span>
              <div style={{ display: 'grid', gap: 8 }}>
                {(Object.keys(PROFILES) as ProfileKey[]).map((k) => (
                  <label key={k} className="check" style={{ alignItems: 'flex-start', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', background: who === k ? 'var(--brand-soft)' : 'var(--surface)' }}>
                    <input type="radio" name="perfil" checked={who === k} onChange={() => setWho(k)} style={{ marginTop: 3 }} />
                    <span style={{ display: 'grid' }}>
                      <b>{PROFILES[k].n}</b>
                      <span className="faint" style={{ fontSize: 12.5 }}>{PROFILES[k].desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="lg-mail">E-mail</label>
              <input className="inp" id="lg-mail" type="email" autoComplete="off" value={PROFILES[who].mail} readOnly />
            </div>
            <div className="field">
              <label htmlFor="lg-pass">Senha</label>
              <div className="pwd">
                <input className="inp" id="lg-pass" type={show ? 'text' : 'password'} autoComplete="off" placeholder="Qualquer senha de exemplo" />
                <button type="button" className="icon-btn" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}><Icon name={show ? 'eyeoff' : 'eye'} size="sm" /></button>
              </div>
            </div>
            <button className="btn primary" type="submit" style={{ height: 46 }} disabled={busy}>
              {busy ? <><span className="spin" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} />Entrando…</> : 'Entrar'}
            </button>
            <div className="caveat"><Icon name="shield" size="sm" /><span>Login simulado: a senha não é guardada nem enviada. O login real (e-mail, Google e acesso único com o FlipForm) entra numa próxima etapa.</span></div>
          </form>
        </section>
      </div>
    </div>
  );
}
