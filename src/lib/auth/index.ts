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
    console.log('[auth] createAuth called', { hasEnv: !!env, hasCf: !!cf });

    // For runtime with Cloudflare env
    if (env) {
        const db = drizzle(env.ACCOUNT_DATABASE, { schema, logger: true });
        console.log('[auth] Using runtime Cloudflare configuration with D1');

        const auth = betterAuth(
            withCloudflare(
                {
                    autoDetectIpAddress: true,
                    geolocationTracking: true,
                    cf: cf || {},
                    d1: {
                        db,
                        options: {
                            usePlural: true,
                            debugLogs: true,
                        },
                    },
                    // kv: env?.ACCOUNT_KV,
                },
                {
                    emailAndPassword: { enabled: false },
                    plugins: [neodbOAuthPlugin, sveltekitCookies(getRequestEvent)],
                }
            )
        );

        return auth;
    }

    // For CLI schema generation
    console.log('[auth] Using CLI configuration with empty adapter');
    const auth = betterAuth({
        emailAndPassword: { enabled: false },
        database: drizzleAdapter({} as D1Database, {
            provider: "sqlite",
            usePlural: true,
            debugLogs: true,
        }),
        plugins: [neodbOAuthPlugin, sveltekitCookies(getRequestEvent)],
    });

    return auth;
}

// Export for CLI schema generation
export const auth = createAuth();

// Export for runtime usage
export { createAuth };
