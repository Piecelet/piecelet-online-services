/**
 * Centralized origin configuration for CORS and Better Auth
 *
 * Rules:
 * - DEV: Allow all origins
 * - PROD: Only allow production origins
 */

// Production origins - only these domains are allowed in production
export const PRODUCTION_ORIGINS = [
    "https://account.piecelet.app",
    "https://connect.piecelet.app",
    "https://online.piecelet.app",
    "https://services.piecelet.app",
    "https://www.piecelet.app",
    "https://piecelet.app",
] as const;

// Base URLs for the API
export const DEV_BASE_URL = "http://localhost:8787";
export const PROD_BASE_URL = "https://connect.piecelet.app";

/**
 * Check if we're in development mode
 * Cloudflare Workers doesn't have process.env at module level,
 * so we check if we're running in a local dev environment
 */
export function isDevelopment(): boolean {
    // @ts-ignore - process may not be defined in Cloudflare Workers
    return typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development';
}

/**
 * Get the base URL for Better Auth
 */
export function getBaseURL(): string {
    return isDevelopment() ? DEV_BASE_URL : PROD_BASE_URL;
}

/**
 * Get allowed origins for Better Auth trustedOrigins
 */
export function getAllowedOrigins(): readonly string[] {
    // In dev, include localhost origins for Better Auth
    // In prod, only production origins
    return isDevelopment()
        ? [...PRODUCTION_ORIGINS, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:4173", "http://localhost:8787", "http://127.0.0.1:5173"]
        : PRODUCTION_ORIGINS;
}

/**
 * Get the origin to return in CORS header
 * DEV: Allow all origins (return the requesting origin)
 * PROD: Only return if in production origins list
 */
export function getAllowedOrigin(origin: string | undefined): string {
    // DEV: Allow all origins
    if (isDevelopment()) {
        return origin || "*";
    }

    // PROD: Only allow production origins
    if (!origin) {
        return PRODUCTION_ORIGINS[0];
    }

    // Return origin if it's in the production list, otherwise deny
    return PRODUCTION_ORIGINS.includes(origin as any) ? origin : PRODUCTION_ORIGINS[0];
}
