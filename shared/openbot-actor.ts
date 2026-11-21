/**
 * Whether a configuration row's `actor` is Pollo OS itself, for a change nobody made.
 *
 * Pollo OS names itself two ways: `deployment` for a refresh of an app's tools it ran on its own, and
 * `openbot:…` for what it gives every Bot by itself (Routines' tools at every start, and in the
 * personal edition every app's tools and every skill). The server records those rows as started by
 * Pollo OS. Rows written before it did say a person started them, and Activity reads them by this
 * rule too, since the trail cannot be rewritten.
 */
export function isOpenBotActor(actor: unknown): boolean {
  return (
    typeof actor === "string" &&
    (actor === "deployment" || actor.startsWith("openbot:"))
  );
}
