import { createMiddleware } from "hono/factory";
import { jwtVerify, createRemoteJWKSet } from "jose";
import type { Context } from "hono";

// Account service base URL - use environment-aware URL
const getAccountServiceURL = () => {
    // In development, use localhost
    // In production, use the production URL
    // @ts-ignore - process may not be defined in Cloudflare Workers
    const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development';
    return isDev ? "http://localhost:8787" : "https://connect.piecelet.app";
};

export interface JWTPayload {
    sub: string; // User ID
    email?: string;
    name?: string;
    username?: string;
    iat?: number;
    exp?: number;
}

export interface AuthContext {
    user: JWTPayload;
}

/**
 * JWT authentication middleware
 * Verifies JWT token from Authorization header using JWKS from the account service
 */
export const jwtAuth = createMiddleware<{ Variables: AuthContext }>(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized: No token provided" }, 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
        const accountServiceURL = getAccountServiceURL();

        // Create remote JWKS - this will cache the keys automatically
        const JWKS = createRemoteJWKSet(
            new URL(`${accountServiceURL}/api/auth/jwks`)
        );

        // Verify the JWT token
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: accountServiceURL,
            audience: accountServiceURL,
        });

        // Store user info in context
        c.set("user", {
            sub: payload.sub as string,
            email: payload.email as string,
            name: payload.name as string,
            username: payload.username as string,
            iat: payload.iat,
            exp: payload.exp,
        });

        await next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return c.json(
            {
                error: "Unauthorized: Invalid token",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            401
        );
    }
});
