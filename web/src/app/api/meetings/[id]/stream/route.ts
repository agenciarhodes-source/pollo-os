import { getDb } from "@/lib/db";
import { runTurn } from "@/lib/server/ai";
import { getMeeting } from "@/lib/server/meetings";
import { HttpError, readJson, withTenant } from "@/lib/server/tenant";
import { messageInput } from "@/lib/server/validation";

type Context = { params: Promise<{ id: string }> };

export const maxDuration = 60;

/** A conversa da reunião com o Pollo CEO, só enquanto ela está em andamento. */
export const POST = withTenant<Context>(async (request, tenant, { params }) => {
  const { id } = await params;
  const { text } = await readJson(request, (b) => messageInput.parse(b));
  const db = getDb();
  const meeting = await getMeeting(db, tenant.orgId, tenant.userId, id);
  if (meeting.status !== "em_andamento") throw new HttpError(409, "A conversa da reunião abre quando ela começa.");
  return runTurn(
    db,
    {
      orgId: tenant.orgId,
      userId: tenant.userId,
      userName: tenant.userName,
      agent: { key: "pollo-ceo", name: "Pollo CEO", purpose: "", model: "equilibrado" },
      meeting: { title: meeting.title, agenda: meeting.agenda, participants: meeting.participants.map((p) => p.name) },
    },
    `reuniao:${id}`,
    text,
  );
});
