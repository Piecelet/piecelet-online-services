import { createAuthEndpoint, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { generateState, parseState, handleOAuthUserInfo } from "better-auth/oauth2";
import { setSessionCookie } from "better-auth/cookies";
import type { BetterAuthPlugin } from "better-auth";

import { assertIsNeoDBInstance, normalizeInstance, pkceChallengeFromVerifier, extractNeoDBUserInfo } from "@/neodb/util";
import { getOrCreateClient, buildAuthorizeUrl, exchangeToken, fetchMe, revokeToken } from "@/neodb/mastodon";
import type { NeoDBMe, AuthResultData } from "@/neodb/types";
import { getClient, popState, saveState } from "@/neodb/store";
import { fetchNeoDBShelf, fetchNeoDBMarks, fetchNeoDBItem, fetchNeoDBStats } from "@/neodb/client";

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
        realEmail: {
          type: "string",
          required: false,
          // Store the original email address (without instance suffix)
          returned: true,
        },
      },
    },
    // Extend the Account model to track token revocation status
    account: {
      fields: {
        isAccessTokenRedacted: {
          type: "boolean",
          required: false,
          defaultValue: () => false,
          returned: true,
        },
        instance: {
          type: "string",
          required: false,
          // Store NeoDB instance domain (e.g., "neodb.social")
          returned: true,
        },
        tokenRevealedAt: {
          type: "date",
          required: false,
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
            // email: Store with instance suffix to ensure uniqueness
            email: `${userInfo.email}+${instanceURL.host}`,
            name: userInfo.displayName,
            image: userInfo.avatar,
            emailVerified: false,
            // Save NeoDB handle as username (per types.ts format)
            username: userInfo.username,
            externalAcct: userInfo.externalAcct,
            // realEmail: Store original email without instance suffix
            realEmail: userInfo.email,
          } as any,
          account: {
            providerId: "neodb",
            accountId: String(accountId),
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            scope: tokens.scope,
            // Reset redacted flag when user logs in with new token
            isAccessTokenRedacted: false,
            // instance: Store NeoDB instance domain
            instance: instanceURL.host,
          } as any,
          callbackURL: parsed.callbackURL || "/",
          // Always update user info on login to sync latest changes from NeoDB
          overrideUserInfo: true,
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

        // Update account with custom fields that Better Auth doesn't handle automatically
        // This ensures instance and isAccessTokenRedacted are always up-to-date
        try {
          await adapter.update({
            model: "account",
            where: [
              { field: "userId", value: data.user.id },
              { field: "providerId", value: "neodb" },
              { field: "accountId", value: String(accountId) },
            ],
            update: {
              isAccessTokenRedacted: false,
              instance: instanceURL.host,  // Ensure instance is always set
            },
          });
        } catch (e) {
          console.error("[NeoDB Plugin] Failed to update account custom fields:", e);
          // Don't throw - login was successful, this is just cleanup
        }

        const inferredCallback = stateInfo.callbackUrl || parsed.callbackURL || "/";
        const isRegister = Boolean((result as { isRegister?: boolean }).isRegister);
        const to = isRegister ? parsed.newUserURL || inferredCallback : inferredCallback;
        throw ctx.redirect(String(to));
      },
    ),
    neodbRevealToken: createAuthEndpoint(
      "/neodb/token/reveal",
      { method: "GET" },
      async (ctx) => {
        const session = await getSessionFromCtx(ctx);
        if (!session?.user?.id) {
          return ctx.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adapter = ctx.context.adapter;
        if (!adapter) {
          return ctx.json({ error: "Database unavailable" }, { status: 503 });
        }

        // Find NeoDB account
        const accounts = await adapter.findMany<{
          id: string;
          userId: string;
          providerId: string;
          accessToken: string | null;
          tokenRevealedAt: Date | null;
        }>({
          model: "account",
          where: [
            { field: "userId", value: session.user.id },
            { field: "providerId", value: "neodb" },
          ],
        });

        const account = accounts?.[0];
        if (!account || !account.accessToken) {
          return ctx.json({ error: "No NeoDB account found" }, { status: 404 });
        }

        const now = new Date();
        const revealedAt = account.tokenRevealedAt ? new Date(account.tokenRevealedAt) : null;

        // If never revealed, set timestamp and return token
        if (!revealedAt) {
          await adapter.update({
            model: "account",
            where: [{ field: "id", value: account.id }],
            update: { tokenRevealedAt: now },
          });
          return ctx.json({ accessToken: account.accessToken });
        }

        // If revealed, check if within 5 minutes
        const diffMs = now.getTime() - revealedAt.getTime();
        const fiveMinutesMs = 5 * 60 * 1000;

        if (diffMs <= fiveMinutesMs) {
          return ctx.json({ accessToken: account.accessToken });
        }

        // If > 5 minutes, deny access
        return ctx.json({
          error: "re_authentication_required",
          message: "Access token reveal window expired. Please sign in again to get a new token.",
        }, { status: 403 });
      },
    ),
    // Note: NeoDB API Proxy (/neodb/api/*) is implemented as a Hono route in src/index.ts
    // instead of a plugin endpoint due to Better Auth's wildcard routing limitations.
    // See src/neodb/proxy.ts for the secure implementation.
  },
  hooks: {
    before: [
      {
        matcher: (context) => context.path === "/sign-out",
        handler: createAuthMiddleware(async (ctx) => {
          const adapter = ctx.context.adapter;
          if (!adapter) {
            return;
          }

          // Get session using Better Auth's official API
          const session = await getSessionFromCtx(ctx);

          if (!session?.user?.id) {
            return;
          }

          try {
            // Find all NeoDB accounts for this user
            const accounts = await adapter.findMany<{
              id: string;
              userId: string;
              providerId: string;
              accountId: string;
              accessToken: string | null;
              refreshToken: string | null;
              isAccessTokenRedacted: boolean | null;
            }>({
              model: "account",
              where: [
                { field: "userId", value: session.user.id },
                { field: "providerId", value: "neodb" },
              ],
            });

            if (!accounts || accounts.length === 0) {
              return;
            }

            // Process each NeoDB account
            for (const account of accounts) {
              if (!account.accessToken || account.isAccessTokenRedacted) {
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
                    continue;
                  }
                } else {
                  continue;
                }
              } catch (e) {
                console.error("[NeoDB Plugin] Failed to parse accountId:", account.accountId, e);
                continue;
              }

              // Get the NeoDB client for this instance
              const client = await getClient(adapter, instanceOrigin);
              if (!client) {
                continue;
              }

              // Revoke the token from NeoDB
              try {
                await revokeToken(instanceOrigin, client, account.accessToken);
              } catch (e) {
                console.error("[NeoDB Plugin] Failed to revoke NeoDB token:", e);
                // Continue even if revocation fails
              }

              // Update the access token in the database (in account table)
              const timestamp = new Date().toISOString();
              await adapter.update({
                model: "account",
                where: [{ field: "id", value: account.id }],
                update: {
                  accessToken: `ACCESS_TOKEN_REDACTED_AT_${timestamp}`,
                  isAccessTokenRedacted: true,
                },
              });
            }
          } catch (error) {
            console.error("[NeoDB Plugin] Error in sign-out hook:", error);
            // Don't throw - let sign-out proceed even if token revocation fails
          }

          // Continue with normal sign-out flow
          return;
        }),
      },
    ],
  },
} satisfies BetterAuthPlugin;
