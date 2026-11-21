'use client';

import { useEffect } from 'react';

// O CSS do protótipo adapta o layout por classes de largura (lt1280, lt1100, lt860, lt420)
// aplicadas a um ancestral. Aqui elas vão no <body> e acompanham o tamanho da janela.
const BREAKS = [1280, 1100, 860, 420];

export function WidthClasses() {
  useEffect(() => {
    const apply = () => {
      const w = document.documentElement.clientWidth;
      for (const b of BREAKS) document.body.classList.toggle(`lt${b}`, w <= b);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return null;
}
