import type { NeoDBClient, OAuthTokenResponse, NeoDBMe } from "./types";
import { saveClient, getClient } from "./store";
import type { Adapter } from "better-auth";
import { parseNeodbMe } from "./util";

export async function registerMastodonApp(base: URL, redirectUri: string): Promise<NeoDBClient> {
  const body = new URLSearchParams();
  body.set("client_name", "Piecelet Online");
  body.set("redirect_uris", redirectUri);
  body.set("scopes", "read");

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
  const data = (await resp.json().catch(() => null)) as unknown;
  if (!data || typeof data !== "object") {
    throw new Error("invalid_app_response");
  }
  const r = data as Record<string, unknown>;
  const client_id = typeof r.client_id === "string" ? r.client_id : undefined;
  const client_secret = typeof r.client_secret === "string" ? r.client_secret : undefined;
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

export async function getOrCreateClient(adapter: Adapter, base: URL, redirectUri: string): Promise<NeoDBClient> {
  const existing = await getClient(adapter, base.origin);
  if (existing && existing.redirect_uri === redirectUri) return existing;
  const c = await registerMastodonApp(base, redirectUri);
  await saveClient(adapter, c);
  return c;
}

export function buildAuthorizeUrl(instanceOrigin: string, clientId: string, redirectUri: string, state: string, codeChallenge: string): string {
  const authUrl = new URL(`${instanceOrigin}/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "read");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);
  return authUrl.toString();
}

export async function exchangeToken(instanceOrigin: string, client: NeoDBClient, code: string, redirectUri: string, codeVerifier?: string): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("client_id", client.client_id);
  body.set("client_secret", client.client_secret);
  body.set("redirect_uri", redirectUri);
  if (codeVerifier) body.set("code_verifier", codeVerifier);

  const tokenResp = await fetch(`${instanceOrigin}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });
  if (!tokenResp.ok) {
    throw new Error("oauth_code_verification_failed");
  }
  const tokens = (await tokenResp.json().catch(() => null)) as unknown;
  const r = (tokens && typeof tokens === "object" ? tokens : {}) as Record<string, unknown>;
  return {
    access_token: typeof r.access_token === "string" ? r.access_token : undefined,
    refresh_token: typeof r.refresh_token === "string" ? r.refresh_token : undefined,
    scope: typeof r.scope === "string" ? r.scope : undefined,
    expires_in: typeof r.expires_in === "number" ? r.expires_in : undefined,
    token_type: typeof r.token_type === "string" ? r.token_type : undefined,
    created_at: typeof r.created_at === "number" ? r.created_at : undefined,
  };
}

export async function fetchMe(instanceOrigin: string, accessToken: string): Promise<NeoDBMe> {
  const meResp = await fetch(`${instanceOrigin}/api/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meResp.ok) {
    throw new Error("user_info_failed");
  }
  const me = (await meResp.json().catch(() => null)) as unknown;
  return parseNeodbMe(me);
}
