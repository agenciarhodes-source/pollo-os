"use client";

import { useMeeting } from "@/lib/client/meetings";
import { MeetingForm } from "./meeting-form";

export function EditMeeting({ id }: { id: string }) {
  const { meeting, error } = useMeeting(id);
  if (error) {
    return (
      <main className="flex-1 p-8">
        <p role="alert" className="text-sm text-red-700">
          {error.message}
        </p>
      </main>
    );
  }
  if (!meeting) return <main className="flex-1 p-8 text-sm text-muted">Carregando…</main>;
  return <MeetingForm meeting={meeting} />;
}
