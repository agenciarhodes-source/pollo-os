/** Why Connect with Pollo OS Desktop did not connect this browser, one plain sentence per code: Pollo OS Desktop's own
 * error codes, and the Recorder's (no answer, the policy, an address it cannot use, Pollo OS not taking Desktop's code,
 * Pollo OS serving only newer Recorders, for a security problem or not). */
const SENTENCES: Record<string, string> = {
  "origin-not-allowed":
    "Pollo OS Desktop does not recognise this copy of the Recorder. Connect from Pollo OS in your browser instead.",
  "not-installed":
    "Pollo OS Desktop has not set up Pollo OS on this computer yet. Finish setting it up in Pollo OS Desktop, then try again.",
  "not-running":
    "Pollo OS is not running in Pollo OS Desktop. Open Pollo OS Desktop, then try again.",
  "not-signed-in":
    "Pollo OS Desktop is not signed in to your organization. Sign in again in Pollo OS Desktop, then try again.",
  "organization-unavailable":
    "Pollo OS Desktop cannot hand over your organization sign-in right now. Try again later.",
  "handoff-failed":
    "Pollo OS did not give Pollo OS Desktop a code to connect with. Try again.",
  "timed-out": "Pollo OS Desktop did not answer in time. Try again.",
  "no-answer": "Pollo OS Desktop did not answer. Open it, then try again.",
  "host-failed":
    "Pollo OS Desktop ran into a problem while answering. Try again, or connect from Pollo OS in your browser.",
  "unknown-message":
    "This version of Pollo OS Desktop does not understand the Recorder. Update Pollo OS Desktop, then try again.",
  "policy-invalid":
    "Your organization's Recorder policy names an Pollo OS address the Recorder cannot use. Ask your IT team.",
  "pinned-elsewhere":
    "Your organization connects the Recorder to a different Pollo OS. Connect from that Pollo OS instead.",
  "invalid-address":
    "Pollo OS Desktop answered with an address the Recorder cannot use. Connect from Pollo OS in your browser instead.",
  "exchange-refused":
    "Pollo OS did not accept the code Pollo OS Desktop gave the Recorder. Try again.",
  "client-update-required":
    "This Pollo OS needs a newer Pollo OS Recorder. Update Pollo OS, then try again.",
  "client-security-update-required":
    "This version of Pollo OS has a security problem. Update to keep using it.",
  "openbot-unreachable":
    "Pollo OS did not answer. Make sure Pollo OS is running in Pollo OS Desktop, then try again.",
};

const UNKNOWN =
  "Pollo OS Desktop could not connect this browser. Try again, or connect from Pollo OS in your browser.";

export function desktopSentence(code: string): string {
  return Object.hasOwn(SENTENCES, code) ? (SENTENCES[code] as string) : UNKNOWN;
}
