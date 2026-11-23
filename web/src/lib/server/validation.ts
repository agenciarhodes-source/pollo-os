import * as z from "zod";
import { COLORS, FACES, MOODS, SHAPES } from "@/components/pollo/pollo";
import { POLLO_APPS } from "@/lib/apps";

const ids = <T extends { id: string }>(items: readonly T[]) => items.map((i) => i.id) as [string, ...string[]];

export const MODEL_IDS = ["equilibrado", "rapido", "avancado"] as const;

export const agentInput = z.object({
  name: z.string().trim().min(1).max(80),
  purpose: z.string().trim().max(500).default(""),
  model: z.enum(MODEL_IDS).default("equilibrado"),
  shape: z.enum(ids(SHAPES)),
  color: z.enum(ids(COLORS)),
  face: z.enum(ids(FACES)),
  mood: z.enum(ids(MOODS)),
});

export type AgentInput = z.infer<typeof agentInput>;

/** Importação dos agentes guardados no navegador (até 50 de uma vez). Cor desconhecida vira laranja. */
export const agentImport = z.object({
  agents: z
    .array(agentInput.extend({ color: z.string().transform((c) => (ids(COLORS).includes(c) ? c : "laranja")) }))
    .max(50),
});

export const appAccessInput = z.object({
  appId: z.enum(ids(POLLO_APPS)),
  agentId: z.uuid(),
  allowed: z.boolean(),
});

export const messageInput = z.object({ text: z.string().trim().min(1).max(4000) });
