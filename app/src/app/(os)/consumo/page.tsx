'use client';

import { NoData } from '@/components/NoData';
import { Bars, Ill, Kpi, PageHead, brl2 } from '@/components/ui';
import { USAGE } from '@/demo/data';

export default function UsagePage() {
  const pct = Math.round((USAGE.spent / USAGE.budget) * 100);
  return (
    <NoData>
      <div className="stack">
        <PageHead title="Consumo & Custos" sub={`${USAGE.month} · custo de IA por agente e por tipo de uso`} right={<Ill />} />
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <Kpi label="Gasto no mês" value={brl2(USAGE.spent)} note={`${pct}% da franquia`} />
          <Kpi label="Franquia do plano" value={brl2(USAGE.budget)} note="Alertas em 50%, 75%, 90% e 100%" />
          <Kpi label="Projeção do mês" value={brl2(USAGE.spent * 30 / 20)} note="Ritmo dos últimos 20 dias" />
        </div>
        <section className="card">
          <div className="card-h"><div><h3>Uso da franquia</h3><div className="sub">{pct}% usado</div></div></div>
          <div style={{ height: 12, background: 'var(--sand)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? 'var(--err)' : pct >= 75 ? 'var(--warn)' : 'var(--brand)' }} />
          </div>
        </section>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
          <section className="card"><div className="card-h"><h3>Por agente (R$)</h3></div><Bars rows={USAGE.byAgent.map(([n, v]) => [n, v])} /></section>
          <section className="card"><div className="card-h"><h3>Por tipo de uso (R$)</h3></div><Bars rows={USAGE.byKind.map(([n, v]) => [n, v, 'var(--fi)'])} /></section>
        </div>
      </div>
    </NoData>
  );
}
