/**
 * Centralized origin configuration for CORS and Better Auth
 */

// Production origins - these are the allowed domains in production
export const PRODUCTION_ORIGINS = [
    "https://account.piecelet.app",
    "https://online.piecelet.app",
    "https://services.piecelet.app",
    "https://www.piecelet.app",
    "https://piecelet.app",
] as const;

// Development origins - localhost and local IPs
export const DEVELOPMENT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:4173", // Vite preview
    "http://localhost:8787", // API dev server (for same-origin requests)
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:8787",
] as const;

// Combined list of all allowed origins (dev includes prod)
export const ALL_ALLOWED_ORIGINS = [
    ...PRODUCTION_ORIGINS,
    ...DEVELOPMENT_ORIGINS,
] as const;

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return true; // Allow same-origin requests (no origin header)

    // Check exact matches
    if (ALL_ALLOWED_ORIGINS.includes(origin as any)) {
        return true;
    }

    // Check if it starts with any development origin (for dynamic ports)
    return DEVELOPMENT_ORIGINS.some(devOrigin => origin.startsWith(devOrigin.split(':').slice(0, 2).join(':')));
}

/**
 * Get the origin to return in CORS header
 */
export function getAllowedOrigin(origin: string | undefined): string {
    if (!origin) return "*";

    if (isOriginAllowed(origin)) {
        return origin;
    }

    // Fallback to first production origin
    return PRODUCTION_ORIGINS[0];
}
