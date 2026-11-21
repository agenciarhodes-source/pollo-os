'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { NoData } from '@/components/NoData';
import { Ill, Kpi, PageHead, SrcChip, brl } from '@/components/ui';
import { KPI, Q } from '@/demo/data';
import { useSession } from '@/demo/session';

export default function ExecPage() {
  const s = useSession();
  const pending = s.decisions.filter((d) => d.s === 'Aguardando aprovação');
  const pct = (a: number, b: number) => `${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}%`;
  return (
    <NoData>
      <div className="stack">
        <PageHead title="Visão Executiva" sub={`${KPI.per} · comparado com ${KPI.prev}`}
          right={<div className="row wrap"><SrcChip k="ff" /><SrcChip k="fi" /><SrcChip k="erp" /><Ill /></div>} />
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <Kpi label="Leads" value={String(KPI.leads[0])} prev={`${pct(KPI.leads[0], KPI.leads[1])} vs. ${KPI.leads[1]}`} good note="FlipForm · atualizado 09:42" />
          <Kpi label="Vendas (negócios ganhos)" value={String(KPI.vendas[0])} prev={`${pct(KPI.vendas[0], KPI.vendas[1])} vs. ${KPI.vendas[1]}`} good={false} note="FlipForm · não é receita recebida" />
          <Kpi label="Conversão lead → venda" value={KPI.conv[0]} prev={`antes ${KPI.conv[1]}`} good={false} note="FlipForm" />
          <Kpi label="Primeira resposta (média)" value={`${KPI.resp[0]} min`} prev={`antes ${KPI.resp[1]} min`} good={false} note="FlipForm · horário de contato" />
          <Kpi label="Investimento em mídia" value={brl(KPI.invest[0])} prev={`antes ${brl(KPI.invest[1])}`} note="Meta e Google · atrasado 3 h" />
          <Kpi label="Receita recebida" value="—" note="Sistema financeiro não conectado" />
        </div>
        <section className="card">
          <div className="card-h"><div><h3>Prioridades</h3><div className="sub">O que merece a sua atenção agora</div></div></div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="row between wrap"><span><b>Conversão caiu</b> <span className="muted">de 4,2% para 2,8% com mais leads</span></span><Link className="btn line xs" href={`/ceo?q=${encodeURIComponent(Q.main)}`}>Perguntar ao Pollo CEO <Icon name="chevr" size="xs" /></Link></div>
            <div className="row between wrap"><span><b>Atendimento mais lento</b> <span className="muted">primeira resposta de 27 para 42 min</span></span><Link className="btn line xs" href="/visao-analitica">Ver análise <Icon name="chevr" size="xs" /></Link></div>
            <div className="row between wrap"><span><b>{pending.length} decisão(ões) aguardando aprovação</b> <span className="muted">{pending.map((d) => d.id).join(', ') || '—'}</span></span><Link className="btn line xs" href="/decisoes">Abrir decisões <Icon name="chevr" size="xs" /></Link></div>
          </div>
        </section>
      </div>
    </NoData>
  );
}
