import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import type { CloudflareBindings } from "./env";
import { jwtAuth, type AuthContext } from "./middleware/auth";
import { schema, wrappedUsers, wrappedData } from "./db";
import { nanoid } from "nanoid";

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

// Health check
app.get("/", (c) => {
    return c.json({
        service: "piecelet-wrapped",
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

// Get or sync user information from JWT
app.get("/api/user", jwtAuth, async (c) => {
    const user = c.get("user");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        // Check if user exists
        const existingUser = await db
            .select()
            .from(wrappedUsers)
            .where(eq(wrappedUsers.id, user.sub))
            .get();

        if (existingUser) {
            // Update user information
            const updated = await db
                .update(wrappedUsers)
                .set({
                    email: user.email || existingUser.email,
                    name: user.name || existingUser.name,
                    username: user.username || existingUser.username,
                    updatedAt: new Date(),
                })
                .where(eq(wrappedUsers.id, user.sub))
                .returning()
                .get();

            return c.json({ user: updated });
        } else {
            // Create new user
            const newUser = await db
                .insert(wrappedUsers)
                .values({
                    id: user.sub,
                    email: user.email || "",
                    name: user.name,
                    username: user.username,
                })
                .returning()
                .get();

            return c.json({ user: newUser });
        }
    } catch (error) {
        console.error("Error syncing user:", error);
        return c.json(
            { error: "Failed to sync user information" },
            500
        );
    }
});

// Get wrapped data for a specific year
app.get("/api/wrapped/:year", jwtAuth, async (c) => {
    const user = c.get("user");
    const year = parseInt(c.req.param("year"));
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    if (isNaN(year)) {
        return c.json({ error: "Invalid year parameter" }, 400);
    }

    try {
        const wrapped = await db
            .select()
            .from(wrappedData)
            .where(
                and(
                    eq(wrappedData.userId, user.sub),
                    eq(wrappedData.year, year)
                )
            )
            .get();

        if (!wrapped) {
            return c.json({ error: "Wrapped data not found for this year" }, 404);
        }

        return c.json({ wrapped });
    } catch (error) {
        console.error("Error fetching wrapped data:", error);
        return c.json({ error: "Failed to fetch wrapped data" }, 500);
    }
});

// Create or update wrapped data
app.post("/api/wrapped", jwtAuth, async (c) => {
    const user = c.get("user");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        const body = await c.req.json();
        const { year, data } = body;

        if (!year || !data) {
            return c.json({ error: "Year and data are required" }, 400);
        }

        // Ensure user exists
        let existingUser = await db
            .select()
            .from(wrappedUsers)
            .where(eq(wrappedUsers.id, user.sub))
            .get();

        if (!existingUser) {
            existingUser = await db
                .insert(wrappedUsers)
                .values({
                    id: user.sub,
                    email: user.email || "",
                    name: user.name,
                    username: user.username,
                })
                .returning()
                .get();
        }

        // Check if wrapped data already exists for this year
        const existing = await db
            .select()
            .from(wrappedData)
            .where(
                and(
                    eq(wrappedData.userId, user.sub),
                    eq(wrappedData.year, year)
                )
            )
            .get();

        if (existing) {
            // Update existing wrapped data
            const updated = await db
                .update(wrappedData)
                .set({
                    data,
                    updatedAt: new Date(),
                })
                .where(eq(wrappedData.id, existing.id))
                .returning()
                .get();

            return c.json({ wrapped: updated });
        } else {
            // Create new wrapped data
            const newWrapped = await db
                .insert(wrappedData)
                .values({
                    id: nanoid(),
                    userId: user.sub,
                    year,
                    data,
                })
                .returning()
                .get();

            return c.json({ wrapped: newWrapped });
        }
    } catch (error) {
        console.error("Error saving wrapped data:", error);
        return c.json(
            { error: "Failed to save wrapped data" },
            500
        );
    }
});

// List all wrapped years for the user
app.get("/api/wrapped", jwtAuth, async (c) => {
    const user = c.get("user");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        const wrappedList = await db
            .select()
            .from(wrappedData)
            .where(eq(wrappedData.userId, user.sub))
            .all();

        return c.json({ wrapped: wrappedList });
    } catch (error) {
        console.error("Error fetching wrapped list:", error);
        return c.json({ error: "Failed to fetch wrapped data" }, 500);
    }
});

export default app;
