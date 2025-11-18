import { createAuthEndpoint, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { generateState, parseState, handleOAuthUserInfo } from "better-auth/oauth2";
import { setSessionCookie } from "better-auth/cookies";
import type { BetterAuthPlugin } from "better-auth";

import { assertIsNeoDBInstance, normalizeInstance, pkceChallengeFromVerifier, extractNeoDBUserInfo } from "./util";
import { getOrCreateClient, buildAuthorizeUrl, exchangeToken, fetchMe, revokeToken } from "./mastodon";
import type { NeoDBMe, AuthResultData } from "./types";
import { getClient, popState, saveState } from "./store";
import { fetchNeoDBShelf, fetchNeoDBMarks, fetchNeoDBItem, fetchNeoDBStats } from "./client";

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

        // Ensure isAccessTokenRedacted is reset to false on successful login
        // This handles both new accounts and re-login scenarios
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
            },
          });
        } catch (e) {
          console.error("[NeoDB Plugin] Failed to reset isAccessTokenRedacted flag:", e);
          // Don't throw - login was successful, this is just cleanup
        }

        const inferredCallback = stateInfo.callbackUrl || parsed.callbackURL || "/";
        const isRegister = Boolean((result as { isRegister?: boolean }).isRegister);
        const to = isRegister ? parsed.newUserURL || inferredCallback : inferredCallback;
        throw ctx.redirect(String(to));
      },
    ),
    // NeoDB API Proxy Endpoints
    neodbApiShelf: createAuthEndpoint(
      "/neodb/api/shelf",
      { method: "GET" },
      async (ctx) => {
        const session = await getSessionFromCtx(ctx);
        if (!session?.user?.id) {
          return ctx.json({ error: "Unauthorized" }, 401);
        }

        const adapter = ctx.context.adapter;
        if (!adapter) {
          return ctx.json({ error: "Database unavailable" }, 500);
        }

        try {
          // Find user's NeoDB account
          const account = await adapter.findOne<{
            id: string;
            userId: string;
            providerId: string;
            accessToken: string | null;
            instance: string | null;
            isAccessTokenRedacted: boolean | null;
          }>({
            model: "account",
            where: [
              { field: "userId", value: session.user.id },
              { field: "providerId", value: "neodb" },
            ],
          });

          if (!account) {
            return ctx.json({ error: "NeoDB account not connected" }, 404);
          }

          if (!account.accessToken || account.isAccessTokenRedacted) {
            return ctx.json({ error: "NeoDB access token not available" }, 401);
          }

          if (!account.instance) {
            return ctx.json({ error: "NeoDB instance not found" }, 500);
          }

          const url = new URL(ctx.request!.url);
          const category = url.searchParams.get("category") || undefined;

          const data = await fetchNeoDBShelf(account.instance, account.accessToken, category);
          return ctx.json(data);
        } catch (error) {
          console.error("[NeoDB API Proxy] Shelf fetch error:", error);
          return ctx.json({ error: "Failed to fetch shelf data" }, 500);
        }
      },
    ),
    neodbApiMarks: createAuthEndpoint(
      "/neodb/api/marks",
      { method: "GET" },
      async (ctx) => {
        const session = await getSessionFromCtx(ctx);
        if (!session?.user?.id) {
          return ctx.json({ error: "Unauthorized" }, 401);
        }

        const adapter = ctx.context.adapter;
        if (!adapter) {
          return ctx.json({ error: "Database unavailable" }, 500);
        }

        try {
          const account = await adapter.findOne<{
            id: string;
            userId: string;
            providerId: string;
            accessToken: string | null;
            instance: string | null;
            isAccessTokenRedacted: boolean | null;
          }>({
            model: "account",
            where: [
              { field: "userId", value: session.user.id },
              { field: "providerId", value: "neodb" },
            ],
          });

          if (!account) {
            return ctx.json({ error: "NeoDB account not connected" }, 404);
          }

          if (!account.accessToken || account.isAccessTokenRedacted) {
            return ctx.json({ error: "NeoDB access token not available" }, 401);
          }

          if (!account.instance) {
            return ctx.json({ error: "NeoDB instance not found" }, 500);
          }

          const url = new URL(ctx.request!.url);
          const filters: any = {};

          const year = url.searchParams.get("year");
          if (year) filters.year = parseInt(year);

          const category = url.searchParams.get("category");
          if (category) filters.category = category;

          const limit = url.searchParams.get("limit");
          if (limit) filters.limit = parseInt(limit);

          const offset = url.searchParams.get("offset");
          if (offset) filters.offset = parseInt(offset);

          const data = await fetchNeoDBMarks(account.instance, account.accessToken, filters);
          return ctx.json(data);
        } catch (error) {
          console.error("[NeoDB API Proxy] Marks fetch error:", error);
          return ctx.json({ error: "Failed to fetch marks data" }, 500);
        }
      },
    ),
    neodbApiItem: createAuthEndpoint(
      "/neodb/api/item/:id",
      { method: "GET" },
      async (ctx) => {
        const session = await getSessionFromCtx(ctx);
        if (!session?.user?.id) {
          return ctx.json({ error: "Unauthorized" }, 401);
        }

        const adapter = ctx.context.adapter;
        if (!adapter) {
          return ctx.json({ error: "Database unavailable" }, 500);
        }

        try {
          const account = await adapter.findOne<{
            id: string;
            userId: string;
            providerId: string;
            accessToken: string | null;
            instance: string | null;
            isAccessTokenRedacted: boolean | null;
          }>({
            model: "account",
            where: [
              { field: "userId", value: session.user.id },
              { field: "providerId", value: "neodb" },
            ],
          });

          if (!account) {
            return ctx.json({ error: "NeoDB account not connected" }, 404);
          }

          if (!account.accessToken || account.isAccessTokenRedacted) {
            return ctx.json({ error: "NeoDB access token not available" }, 401);
          }

          if (!account.instance) {
            return ctx.json({ error: "NeoDB instance not found" }, 500);
          }

          // Get item ID from path parameter
          const url = new URL(ctx.request!.url);
          const pathParts = url.pathname.split("/");
          const itemId = pathParts[pathParts.length - 1];

          if (!itemId) {
            return ctx.json({ error: "Item ID required" }, 400);
          }

          const data = await fetchNeoDBItem(account.instance, account.accessToken, itemId);
          return ctx.json(data);
        } catch (error) {
          console.error("[NeoDB API Proxy] Item fetch error:", error);
          return ctx.json({ error: "Failed to fetch item data" }, 500);
        }
      },
    ),
    neodbApiStats: createAuthEndpoint(
      "/neodb/api/stats",
      { method: "GET" },
      async (ctx) => {
        const session = await getSessionFromCtx(ctx);
        if (!session?.user?.id) {
          return ctx.json({ error: "Unauthorized" }, 401);
        }

        const adapter = ctx.context.adapter;
        if (!adapter) {
          return ctx.json({ error: "Database unavailable" }, 500);
        }

        try {
          const account = await adapter.findOne<{
            id: string;
            userId: string;
            providerId: string;
            accessToken: string | null;
            instance: string | null;
            isAccessTokenRedacted: boolean | null;
          }>({
            model: "account",
            where: [
              { field: "userId", value: session.user.id },
              { field: "providerId", value: "neodb" },
            ],
          });

          if (!account) {
            return ctx.json({ error: "NeoDB account not connected" }, 404);
          }

          if (!account.accessToken || account.isAccessTokenRedacted) {
            return ctx.json({ error: "NeoDB access token not available" }, 401);
          }

          if (!account.instance) {
            return ctx.json({ error: "NeoDB instance not found" }, 500);
          }

          const data = await fetchNeoDBStats(account.instance, account.accessToken);
          return ctx.json(data);
        } catch (error) {
          console.error("[NeoDB API Proxy] Stats fetch error:", error);
          return ctx.json({ error: "Failed to fetch stats data" }, 500);
        }
      },
    ),
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
