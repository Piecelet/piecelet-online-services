import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import type { CloudflareBindings } from "../env";
import { jwtAuth, type AuthContext } from "../middleware/auth";
import { schema, wrappedUsers } from "../db";

const user = new Hono<{ Bindings: CloudflareBindings; Variables: AuthContext }>();

// Get or sync user information from JWT
user.get("/api/user", jwtAuth, async (c) => {
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

export default user;
