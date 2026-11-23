import { STATUS_LABEL, type MeetingStatus } from "@/lib/client/meetings";

const STYLE: Record<MeetingStatus, string> = {
  rascunho: "bg-panel text-muted ring-line",
  agendada: "bg-blue-50 text-blue-800 ring-blue-200",
  em_andamento: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  concluida: "bg-panel text-foreground ring-line",
  cancelada: "bg-panel text-muted line-through ring-line",
};

export function StatusBadge({ status }: { status: MeetingStatus }) {
  return (
    <span className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
