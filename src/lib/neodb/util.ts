import type { NeoDBMe } from "./types";

export const nowIso = (): string => new Date().toISOString();

export function base64UrlEncode(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function sha256(input: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(digest);
  }
  const { createHash } = await import("node:crypto");
  const hash = createHash("sha256").update(Buffer.from(data)).digest();
  return new Uint8Array(hash);
}

export async function pkceChallengeFromVerifier(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

export function normalizeInstance(input: string): URL {
  let v = input.trim();
  if (!v) throw new Error("instance_required");
  if (!/^https?:\/\//i.test(v)) {
    v = `https://${v}`;
  }
  const url = new URL(v);
  const origin = `${url.protocol}//${url.host}`;
  return new URL(origin);
}

export async function assertIsNeoDBInstance(base: URL): Promise<void> {
  const r = await fetch(`${base.origin}/api/v2/instance`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) {
    throw new Error("invalid_instance");
  }
  const j = (await r.json().catch(() => null)) as unknown;
  const version = typeof (j as { version?: unknown })?.version === "string" ? ((j as { version: string }).version.toLowerCase()) : "";
  if (!version.includes("neodb")) {
    throw new Error("not_a_neodb_instance");
  }
}

export function parseNeodbMe(u: unknown): NeoDBMe {
  const out: NeoDBMe = {};
  if (u && typeof u === "object") {
    const r = u as Record<string, unknown>;
    if (typeof r.url === "string") out.url = r.url;
    if (typeof r.external_acct === "string") out.external_acct = r.external_acct;
    if (Array.isArray(r.external_accounts)) {
      out.external_accounts = r.external_accounts.map((x) => {
        const item: { platform?: string; handle?: string; url?: string | null } = {};
        if (x && typeof x === "object") {
          const rx = x as Record<string, unknown>;
          if (typeof rx.platform === "string") item.platform = rx.platform;
          if (typeof rx.handle === "string") item.handle = rx.handle;
          if (typeof rx.url === "string") item.url = rx.url;
          if (rx.url === null) item.url = null;
        }
        return item;
      });
    }
    if (typeof r.display_name === "string") out.display_name = r.display_name;
    if (typeof r.avatar === "string") out.avatar = r.avatar;
    if (typeof r.username === "string") out.username = r.username;
    if (Array.isArray(r.roles)) out.roles = r.roles.filter((x) => typeof x === "string") as string[];
  }
  return out;
}

