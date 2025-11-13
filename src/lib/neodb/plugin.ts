import { createAuthEndpoint } from "better-auth/api";
import { generateState, parseState, handleOAuthUserInfo } from "better-auth/oauth2";
import { setSessionCookie } from "better-auth/cookies";
import type { BetterAuthPlugin } from "better-auth";

import { assertIsNeoDBInstance, normalizeInstance, pkceChallengeFromVerifier, extractNeoDBUserInfo } from "./util";
import { getOrCreateClient, buildAuthorizeUrl, exchangeToken, fetchMe } from "./mastodon";
import { saveState, popState, getClient } from "./store";
import type { NeoDBMe, AuthResultData } from "./types";

function buildAccountId(me: NeoDBMe, instanceHost: string): string {
  if (me.url) return String(me.url);
  if (me.username) return `@${me.username}@${instanceHost}`;
  return `@unknown@${instanceHost}`;
}

export const neodbOAuthPlugin = {
  id: "neodb-oauth",
  schema: {
    neodbClient: {
      fields: {
        instance: {
          type: "string",
          required: true,
          unique: true,
        },
        clientId: {
          type: "string",
          required: true,
        },
        clientSecret: {
          type: "string",
          required: true,
        },
        redirectUri: {
          type: "string",
          required: true,
        },
        createdAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
        updatedAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
          onUpdate: (() => /* @__PURE__ */ new Date())
        },
      },
    },
    neodbState: {
      fields: {
        state: {
          type: "string",
          required: true,
          unique: true,
        },
        instance: {
          type: "string",
          required: true,
        },
        callbackUrl: {
          type: "string",
          required: false,
        },
        createdAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
        updatedAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
          onUpdate: (() => /* @__PURE__ */ new Date())
        },
      },
    },
  },
  endpoints: {
    neodbStart: createAuthEndpoint(
      "/neodb/start",
      { method: "GET" },
      async (ctx) => {
        const url = new URL(ctx.request!.url);
        const instanceRaw = url.searchParams.get("instance") || "";
        const callbackURL = url.searchParams.get("callbackURL") || "/";

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[neodb] /neodb/start endpoint called');
        console.log('[neodb] Instance:', instanceRaw);
        console.log('[neodb] Callback URL:', callbackURL);

        const adapter = ctx.context.adapter;
        if (!adapter) {
          console.error('[neodb] ❌ ERROR: Database adapter unavailable');
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          target.searchParams.set("error", "database_unavailable");
          throw ctx.redirect(target.toString());
        }
        console.log('[neodb] ✓ Database adapter available');

        let instanceURL: URL;
        try {
          instanceURL = normalizeInstance(instanceRaw);
          console.log('[neodb] Normalized instance URL:', instanceURL.origin);
          await assertIsNeoDBInstance(instanceURL);
          console.log('[neodb] ✓ Instance validation passed');
        } catch (e: unknown) {
          console.error('[neodb] ❌ ERROR: Instance validation failed:', e);
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          const message = e instanceof Error ? e.message : "invalid_instance";
          target.searchParams.set("error", message);
          throw ctx.redirect(target.toString());
        }

        const redirectUri = `${ctx.context.baseURL}/neodb/callback`;
        console.log('[neodb] Redirect URI:', redirectUri);

        let client;
        try {
          console.log('[neodb] Getting or creating OAuth client...');
          client = await getOrCreateClient(adapter, instanceURL, redirectUri);
          console.log('[neodb] ✓ Client obtained successfully');
        } catch (e: unknown) {
          console.error('[neodb] ❌ ERROR: getOrCreateClient failed');
          console.error('[neodb] Error details:', e);
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          const message = e instanceof Error ? e.message : "app_registration_failed";
          target.searchParams.set("error", message);
          throw ctx.redirect(target.toString());
        }

        console.log('[neodb] Generating OAuth state...');
        const { state, codeVerifier } = await generateState(ctx);
        await saveState(adapter, state, instanceURL.origin, callbackURL);
        const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
        console.log('[neodb] ✓ State saved');

        const urlStr = buildAuthorizeUrl(instanceURL.origin, client.client_id, redirectUri, state, codeChallenge);
        console.log('[neodb] ✓ Redirecting to authorization URL');
        console.log('[neodb] Target:', urlStr);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

        const adapter = ctx.context.adapter;
        if (!adapter) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "database_unavailable");
          throw ctx.redirect(target.toString());
        }

        const parsed = await parseState(ctx);
        const stateInfo = await popState(adapter, state);
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
        const client = await getClient(adapter, instanceURL.origin);
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

        // Extract user info using the new function
        const userInfo = extractNeoDBUserInfo(me, instanceURL.host);
        if (!userInfo) {
          const target = new URL(defaultErrorURL);
          target.searchParams.set("error", "email_not_found");
          throw ctx.redirect(target.toString());
        }

        const accountId = buildAccountId(me, instanceURL.host);

        const result = await handleOAuthUserInfo(ctx, {
          userInfo: {
            id: String(accountId),
            email: userInfo.email,
            name: userInfo.displayName,
            image: userInfo.avatar,
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

        const inferredCallback = stateInfo.callbackUrl || parsed.callbackURL || "/";
        const isRegister = Boolean((result as { isRegister?: boolean }).isRegister);
        const to = isRegister ? parsed.newUserURL || inferredCallback : inferredCallback;
        throw ctx.redirect(String(to));
      },
    ),
  },
} satisfies BetterAuthPlugin;
