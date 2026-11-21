'use client';

// Sessão SIMULADA do modo demonstração. Não há login real: a "senha" não é guardada nem enviada.
// O estado fica só no navegador de quem está vendo (localStorage) e pode ser zerado a qualquer momento.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  COMPANIES, D14, PROFILES, initialDecisions,
  type AppKey, type CompanyKey, type Decision, type DecisionStatus, type ProfileKey,
} from './data';

type State = { profile: ProfileKey | null; company: CompanyKey | null; decisions: Decision[] };
const KEY = 'pollo-os-demo-v1';
const empty: State = { profile: null, company: null, decisions: initialDecisions() };

function load(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch { /* armazenamento indisponível: segue em memória */ }
  return empty;
}

type Ctx = State & {
  ready: boolean;
  login: (p: ProfileKey) => void;
  enter: (c: CompanyKey) => void;
  logout: () => void;
  reset: () => void;
  tenant: () => (typeof PROFILES)[ProfileKey]['tenants'][number] | null;
  ent: (app: AppKey) => 'ok' | 'nao' | 'noperm';
  setDecision: (id: string, s: DecisionStatus, who: string, what: string) => void;
  proposeD14: () => void;
};
const SessionCtx = createContext<Ctx | null>(null);

function stamp() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<State>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => { setSt(load()); setReady(true); }, []);
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignora */ }
  }, [st, ready]);

  const tenant = useCallback(() => {
    if (!st.profile || !st.company) return null;
    return PROFILES[st.profile].tenants.find((t) => t.co === st.company) ?? null;
  }, [st.profile, st.company]);

  const value = useMemo<Ctx>(() => ({
    ...st, ready, tenant,
    login: (p) => setSt((s) => ({ ...s, profile: p, company: PROFILES[p].tenants.length === 1 ? PROFILES[p].tenants[0].co : null })),
    enter: (c) => setSt((s) => ({ ...s, company: c })),
    logout: () => setSt((s) => ({ ...s, profile: null, company: null })),
    reset: () => setSt({ ...empty, decisions: initialDecisions() }),
    ent: (app) => tenant()?.apps[app] ?? 'noperm',
    setDecision: (id, s, who, what) => setSt((x) => ({
      ...x,
      decisions: x.decisions.map((d) => (d.id === id ? { ...d, s, aud: [...d.aud, [stamp(), who, what]] } : d)),
    })),
    proposeD14: () => setSt((x) => (x.decisions.some((d) => d.id === 'D-014') ? x : {
      ...x,
      decisions: [{ ...D14, s: 'Aguardando aprovação', aud: [[stamp(), 'Pollo CEO', 'Criou a proposta a partir da conversa']] }, ...x.decisions],
    })),
  }), [st, ready, tenant]);

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error('useSession fora do SessionProvider');
  return c;
}

export function useCompany() {
  const { company } = useSession();
  return company ? { key: company, ...COMPANIES[company] } : null;
}
