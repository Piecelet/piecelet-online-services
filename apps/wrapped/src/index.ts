import { Hono } from "hono";
import { cors } from "hono/cors";
import type { CloudflareBindings } from "./env";
import type { AuthContext } from "./middleware/auth";
import debug from "./routes/debug";
import auth from "./routes/auth";
import user from "./routes/user";
import wrapped from "./routes/wrapped";
import neodb from "./routes/neodb";

const app = new Hono<{ Bindings: CloudflareBindings; Variables: AuthContext }>();

// CORS configuration
app.use(
    "*",
    cors({
        origin: (origin) => {
            // In development, allow all origins
            // In production, only allow specific origins
            // @ts-ignore
            const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development';
            if (isDev) {
                return origin || "*";
            }
            // Production origins
            const allowedOrigins = [
                "https://account.piecelet.app",
                "https://connect.piecelet.app",
                "https://online.piecelet.app",
                "https://services.piecelet.app",
                "https://www.piecelet.app",
                "https://piecelet.app",
            ];
            return origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
        },
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
        maxAge: 600,
        credentials: true,
    })
);

// Register routes
app.route("/", debug);
app.route("/", auth);
app.route("/", user);
app.route("/", wrapped);
app.route("/", neodb);

export default app;
