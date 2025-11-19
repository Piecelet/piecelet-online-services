import type { NeoDBMe, NeoDBUserInfo } from "@/neodb/types";

export const nowIso = (): string => new Date().toISOString();

export function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  const len = buffer.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i] ?? 0);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function sha256(input: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
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

/**
 * Extract user info from NeoDB /api/me response
 * - email: extract from external_accounts where platform === "email"
 * - username: format as @username@instance
 * - displayName: use display_name or fallback to username
 */
export function extractNeoDBUserInfo(me: NeoDBMe, instanceHost: string): NeoDBUserInfo | null {
  // Extract email from external_accounts
  let email: string | undefined;
  if (me.external_accounts) {
    const emailAccount = me.external_accounts.find(acc => acc.platform === "email");
    if (emailAccount?.handle) {
      email = emailAccount.handle;
    }
  }

  // If no email found, return null
  if (!email) {
    return null;
  }

  // Build username as @username@instance
  const username = me.username ? `@${me.username}@${instanceHost}` : `@unknown@${instanceHost}`;

  // Use display_name or fallback to username
  const displayName = me.display_name || me.username || email.split("@")[0] || "Unknown";

  return {
    email,
    username,
    displayName,
    avatar: me.avatar,
    externalAcct: me.external_acct,
  };
}

