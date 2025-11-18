import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { CloudflareBindings } from "../env";
import { jwtAuth, type AuthContext } from "../middleware/auth";
import { schema, wrappedUsers, wrappedData } from "../db";

const wrapped = new Hono<{ Bindings: CloudflareBindings; Variables: AuthContext }>();

// Get wrapped data for a specific year
wrapped.get("/api/wrapped/:year", jwtAuth, async (c) => {
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
wrapped.post("/api/wrapped", jwtAuth, async (c) => {
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
wrapped.get("/api/wrapped", jwtAuth, async (c) => {
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

export default wrapped;
