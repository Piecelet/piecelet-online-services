import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Wrapped users table - stores user information synced from the account service
 * This is separate from the account database to allow independent scaling
 */
export const wrappedUsers = sqliteTable("wrapped_users", {
    id: text("id").primaryKey(), // User ID from the account service
    email: text("email").notNull(),
    name: text("name"),
    username: text("username"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

/**
 * Wrapped data table - stores annual wrapped statistics for users
 */
export const wrappedData = sqliteTable("wrapped_data", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => wrappedUsers.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    // Store the wrapped data as JSON
    data: text("data", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const schema = {
    wrappedUsers,
    wrappedData,
} as const;
