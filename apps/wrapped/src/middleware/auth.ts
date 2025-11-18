import { createMiddleware } from "hono/factory";

// Account service base URL - use environment-aware URL
const getAccountServiceURL = () => {
    // In development, use localhost
    // In production, use the production URL
    // @ts-ignore - process may not be defined in Cloudflare Workers
    const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development';
    return isDev ? "http://localhost:8787" : "https://connect.piecelet.app";
};

export interface User {
    id: string;
    email: string;
    name: string;
    username?: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthContext {
    user: User;
}

/**
 * Session authentication middleware
 * Verifies session by calling the account service's getSession endpoint
 * Session cookie is automatically shared across localhost ports and production subdomains
 */
export const jwtAuth = createMiddleware<{ Variables: AuthContext }>(async (c, next) => {
    try {
        const accountServiceURL = getAccountServiceURL();

        // Get all cookies from the request
        const cookieHeader = c.req.header('cookie');

        if (!cookieHeader) {
            return c.json({ error: "Unauthorized: No session cookie" }, 401);
        }

        // Call the account service to verify the session
        // The session cookie will be automatically forwarded
        const response = await fetch(`${accountServiceURL}/api/auth/get-session`, {
            headers: {
                'Cookie': cookieHeader,
            },
        });

        if (!response.ok) {
            return c.json({
                error: "Unauthorized: Invalid session",
                details: `Auth service returned ${response.status}`
            }, 401);
        }

        const sessionData = await response.json();

        // Check if session is valid
        if (!sessionData?.user || !sessionData?.session) {
            return c.json({
                error: "Unauthorized: No active session"
            }, 401);
        }

        // Store user info in context
        c.set("user", sessionData.user);

        await next();
    } catch (error) {
        // Log detailed error for debugging
        console.error("Session verification failed:", {
            error: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : undefined,
        });

        return c.json(
            {
                error: "Unauthorized: Session verification failed",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            401
        );
    }
});
