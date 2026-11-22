"use client";

import { useMemo, useSyncExternalStore } from "react";
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

/** O Pollo do próprio Pollo OS: quem atende quando ainda não há nenhum agente criado. */
export const POLLO: Agent = {
  id: "pollo",
  name: "Pollo",
  purpose: "Seu assistente no Pollo OS. Ajudo a criar agentes e a achar o que você precisa.",
  model: "equilibrado",
  shape: "quadrado",
  color: "laranja",
  face: "olhos",
  mood: "animado",
};

/*
 * Enquanto não há servidor, os agentes ficam guardados neste navegador.
 * Sem armazenamento (janela anônima, por exemplo), a lista vale só nesta visita.
 */
const STORAGE_KEY = "pollo-os:agentes";
const CHANGED = "pollo-os:agentes-mudaram";
let memory = "[]";

function readAgents(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return memory;
  }
}

export function saveAgents(agents: Agent[]) {
  memory = JSON.stringify(agents);
  try {
    localStorage.setItem(STORAGE_KEY, memory);
  } catch {
    // Fica só na memória.
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

export function useAgents(): Agent[] {
  const raw = useSyncExternalStore(subscribe, readAgents, () => "[]");
  return useMemo(() => {
    try {
      return JSON.parse(raw) as Agent[];
    } catch {
      return [];
    }
  }, [raw]);
}

export function toDraft({ name, purpose, model, shape, color, face, mood }: Agent): Draft {
  return { name, purpose, model, shape, color, face, mood };
}
