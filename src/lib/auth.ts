import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { DatabaseSync } from "node:sqlite";
import { createAuthEndpoint } from "better-auth/api";
import { generateState, parseState, handleOAuthUserInfo } from "better-auth/oauth2";
import { setSessionCookie } from "better-auth/cookies";

// Small helpers
const nowIso = () => new Date().toISOString();

function base64UrlEncode(buffer: Uint8Array) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sha256(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(digest);
  }
  // Node fallback
  const { createHash } = await import("node:crypto");
  const hash = createHash("sha256").update(Buffer.from(data)).digest();
  return new Uint8Array(hash);
}

async function pkceChallengeFromVerifier(verifier: string) {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

// Initialize a local SQLite database using Node's built-in (experimental) driver
const db = new DatabaseSync("database.sqlite");

// Ensure tables for NeoDB OAuth client registrations and state mapping
db.exec(`
  CREATE TABLE IF NOT EXISTS neodb_clients (
    instance TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS neodb_states (
    state TEXT PRIMARY KEY,
    instance TEXT NOT NULL,
    callback_url TEXT,
    created_at TEXT NOT NULL
  );
`);
// Backfill: ensure callback_url exists even if table was created previously without it
try {
  const cols = db.prepare("PRAGMA table_info(neodb_states)").all() as Array<{ name: string }>;
  const hasCallback = cols.some((c) => c.name === "callback_url");
  if (!hasCallback) {
    db.exec("ALTER TABLE neodb_states ADD COLUMN callback_url TEXT");
  }
} catch {}

type NeodbClient = {
  instance: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
};

function normalizeInstance(input: string): URL {
  let v = input.trim();
  if (!v) throw new Error("instance_required");
  if (!/^https?:\/\//i.test(v)) {
    v = `https://${v}`;
  }
  const url = new URL(v);
  // Reject paths; only allow host (and optional port)
  const origin = `${url.protocol}//${url.host}`;
  return new URL(origin);
}

async function assertIsNeoDBInstance(base: URL) {
  const r = await fetch(`${base.origin}/api/v2/instance`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) {
    throw new Error("invalid_instance");
  }
  const j = await r.json().catch(() => null);
  const version = String(j?.version ?? "").toLowerCase();
  if (!version.includes("neodb")) {
    throw new Error("not_a_neodb_instance");
  }
}

function getClient(instance: string): NeodbClient | null {
  const st = db.prepare(
    "SELECT instance, client_id, client_secret, redirect_uri FROM neodb_clients WHERE instance = ?",
  );
  const row = st.get(instance) as any;
  return row || null;
}

function saveClient(c: NeodbClient) {
  const st = db.prepare(
    "INSERT OR REPLACE INTO neodb_clients(instance, client_id, client_secret, redirect_uri, created_at) VALUES (?,?,?,?,?)",
  );
  st.run(c.instance, c.client_id, c.client_secret, c.redirect_uri, nowIso());
}

function saveState(state: string, instance: string, callbackURL?: string | null) {
  const st = db.prepare(
    "INSERT OR REPLACE INTO neodb_states(state, instance, callback_url, created_at) VALUES (?,?,?,?)",
  );
  st.run(state, instance, callbackURL ?? null, nowIso());
}

function popState(state: string): { instance: string; callback_url: string | null } | null {
  const get = db.prepare(
    "SELECT instance, callback_url FROM neodb_states WHERE state = ?",
  );
  const row = get.get(state) as any | undefined;
  const del = db.prepare("DELETE FROM neodb_states WHERE state = ?");
  del.run(state);
  if (!row) return null;
  return { instance: row.instance, callback_url: row.callback_url ?? null };
}

async function registerMastodonApp(base: URL, redirectUri: string): Promise<NeodbClient> {
  const body = new URLSearchParams();
  body.set("client_name", "Piecelet Online");
  body.set("redirect_uris", redirectUri);
  body.set("scopes", "read");
  // body.set("website", ""); // optional

  const resp = await fetch(`${base.origin}/api/v1/apps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });
  if (!resp.ok) {
    throw new Error("app_registration_failed");
  }
  const data = (await resp.json()) as any;
  const client_id = String(data.client_id);
  const client_secret = String(data.client_secret);
  if (!client_id || !client_secret) {
    throw new Error("invalid_app_response");
  }
  return {
    instance: base.origin,
    client_id,
    client_secret,
    redirect_uri: redirectUri,
  };
}

async function getOrCreateClient(base: URL, redirectUri: string): Promise<NeodbClient> {
  const existing = getClient(base.origin);
  if (existing && existing.redirect_uri === redirectUri) return existing;
  const c = await registerMastodonApp(base, redirectUri);
  saveClient(c);
  return c;
}

// Custom Better Auth plugin implementing NeoDB (Mastodon-compatible) OAuth
const neodbOAuthPlugin = {
  id: "neodb-oauth",
  endpoints: {
    neodbStart: createAuthEndpoint(
      "/neodb/start",
      { method: "GET" },
      async (ctx) => {
        const url = new URL(ctx.request!.url);
        const instanceRaw = url.searchParams.get("instance") || "";
        const callbackURL = url.searchParams.get("callbackURL") || "/";

        // Normalize and verify instance
        let instanceURL: URL;
        try {
          instanceURL = normalizeInstance(instanceRaw);
          await assertIsNeoDBInstance(instanceURL);
        } catch (e: any) {
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          target.searchParams.set("error", e?.message || "invalid_instance");
          throw ctx.redirect(target.toString());
        }

        const redirectUri = `${ctx.context.baseURL}/neodb/callback`;
        let client: NeodbClient;
        try {
          client = await getOrCreateClient(instanceURL, redirectUri);
        } catch (e: any) {
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          target.searchParams.set("error", e?.message || "app_registration_failed");
          throw ctx.redirect(target.toString());
        }

        // Generate state + PKCE and persist mapping
        const { state, codeVerifier } = await generateState(ctx);
        // Map state -> instance + callbackURL for the callback
        saveState(state, instanceURL.origin, callbackURL);
        const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);

        const authUrl = new URL(`${instanceURL.origin}/oauth/authorize`);
        authUrl.searchParams.set("client_id", client.client_id);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "read");
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("code_challenge_method", "S256");
        authUrl.searchParams.set("code_challenge", codeChallenge);
        // Include callbackURL in state verification payload already stored by generateState
        // We added `callbackURL` by passing it as query; generateState uses ctx.body?.callbackURL, so we carry it in URL and handle in callback via parseState
        // To ensure callbackURL is honored, we let generateState store default; then in callback we'll use parsed.callbackURL or fallback

        throw ctx.redirect(authUrl.toString());
      },
    ),
    neodbCallback: createAuthEndpoint(
      "/neodb/callback",
      { method: "GET" },
      async (ctx) => {
        const url = new URL(ctx.request!.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const state = url.searchParams.get("state") || "";

        const defaultErrorURL = ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`;
        if (error || !code) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", error || "oAuth_code_missing");
          throw ctx.redirect(target.toString());
        }

        // Retrieve state data and mapped instance
        const parsed = await parseState(ctx);
        const stateInfo = popState(state);
        if (!stateInfo) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "state_not_found");
          throw ctx.redirect(target.toString());
        }
        const instanceURL = new URL(stateInfo.instance);
        // Validate again defensively
        await assertIsNeoDBInstance(instanceURL);

        const redirectUri = `${ctx.context.baseURL}/neodb/callback`;
        const client = getClient(instanceURL.origin);
        if (!client) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "client_not_found");
          throw ctx.redirect(target.toString());
        }

        // Exchange code for token
        const body = new URLSearchParams();
        body.set("grant_type", "authorization_code");
        body.set("code", code);
        body.set("client_id", client.client_id);
        body.set("client_secret", client.client_secret);
        body.set("redirect_uri", redirectUri);
        if (parsed.codeVerifier) {
          body.set("code_verifier", parsed.codeVerifier);
        }
        const tokenResp = await fetch(`${instanceURL.origin}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: body.toString(),
        });
        if (!tokenResp.ok) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "oauth_code_verification_failed");
          throw ctx.redirect(target.toString());
        }
        const tokens = (await tokenResp.json()) as any;
        const accessToken: string | undefined = tokens.access_token;
        const refreshToken: string | undefined = tokens.refresh_token;
        const scope: string | undefined = tokens.scope;
        const expiresIn: number | undefined = tokens.expires_in;
        if (!accessToken) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "access_token_missing");
          throw ctx.redirect(target.toString());
        }

        // Fetch user info from NeoDB instance
        const meResp = await fetch(`${instanceURL.origin}/api/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!meResp.ok) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "user_info_failed");
          throw ctx.redirect(target.toString());
        }
        const me = (await meResp.json()) as any;

        const externalAcct: string | undefined = me?.external_acct || me?.externalAccount;
        const username: string | undefined = me?.username;
        const displayName: string | undefined = me?.display_name || username;
        const avatar: string | undefined = me?.avatar ?? undefined;
        const profileUrl: string | undefined = me?.url ?? undefined;

        // Derive a unique email-like identifier from external_acct or fallback
        const email = (externalAcct || (username ? `${username}@${instanceURL.host}` : null))?.toLowerCase();
        if (!email) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "email_not_found");
          throw ctx.redirect(target.toString());
        }
        const accountId = String(profileUrl || `${username}@${instanceURL.host}`);

        // Let Better Auth create/link the user and session
        const result = await handleOAuthUserInfo(ctx, {
          userInfo: {
            id: accountId,
            email,
            name: displayName || email,
            image: avatar,
            emailVerified: true,
          },
          account: {
            providerId: "neodb",
            accountId,
            accessToken,
            refreshToken,
            scope,
            // expiresIn not stored directly; Better Auth stores accessTokenExpiresAt via provider flows.
          },
          callbackURL: parsed.callbackURL || "/",
          overrideUserInfo: false,
        });

        if ((result as any).error) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", (result as any).error.split(" ").join("_"));
          throw ctx.redirect(target.toString());
        }

        const { session, user } = (result as any).data;
        // Set session cookie and redirect
        await setSessionCookie(ctx as any, { session, user });

        const inferredCallback = stateInfo.callback_url || parsed.callbackURL || "/";
        const to = (result as any).isRegister ? parsed.newUserURL || inferredCallback : inferredCallback;
        throw ctx.redirect(String(to));
      },
    ),
  },
} as const;

export const auth = betterAuth({
  // Disable email/password; NeoDB is the only login method
  emailAndPassword: {
    enabled: false,
  },

  // Use SQLite database
  database: db,

  // SvelteKit cookies plugin must be last
  plugins: [
    neodbOAuthPlugin,
    // Must be last to apply Set-Cookie headers to SvelteKit
    sveltekitCookies(getRequestEvent),
  ],
});
