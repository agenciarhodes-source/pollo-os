/**
 * The Pollo OS release this app was built from, and the header that names it on every request to Pollo OS.
 *
 * It is the version in the repository's root package.json, which app.config.ts reads as the app is built into
 * `extra.openbotRelease`. Expo's own app version is a store number and says nothing about which Pollo OS this is.
 */
import Constants from "expo-constants";
import { CLIENT_HEADER, clientToken, isVersion } from "./client-version";

const built = (Constants.expoConfig?.extra as { openbotRelease?: unknown })
  ?.openbotRelease;

/** Undefined only for a build whose config was not read from this repository; such a build names no release. */
export const RELEASE: string | undefined = isVersion(built) ? built : undefined;

/** `OpenBot-Client: mobile/<release>`, for every request this app sends to Pollo OS. */
export function clientHeaders(): Record<string, string> {
  return RELEASE ? { [CLIENT_HEADER]: clientToken("mobile", RELEASE) } : {};
}
