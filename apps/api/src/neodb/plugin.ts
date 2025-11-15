import { createAuthEndpoint, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { generateState, parseState, handleOAuthUserInfo } from "better-auth/oauth2";
import { setSessionCookie } from "better-auth/cookies";
import type { BetterAuthPlugin } from "better-auth";

import { assertIsNeoDBInstance, normalizeInstance, pkceChallengeFromVerifier, extractNeoDBUserInfo } from "./util";
import { getOrCreateClient, buildAuthorizeUrl, exchangeToken, fetchMe, revokeToken } from "./mastodon";
import type { NeoDBMe, AuthResultData } from "./types";
import { getClient, popState, saveState } from "./store";

function buildAccountId(me: NeoDBMe, instanceHost: string): string {
  if (me.url) return String(me.url);
  if (me.username) return `@${me.username}@${instanceHost}`;
  return `@unknown@${instanceHost}`;
}

export const neodbOAuthPlugin = {
  id: "neodb-oauth",
  schema: {
    // Extend the User model with externalAcct to store NeoDB external account handle
    user: {
      fields: {
        externalAcct: {
          type: "string",
          required: false,
          // ensure it's persisted and can be selected in outputs
          returned: true,
        },
      },
    },
    neodbClient: {
      fields: {
        instance: {
          type: "string",
          required: true,
          unique: true,
          returned: true,
        },
        clientId: {
          type: "string",
          required: true,
          returned: false,
        },
        clientSecret: {
          type: "string",
          required: true,
          returned: false,
        },
        redirectUri: {
          type: "string",
          required: true,
          returned: true,
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

        const adapter = ctx.context.adapter;
        if (!adapter) {
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          target.searchParams.set("error", "database_unavailable");
          throw ctx.redirect(target.toString());
        }

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
          client = await getOrCreateClient(adapter, instanceURL, redirectUri);
        } catch (e: unknown) {
          const target = new URL(ctx.context.options.onAPIError?.errorURL || `${ctx.context.baseURL}/error`);
          const message = e instanceof Error ? e.message : "app_registration_failed";
          target.searchParams.set("error", message);
          throw ctx.redirect(target.toString());
        }

        const { state, codeVerifier } = await generateState(ctx);
        await saveState(adapter, state, instanceURL.origin, callbackURL);
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
          // Persist dedicated externalAcct field; do not misuse displayUsername
          userInfo: {
            id: String(accountId),
            email: userInfo.email,
            name: userInfo.displayName,
            image: userInfo.avatar,
            emailVerified: false,
            // Save NeoDB handle as username (per types.ts format)
            username: userInfo.username,
            externalAcct: userInfo.externalAcct,
          } as any,
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
  hooks: {
    before: [
      {
        matcher: (context) => {
          const isMatch = context.path === "/sign-out";
          console.log("[NeoDB Plugin] Hook matcher called - path:", context.path, "matches:", isMatch);
          return isMatch;
        },
        handler: createAuthMiddleware(async (ctx) => {
          console.log("[NeoDB Plugin] Sign-out hook handler triggered");

          const adapter = ctx.context.adapter;
          if (!adapter) {
            console.log("[NeoDB Plugin] No adapter available, skipping");
            return;
          }

          // Get session using Better Auth's official API
          const session = await getSessionFromCtx(ctx);

          console.log("[NeoDB Plugin] Session info:", {
            hasSession: !!session,
            userId: session?.user?.id
          });

          if (!session?.user?.id) {
            console.log("[NeoDB Plugin] No session or user ID found, skipping");
            return;
          }

          try {
            // Find all NeoDB accounts for this user
            console.log("[NeoDB Plugin] Looking for NeoDB accounts for user:", session.user.id);
            const accounts = await adapter.findMany<{
              id: string;
              userId: string;
              providerId: string;
              accountId: string;
              accessToken: string | null;
              refreshToken: string | null;
            }>({
              model: "account",
              where: [
                { field: "userId", value: session.user.id },
                { field: "providerId", value: "neodb" },
              ],
            });

            console.log("[NeoDB Plugin] Found accounts:", accounts?.length || 0);

            if (!accounts || accounts.length === 0) {
              console.log("[NeoDB Plugin] No NeoDB accounts found for user");
              return;
            }

            // Process each NeoDB account
            for (const account of accounts) {
              console.log("[NeoDB Plugin] Processing account:", {
                id: account.id,
                accountId: account.accountId,
                hasAccessToken: !!account.accessToken,
                isRedacted: account.accessToken?.startsWith("ACCESS_TOKEN_REDACTED_AT_")
              });

              if (!account.accessToken || account.accessToken.startsWith("ACCESS_TOKEN_REDACTED_AT_")) {
                console.log("[NeoDB Plugin] Skipping account - no token or already redacted");
                continue;
              }

              // Extract instance from accountId (format: url or @username@instance)
              let instanceOrigin: string;
              try {
                if (account.accountId.startsWith("http")) {
                  const url = new URL(account.accountId);
                  instanceOrigin = url.origin;
                } else if (account.accountId.includes("@")) {
                  // Format: @username@instance
                  const parts = account.accountId.split("@").filter(Boolean);
                  if (parts.length >= 2) {
                    instanceOrigin = `https://${parts[parts.length - 1]}`;
                  } else {
                    console.log("[NeoDB Plugin] Invalid accountId format (not enough @ parts):", account.accountId);
                    continue;
                  }
                } else {
                  console.log("[NeoDB Plugin] Invalid accountId format (no @ or http):", account.accountId);
                  continue;
                }
                console.log("[NeoDB Plugin] Extracted instance origin:", instanceOrigin);
              } catch (e) {
                console.error("[NeoDB Plugin] Failed to parse accountId:", account.accountId, e);
                continue;
              }

              // Get the NeoDB client for this instance
              const client = await getClient(adapter, instanceOrigin);
              if (!client) {
                console.log("[NeoDB Plugin] No client found for instance:", instanceOrigin);
                continue;
              }
              console.log("[NeoDB Plugin] Found client for instance:", instanceOrigin);

              // Revoke the token from NeoDB
              try {
                console.log("[NeoDB Plugin] Attempting to revoke token at:", instanceOrigin);
                await revokeToken(instanceOrigin, client, account.accessToken);
                console.log("[NeoDB Plugin] Successfully revoked token");
              } catch (e) {
                console.error("[NeoDB Plugin] Failed to revoke NeoDB token:", e);
                // Continue even if revocation fails
              }

              // Update the access token in the database (in account table)
              const timestamp = new Date().toISOString();
              console.log("[NeoDB Plugin] Updating access token to redacted for account:", account.id);
              await adapter.update({
                model: "account",
                where: [{ field: "id", value: account.id }],
                update: {
                  accessToken: `ACCESS_TOKEN_REDACTED_AT_${timestamp}`,
                },
              });
              console.log("[NeoDB Plugin] Successfully updated access token to redacted");
            }
          } catch (error) {
            console.error("[NeoDB Plugin] Error in NeoDB sign-out hook:", error);
            // Don't throw - let sign-out proceed even if token revocation fails
          }

          console.log("[NeoDB Plugin] Sign-out hook completed");
          // Return to continue with normal sign-out flow
          return;
        }),
      },
    ],
  },
} satisfies BetterAuthPlugin;
