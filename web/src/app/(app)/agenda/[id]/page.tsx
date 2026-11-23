import { MeetingRoom } from "@/components/agenda/meeting-room";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MeetingRoom id={id} />;
}
