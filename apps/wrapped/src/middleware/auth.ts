import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
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
 * Verifies JWT token from Authorization header or Cookie using JWKS from the account service
 */
export const jwtAuth = createMiddleware<{ Variables: AuthContext }>(async (c, next) => {
    // Try to get token from Authorization header first
    const authHeader = c.req.header("Authorization");
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
    } else {
        // Try to get token from cookie
        // The JWT cookie is set by the account service at /api/auth/jwt-cookie
        token = getCookie(c, 'auth_jwt');
    }

    if (!token) {
        return c.json({ error: "Unauthorized: No token provided" }, 401);
    }

    try {
        const accountServiceURL = getAccountServiceURL();

        // Create remote JWKS - this will cache the keys automatically
        const JWKS = createRemoteJWKSet(
            new URL(`${accountServiceURL}/api/auth/jwks`)
        );

        // Verify the JWT token with strict validation
        // jwtVerify will automatically check:
        // - Signature validity using JWKS
        // - Token expiration (exp claim)
        // - Not before time (nbf claim if present)
        // - Issuer (iss claim)
        // - Audience (aud claim)
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: accountServiceURL,
            audience: accountServiceURL,
            // Require exp claim
            requiredClaims: ['sub', 'exp'],
        });

        // Additional validation: Check required payload fields
        if (!payload.sub || typeof payload.sub !== 'string') {
            throw new Error('Invalid token: missing or invalid subject (user ID)');
        }

        // Validate expiration manually (extra safety)
        if (payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                throw new Error('Token has expired');
            }
        }

        // Store user info in context
        c.set("user", {
            sub: payload.sub,
            email: payload.email as string,
            name: payload.name as string,
            username: payload.username as string,
            iat: payload.iat,
            exp: payload.exp,
        });

        await next();
    } catch (error) {
        // Log detailed error for debugging
        console.error("JWT verification failed:", {
            error: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : undefined,
        });

        // Return user-friendly error message
        let errorMessage = "Invalid token";
        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                errorMessage = "Token has expired";
            } else if (error.message.includes('signature')) {
                errorMessage = "Invalid token signature";
            } else if (error.message.includes('audience')) {
                errorMessage = "Invalid token audience";
            } else if (error.message.includes('issuer')) {
                errorMessage = "Invalid token issuer";
            }
        }

        return c.json(
            {
                error: "Unauthorized: " + errorMessage,
                details: error instanceof Error ? error.message : "Unknown error"
            },
            401
        );
    }
});
