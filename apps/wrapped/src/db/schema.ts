import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

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

/**
 * 2025 Items table - shared across all users
 * Stores NeoDB item information (books, movies, music, etc.)
 */
export const wrapped2025Items = sqliteTable("wrapped_2025_items", {
    id: text("id").primaryKey(), // NeoDB item.id
    uuid: text("uuid").notNull().unique(),

    // Basic information
    type: text("type").notNull(),
    category: text("category").notNull(), // book/movie/tv/music/game/podcast
    title: text("title").notNull(),
    displayTitle: text("display_title").notNull(),
    description: text("description").default(""),

    // Localization
    localizedTitle: text("localized_title", { mode: "json" }),
    localizedDescription: text("localized_description", { mode: "json" }),

    // Media
    coverImageUrl: text("cover_image_url"),

    // Ratings (NeoDB platform public ratings)
    rating: real("rating"),
    ratingCount: integer("rating_count"),
    ratingDistribution: text("rating_distribution", { mode: "json" }),

    // Tags and classification
    tags: text("tags", { mode: "json" }),
    parentUuid: text("parent_uuid"),

    // Links
    url: text("url").notNull(),
    apiUrl: text("api_url").notNull(),
    externalResources: text("external_resources", { mode: "json" }),

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

/**
 * 2025 Marks table - user-specific marks on items
 * Stores user's shelf status, ratings, and comments
 */
export const wrapped2025Marks = sqliteTable("wrapped_2025_marks", {
    id: text("id").primaryKey(), // userId_itemId_shelfType
    userId: text("user_id").notNull()
        .references(() => wrappedUsers.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull()
        .references(() => wrapped2025Items.id),

    // Mark basic information
    shelfType: text("shelf_type").notNull(), // wishlist/progress/complete/dropped
    category: text("category").notNull(), // Redundant storage for faster queries
    visibility: integer("visibility").notNull(),
    postId: integer("post_id"),
    createdTime: integer("created_time", { mode: "timestamp_ms" }).notNull(),

    // User's rating and comments
    commentText: text("comment_text"),
    ratingGrade: integer("rating_grade"), // 1-10
    tags: text("tags", { mode: "json" }), // string[]

    // Metadata
    collectedAt: integer("collected_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
}, (table) => ({
    // Indexes for query optimization
    userIdIdx: index("wrapped_2025_marks_user_id_idx").on(table.userId),
    categoryIdx: index("wrapped_2025_marks_category_idx").on(table.userId, table.category),
    shelfTypeIdx: index("wrapped_2025_marks_shelf_type_idx").on(table.userId, table.shelfType),
    createdTimeIdx: index("wrapped_2025_marks_created_time_idx").on(table.userId, table.createdTime),
    // Composite index for category + shelfType queries
    categoryShelfIdx: index("wrapped_2025_marks_category_shelf_idx")
        .on(table.userId, table.category, table.shelfType),
}));

/**
 * Collection tasks table - tracks data collection progress
 * Designed to be extensible for future collection types (notes, reviews, etc.)
 */
export const wrappedCollectionTasks = sqliteTable("wrapped_collection_tasks", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull()
        .references(() => wrappedUsers.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),

    // Collection type (extensible for future: "notes", "reviews")
    collectionType: text("collection_type").notNull(), // "marks" | "notes" | "reviews"

    // Progress tracking (type-specific data stored as JSON)
    // For marks: { currentShelfType: "wishlist", currentPage: 1, shelfMetadata: {...} }
    // For notes: { currentPage: 1, totalPages: 10 }
    progress: text("progress", { mode: "json" }),

    // Status
    totalCollected: integer("total_collected").notNull().default(0),
    status: text("status").notNull().default("pending"), // pending/collecting/completed/failed
    error: text("error"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("wrapped_collection_tasks_user_id_idx").on(table.userId),
    statusIdx: index("wrapped_collection_tasks_status_idx").on(table.userId, table.status),
}));

export const schema = {
    wrappedUsers,
    wrappedData,
    wrapped2025Items,
    wrapped2025Marks,
    wrappedCollectionTasks,
} as const;
