/**
 * Endereços antigos que continuam funcionando, levando para o lugar novo.
 * Sem dependências, porque o next.config.ts lê este arquivo.
 */
export const LEGACY_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/criaturas", destination: "/agentes/criaturas" },
  { source: "/tarefas", destination: "/agentes" },
];
