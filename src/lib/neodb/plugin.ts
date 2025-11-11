import { createAuthEndpoint } from "better-auth/api";
import { generateState, parseState, handleOAuthUserInfo } from "better-auth/oauth2";
import { setSessionCookie } from "better-auth/cookies";

import { assertIsNeoDBInstance, normalizeInstance, pkceChallengeFromVerifier } from "./util";
import { getOrCreateClient, buildAuthorizeUrl, exchangeToken, fetchMe } from "./mastodon";
import { saveState, popState, getClient } from "./store";
import type { NeoDBMe, AuthResultData } from "./types";

function buildEmailLike(me: NeoDBMe, instanceHost: string): string | null {
  if (me.external_acct) return me.external_acct.toLowerCase();
  if (me.username) return `${me.username}@${instanceHost}`.toLowerCase();
  return null;
}

function buildAccountId(me: NeoDBMe, instanceHost: string): string {
  if (me.url) return String(me.url);
  if (me.username) return `${me.username}@${instanceHost}`;
  return instanceHost;
}

export const neodbOAuthPlugin = {
  id: "neodb-oauth",
  endpoints: {
    neodbStart: createAuthEndpoint(
      "/neodb/start",
      { method: "GET" },
      async (ctx) => {
        const url = new URL(ctx.request!.url);
        const instanceRaw = url.searchParams.get("instance") || "";
        const callbackURL = url.searchParams.get("callbackURL") || "/";

        let instanceURL: URL;
        try {
          instanceURL = normalizeInstance(instanceRaw);
          await assertIsNeoDBInstance(instanceURL);
        } catch (e: unknown) {
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          const message = e instanceof Error ? e.message : "invalid_instance";
          target.searchParams.set("error", message);
          throw ctx.redirect(target.toString());
        }

        const redirectUri = `${ctx.context.baseURL}/neodb/callback`;
        let client;
        try {
          client = await getOrCreateClient(instanceURL, redirectUri);
        } catch (e: unknown) {
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          const message = e instanceof Error ? e.message : "app_registration_failed";
          target.searchParams.set("error", message);
          throw ctx.redirect(target.toString());
        }

        const { state, codeVerifier } = await generateState(ctx);
        saveState(state, instanceURL.origin, callbackURL);
        const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);

        const urlStr = buildAuthorizeUrl(instanceURL.origin, client.client_id, redirectUri, state, codeChallenge);
        throw ctx.redirect(urlStr);
      },
    ),
    neodbCallback: createAuthEndpoint(
      "/neodb/callback",
      { method: "GET" },
      async (ctx) => {
        const url = new URL(ctx.request!.url);
        const code = url.searchParams.get("code");
        const err = url.searchParams.get("error");
        const state = url.searchParams.get("state") || "";

        const defaultErrorURL = ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`;
        if (err || !code) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", err || "oAuth_code_missing");
          throw ctx.redirect(target.toString());
        }

        const parsed = await parseState(ctx);
        const stateInfo = popState(state);
        if (!stateInfo) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "state_not_found");
          throw ctx.redirect(target.toString());
        }
        const instanceURL = new URL(stateInfo.instance);
        try {
          await assertIsNeoDBInstance(instanceURL);
        } catch (e: unknown) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "invalid_instance");
          throw ctx.redirect(target.toString());
        }

        const redirectUri = `${ctx.context.baseURL}/neodb/callback`;
        const client = getClient(instanceURL.origin);
        if (!client) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "client_not_found");
          throw ctx.redirect(target.toString());
        }

        let tokens;
        try {
          tokens = await exchangeToken(instanceURL.origin, client, code, redirectUri, parsed.codeVerifier);
        } catch (e: unknown) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "oauth_code_verification_failed");
          throw ctx.redirect(target.toString());
        }
        if (!tokens.access_token) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "access_token_missing");
          throw ctx.redirect(target.toString());
        }

        let me: NeoDBMe;
        try {
          me = await fetchMe(instanceURL.origin, tokens.access_token);
        } catch (e: unknown) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "user_info_failed");
          throw ctx.redirect(target.toString());
        }

        const email = buildEmailLike(me, instanceURL.host);
        if (!email) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "email_not_found");
          throw ctx.redirect(target.toString());
        }
        const accountId = buildAccountId(me, instanceURL.host);
        const name = me.display_name || email;
        const image = me.avatar;

        const result = await handleOAuthUserInfo(ctx, {
          userInfo: {
            id: String(accountId),
            email,
            name,
            image,
            emailVerified: true,
          },
          account: {
            providerId: "neodb",
            accountId: String(accountId),
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            scope: tokens.scope,
          },
          callbackURL: parsed.callbackURL || "/",
          overrideUserInfo: false,
        });

        if ((result as { error: unknown }).error) {
          const target = new URL(defaultErrorURL);
          const msg = String((result as { error: unknown }).error || "unknown_error").split(" ").join("_");
          target.searchParams.set("error", msg);
          throw ctx.redirect(target.toString());
        }

        const data = (result as { data: AuthResultData }).data;
        const cookieCtx = ctx as unknown as Parameters<typeof setSessionCookie>[0];
        await setSessionCookie(cookieCtx, { session: data.session, user: data.user });

        const inferredCallback = stateInfo.callback_url || parsed.callbackURL || "/";
        const isRegister = Boolean((result as { isRegister?: boolean }).isRegister);
        const to = isRegister ? parsed.newUserURL || inferredCallback : inferredCallback;
        throw ctx.redirect(String(to));
      },
    ),
  },
} as const;
