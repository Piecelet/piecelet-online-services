import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";

// Placeholder interfaces for Cloudflare environment bindings and CF properties.
// Fill these with your actual types/bindings when deploying on Cloudflare.
export interface CloudflareBindings {
  DATABASE: unknown; // D1 binding
  KV?: unknown; // KV namespace (optional)
  R2_BUCKET?: unknown; // R2 bucket (optional)
}

export interface CloudflareCfProperties {
  // e.g. colo, city, country, latitude, longitude, timezone, etc.
}

// Create a Better Auth instance configured for Cloudflare runtimes.
// Supply `env` and `cf` based on your platform's request context.
export function createAuthCloudflare(env?: CloudflareBindings, cf?: CloudflareCfProperties) {
  return betterAuth({
    ...withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        cf: (cf || {}) as Record<string, unknown>,
        // Provide D1, KV, and/or R2 bindings here if needed.
        // d1: env ? { db: <your drizzle instance for env.DATABASE>, options: { usePlural: true, debugLogs: true } } : undefined,
        // kv: env?.KV,
        // r2: { bucket: env?.R2_BUCKET as never },
      },
      {
        // Add/override your Better Auth options if needed
      },
    ),
  });
}

// Export a default instance for tooling/CLI usage if desired.
export const auth = createAuthCloudflare();

