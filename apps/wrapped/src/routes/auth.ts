import { Hono } from "hono";
import type { CloudflareBindings } from "../env";
import { jwtAuth, type AuthContext } from "../middleware/auth";

const auth = new Hono<{ Bindings: CloudflareBindings; Variables: AuthContext }>();

// JWT validation test endpoint
auth.get("/api/verify-jwt", jwtAuth, (c) => {
    const user = c.get("user");
    const now = Math.floor(Date.now() / 1000);

    return c.json({
        valid: true,
        user: {
            id: user.sub,
            email: user.email,
            name: user.name,
            username: user.username,
        },
        token_info: {
            issued_at: user.iat ? new Date(user.iat * 1000).toISOString() : null,
            expires_at: user.exp ? new Date(user.exp * 1000).toISOString() : null,
            time_until_expiry: user.exp ? `${user.exp - now} seconds` : null,
            is_expired: user.exp ? user.exp < now : false,
        },
        verified_at: new Date().toISOString(),
    });
});

export default auth;
