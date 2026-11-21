import { useEffect } from "react";
import type { Connecting } from "./ConnectToOpenBot";
import { ExternalLink } from "./ExternalLink";
import { StatusLine } from "./SetupProgress";
import { UpdateOpenBot } from "./UpdateOpenBot";

/** Pollo OS Cloud's address: the Pollo OS CopilotKit runs, which the web app and this app share. */
export const OPENBOT_CLOUD_URL = "https://my.open.bot";

/**
 * Whether this build offers Pollo OS Cloud on the first screen. Off unless the build sets
 * `VITE_OPENBOT_CLOUD_ENABLED=true`: until Cloud is open to everybody, a build shows the first
 * screen without it (Pollo OS (Self-Contained), Pollo OS for Business, and connecting to an address).
 * Read when the screen draws, so a test can set it.
 */
export function cloudEnabled(): boolean {
  return (
    import.meta.env.VITE_OPENBOT_CLOUD_ENABLED?.trim().toLowerCase() === "true"
  );
}

/**
 * Where this build signs in to Pollo OS Cloud. `VITE_OPENBOT_CLOUD_URL` points a build at another
 * Pollo OS, such as a test stack; unset, it is {@link OPENBOT_CLOUD_URL}.
 */
export function cloudAddress(): string {
  return (
    import.meta.env.VITE_OPENBOT_CLOUD_URL?.trim() || OPENBOT_CLOUD_URL
  ).replace(/\/+$/, "");
}

/** The address as a person reads it: its host. */
export function cloudHost(address = cloudAddress()): string {
  try {
    return new URL(address).host;
  } catch {
    return address;
  }
}

/** The button that signs in. */
export const SIGN_IN_TO_CLOUD = "Sign in to Pollo OS Cloud";

/**
 * The first screen's lower half when Pollo OS Cloud is picked: what it is, and the sign-in. Cloud's
 * address is built in, so there is nothing to type. Signing in is the same as connecting to any
 * Pollo OS that runs elsewhere (`useConnectToOpenBot` with that address): the shell checks the
 * address, opens the person's browser to sign in (OAuth with PKCE, the way an app signs in), and
 * shows Pollo OS Cloud in this window. Nothing is installed or started on this computer.
 *
 * While the browser is waited on, Cancel is the only control. What went wrong is the shell's
 * sentence in the same calm notice the address screen draws, and the button says what pressing it
 * again does.
 */
export function CloudSignIn({
  connecting,
  focus = false,
}: {
  connecting: Connecting;
  /** Picked by the person just now: the button has the focus, so Enter signs in. */
  focus?: boolean;
}) {
  const { phase, trouble, busy } = connecting;
  const host = cloudHost(connecting.address);
  useEffect(() => {
    if (focus) connecting.action.current?.focus();
  }, [focus, connecting.action]);
  return (
    <section className="cloud-sign-in" aria-label="Pollo OS Cloud">
      <p className="lede">
        Sign in with your Pollo OS account, or create one. Your Bots and
        conversations are the same here and at {host}.
      </p>
      {phase === "waiting" ? (
        <>
          <StatusLine>Finish signing in in your browser.</StatusLine>
          <div className="row">
            <button
              type="button"
              className="quiet"
              onClick={() => void connecting.cancel()}
            >
              Cancel
            </button>
          </div>
        </>
      ) : phase === "opening" ? (
        <StatusLine>Opening Pollo OS…</StatusLine>
      ) : (
        <>
          {trouble && trouble.offer !== "update" && (
            <div className="local-alert needs" role="alert">
              <p>{trouble.problem.said}</p>
            </div>
          )}
          {trouble?.offer === "update" ? (
            <UpdateOpenBot said={trouble.problem.said} />
          ) : (
            <div className="row">
              <button
                type="button"
                ref={connecting.action}
                disabled={busy}
                onClick={() => void connecting.submit()}
              >
                {trouble?.offer === "sign-in"
                  ? "Sign in again"
                  : trouble && trouble.offer !== "browser"
                    ? "Try again"
                    : SIGN_IN_TO_CLOUD}
              </button>
              {trouble?.offer === "browser" && (
                <ExternalLink className="button-link" href={connecting.address}>
                  Open in browser
                </ExternalLink>
              )}
            </div>
          )}
          {phase === "checking" ? (
            <StatusLine>Reaching Pollo OS Cloud…</StatusLine>
          ) : (
            <p className="footnote">
              You'll sign in in your browser. Nothing is installed on this
              computer.
            </p>
          )}
        </>
      )}
    </section>
  );
}
