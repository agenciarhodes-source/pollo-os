import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const API_ORIGIN = "https://app.flipform.com.br";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tokenFormat = /^ffv1\.[0-9a-f-]{36}\.[A-Za-z0-9_-]{32,128}$/;

/** Diagnostic v1 credential only. Never log or return the bearer to any caller. */
export function validateDiagnosticToken(value: unknown): value is string {
  return typeof value === "string" && value.length <= 250 && tokenFormat.test(value);
}

/** Must be a new, independent 32-byte key, provided via a secret environment variable. */
export function getCredentialEncryptionKey(env: Readonly<Record<string, string | undefined>> = process.env): Buffer {
  const value = env.FLIP_OS_CREDENTIAL_ENCRYPTION_KEY;
  if (!value || !/^[A-Za-z0-9+/]{43}=$/.test(value)) throw new Error("ENCRYPTION_KEY_NOT_CONFIGURED");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) throw new Error("ENCRYPTION_KEY_NOT_CONFIGURED");
  return key;
}

function aad(orgId: string): Buffer {
  return Buffer.from("flip-os:v1:flipform:" + orgId, "utf8");
}

export function encryptCredential(token: string, orgId: string, key: Buffer): string {
  if (key.length !== 32 || !validateDiagnosticToken(token)) throw new Error("INVALID_CREDENTIAL");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad(orgId));
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return ["v1", nonce.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptCredential(value: string, orgId: string, key: Buffer): string {
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("CREDENTIAL_UNREADABLE");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parts[1], "base64url"));
    decipher.setAAD(aad(orgId));
    decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
    const secret = Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]).toString("utf8");
    if (!validateDiagnosticToken(secret)) throw new Error("CREDENTIAL_UNREADABLE");
    return secret;
  } catch {
    throw new Error("CREDENTIAL_UNREADABLE");
  }
}

export type FlipFormProbe = { ok: true; tenantId: string; integrationId: string } | { ok: false; reason: "unauthorized" | "unavailable" | "invalid_response" };

export async function probeFlipForm(token: string, fetcher: typeof fetch = fetch): Promise<FlipFormProbe> {
  if (!validateDiagnosticToken(token)) return { ok: false, reason: "unauthorized" };
  try {
    const response = await fetcher(API_ORIGIN + "/api/v1/capabilities", {
      method: "GET",
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    if (response.status === 401 || response.status === 403 || response.status === 404) return { ok: false, reason: "unauthorized" };
    if (!response.ok) return { ok: false, reason: "unavailable" };
    if (!(response.headers.get("content-type") || "").includes("application/json")) return { ok: false, reason: "invalid_response" };
    const body = await response.json() as Record<string, unknown>;
    if (body.version !== "v1" || body.capability !== "integrations.read" || body.businessData !== false
        || typeof body.tenantId !== "string" || !uuid.test(body.tenantId)
        || typeof body.integrationId !== "string" || !uuid.test(body.integrationId)) {
      return { ok: false, reason: "invalid_response" };
    }
    return { ok: true, tenantId: body.tenantId, integrationId: body.integrationId };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
