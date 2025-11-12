import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "$lib/db";
import { neodbOAuthPlugin } from "$lib/neodb/plugin";
import { withCloudflare } from "better-auth-cloudflare";

// Single auth configuration that handles both CLI and runtime scenarios
function createAuth(env?: Cloudflare.Env, cf?: IncomingRequestCfProperties) {
    // Use actual DB for runtime, empty object for CLI
    const db = env ? drizzle(env.ACCOUNT_DATABASE, { schema, logger: true }) : ({} as any);

    const auth = betterAuth({
        ...withCloudflare(
            {
                autoDetectIpAddress: true,
                geolocationTracking: true,
                cf: cf || {},
                d1: env
                    ? {
                          db,
                          options: {
                              usePlural: true,
                              debugLogs: true,
                          },
                      }
                    : undefined,
                // kv: env?.ACCOUNT_KV,
            },{
      emailAndPassword: { enabled: false },
      database: db,
      plugins: [neodbOAuthPlugin, sveltekitCookies(getRequestEvent)],
        }),
        // Only add database adapter for CLI schema generation
        ...(env
            ? {}
            : {
                  database: drizzleAdapter({} as D1Database, {
                      provider: "sqlite",
                      usePlural: true,
                      debugLogs: true
                  }),
              }),
    });

    return auth
}

// Export for CLI schema generation
export const auth = createAuth();

// Export for runtime usage
export { createAuth };
