'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/demo/session';

// Faixa fixa no topo: deixa claro em toda tela que nada aqui é dado real.
export function DemoBar() {
  const s = useSession();
  const router = useRouter();
  return (
    <div className="demo-bar" role="note">
      <span className="pv-tag"><i /> Modo demonstração</span>
      <span>Dados fictícios da empresa exemplo · sem IA, banco ou integrações reais</span>
      <span style={{ flex: 1 }} />
      <button onClick={() => { s.reset(); router.replace('/login'); }}>Reiniciar demonstração</button>
    </div>
  );
}
