import type { ColorId, FaceId, MoodId, ShapeId } from "@/components/pollo/pollo";

export type Agent = {
  id: string;
  name: string;
  purpose: string;
  model: string;
  shape: ShapeId;
  color: ColorId;
  face: FaceId;
  mood: MoodId;
};

export type Draft = Omit<Agent, "id">;

/**
 * O Pollo CEO: o agente executivo da Home, de nível estratégico. Conversa com o empresário,
 * coordena os outros agentes e pede aprovação antes de qualquer ação sensível.
 */
export const POLLO_CEO: Agent = {
  id: "pollo-ceo",
  name: "Pollo CEO",
  purpose: "Converso com você sobre a empresa, coordeno os outros agentes e peço sua aprovação antes de agir.",
  model: "equilibrado",
  shape: "quadrado",
  color: "laranja",
  face: "olhos",
  mood: "animado",
};

/*
 * Antes do servidor, os agentes ficavam só neste navegador, nesta chave. Agora ficam no banco;
 * estas funções servem só para oferecer a importação deles e depois limpar o navegador.
 */
const LEGACY_KEY = "pollo-os:agentes";

export function readLegacyAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const list = raw ? (JSON.parse(raw) as Agent[]) : [];
    return Array.isArray(list) ? list.filter((a) => a && typeof a.name === "string") : [];
  } catch {
    return [];
  }
}

export function clearLegacyAgents() {
  try {
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem("pollo-os:apps-acesso");
  } catch {
    // Sem armazenamento: nada a limpar.
  }
}

export function toDraft({ name, purpose, model, shape, color, face, mood }: Agent): Draft {
  return { name, purpose, model, shape, color, face, mood };
}
