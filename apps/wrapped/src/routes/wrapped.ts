import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { CloudflareBindings } from "../env";
import { jwtAuth, type AuthContext } from "../middleware/auth";
import { schema, wrappedUsers, wrappedData, wrapped2025Items, wrapped2025Marks, wrappedCollectionTasks } from "../db";

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

// ============================================================================
// 2025 Marks Collection API
// ============================================================================

const SHELF_TYPES = ["wishlist", "progress", "complete", "dropped"] as const;
type ShelfType = typeof SHELF_TYPES[number];

interface MarksProgress {
    currentShelfType: ShelfType;
    currentPage: number;
    shelfMetadata: Record<string, { pages: number; count: number }>;
}

/**
 * Start marks collection for 2025
 * POST /api/wrapped/2025/marks/collect/start
 */
wrapped.post("/api/wrapped/2025/marks/collect/start", jwtAuth, async (c) => {
    const user = c.get("user");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        // Ensure user exists in wrapped database
        let existingUser = await db
            .select()
            .from(wrappedUsers)
            .where(eq(wrappedUsers.id, user.id))
            .get();

        if (!existingUser) {
            await db.insert(wrappedUsers).values({
                id: user.id,
                email: user.email || "",
                name: user.name,
                username: user.username,
            });
        }

        // Check if there's already an active task
        const existingTask = await db
            .select()
            .from(wrappedCollectionTasks)
            .where(and(
                eq(wrappedCollectionTasks.userId, user.id),
                eq(wrappedCollectionTasks.year, 2025),
                eq(wrappedCollectionTasks.collectionType, "marks"),
                eq(wrappedCollectionTasks.status, "collecting")
            ))
            .get();

        if (existingTask) {
            return c.json({
                taskId: existingTask.id,
                status: "already_started",
                message: "Collection already in progress"
            });
        }

        // Create new task
        const taskId = nanoid();
        const initialProgress: MarksProgress = {
            currentShelfType: "wishlist",
            currentPage: 1,
            shelfMetadata: {},
        };

        await db.insert(wrappedCollectionTasks).values({
            id: taskId,
            userId: user.id,
            year: 2025,
            collectionType: "marks",
            progress: initialProgress as any,
            status: "collecting",
            totalCollected: 0,
        });

        return c.json({
            taskId,
            status: "started",
            message: "Collection task created successfully"
        });
    } catch (error) {
        console.error("[Marks Collection] Start error:", error);
        return c.json({
            error: "Failed to start collection",
            details: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});

/**
 * Collect next batch of marks
 * POST /api/wrapped/2025/marks/collect/next/:taskId
 */
wrapped.post("/api/wrapped/2025/marks/collect/next/:taskId", jwtAuth, async (c) => {
    const user = c.get("user");
    const taskId = c.req.param("taskId");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        // Get task and verify ownership
        const task = await db
            .select()
            .from(wrappedCollectionTasks)
            .where(and(
                eq(wrappedCollectionTasks.id, taskId),
                eq(wrappedCollectionTasks.userId, user.id)
            ))
            .get();

        if (!task) {
            return c.json({ error: "Task not found or unauthorized" }, 404);
        }

        if (task.status === "completed") {
            return c.json({ done: true, message: "Collection already completed" });
        }

        if (task.status === "failed") {
            return c.json({ error: "Task failed", details: task.error }, 400);
        }

        const progress = task.progress as MarksProgress;
        const { currentShelfType, currentPage } = progress;

        // Get API URL from environment
        const apiUrl = c.env.API_URL || "http://localhost:8787";

        // Forward cookies for authentication
        const cookieHeader = c.req.header("cookie") || "";

        // Fetch current page from NeoDB
        const targetUrl = `${apiUrl}/api/auth/neodb/api/me/shelf/${currentShelfType}?page=${currentPage}`;
        const response = await fetch(targetUrl, {
            headers: {
                "Cookie": cookieHeader,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            await db.update(wrappedCollectionTasks)
                .set({
                    status: "failed",
                    error: `NeoDB API error: ${response.status} - ${errorText}`,
                    updatedAt: new Date(),
                })
                .where(eq(wrappedCollectionTasks.id, taskId));

            return c.json({
                error: "Failed to fetch from NeoDB",
                details: errorText
            }, 500);
        }

        const data = await response.json() as {
            data: Array<{
                shelf_type: string;
                visibility: number;
                post_id: number | null;
                item: any;
                created_time: string;
                comment_text: string | null;
                rating_grade: number | null;
                tags: string[];
            }>;
            pages: number;
            count: number;
        };

        // Update shelf metadata on first page
        if (currentPage === 1) {
            progress.shelfMetadata[currentShelfType] = {
                pages: data.pages,
                count: data.count,
            };
        }

        // Filter and store marks from 2025
        // Stop if we encounter a 2024 mark (since marks are sorted by time descending)
        let collectedCount = 0;
        let shouldStop = false;

        for (const mark of data.data) {
            const createdDate = new Date(mark.created_time);
            const year = createdDate.getFullYear();

            // If we encounter a 2024 mark, stop collecting (all subsequent marks will be older)
            if (year < 2025) {
                shouldStop = true;
                break;
            }

            // Skip future marks (shouldn't happen, but just in case)
            if (year > 2025) {
                continue;
            }

            // Store item (shared table)
            await db.insert(wrapped2025Items).values({
                id: mark.item.id,
                uuid: mark.item.uuid,
                type: mark.item.type,
                category: mark.item.category,
                title: mark.item.title,
                displayTitle: mark.item.display_title,
                description: mark.item.description || "",
                localizedTitle: mark.item.localized_title,
                localizedDescription: mark.item.localized_description,
                coverImageUrl: mark.item.cover_image_url,
                rating: mark.item.rating,
                ratingCount: mark.item.rating_count,
                ratingDistribution: mark.item.rating_distribution,
                tags: mark.item.tags,
                parentUuid: mark.item.parent_uuid,
                url: mark.item.url,
                apiUrl: mark.item.api_url,
                externalResources: mark.item.external_resources,
            }).onConflictDoNothing();

            // Store mark (user-specific)
            const markId = `${user.id}_${mark.item.id}_${mark.shelf_type}`;
            await db.insert(wrapped2025Marks).values({
                id: markId,
                userId: user.id,
                itemId: mark.item.id,
                shelfType: mark.shelf_type,
                category: mark.item.category,
                visibility: mark.visibility,
                postId: mark.post_id,
                createdTime: createdDate,
                commentText: mark.comment_text,
                ratingGrade: mark.rating_grade,
                tags: mark.tags,
            }).onConflictDoUpdate({
                target: wrapped2025Marks.id,
                set: {
                    shelfType: mark.shelf_type,
                    visibility: mark.visibility,
                    commentText: mark.comment_text,
                    ratingGrade: mark.rating_grade,
                    tags: mark.tags,
                },
            });

            collectedCount++;
        }

        // Determine next step
        let nextShelfType = currentShelfType;
        let nextPage = currentPage;
        let isDone = false;

        // If we encountered a 2024 mark, skip to next shelf type
        if (shouldStop) {
            const currentIndex = SHELF_TYPES.indexOf(currentShelfType);
            if (currentIndex < SHELF_TYPES.length - 1) {
                // Move to next shelf type
                nextShelfType = SHELF_TYPES[currentIndex + 1];
                nextPage = 1;
            } else {
                // All shelves completed
                isDone = true;
            }
        } else if (currentPage < data.pages) {
            // More pages in current shelf
            nextPage = currentPage + 1;
        } else {
            // Current shelf finished, move to next shelf type
            const currentIndex = SHELF_TYPES.indexOf(currentShelfType);
            if (currentIndex < SHELF_TYPES.length - 1) {
                nextShelfType = SHELF_TYPES[currentIndex + 1];
                nextPage = 1;
            } else {
                // All shelves completed
                isDone = true;
            }
        }

        // Calculate progress percentage
        let totalPages = 0;
        let completedPages = 0;

        for (const shelfType of SHELF_TYPES) {
            const metadata = progress.shelfMetadata[shelfType];
            if (metadata) {
                totalPages += metadata.pages;
                if (shelfType === currentShelfType) {
                    completedPages += currentPage;
                } else {
                    const idx = SHELF_TYPES.indexOf(shelfType);
                    const currentIdx = SHELF_TYPES.indexOf(currentShelfType);
                    if (idx < currentIdx) {
                        completedPages += metadata.pages;
                    }
                }
            }
        }

        const percentage = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;

        // Update task
        const newTotalCollected = task.totalCollected + collectedCount;

        if (isDone) {
            await db.update(wrappedCollectionTasks)
                .set({
                    status: "completed",
                    totalCollected: newTotalCollected,
                    progress: progress as any,
                    updatedAt: new Date(),
                })
                .where(eq(wrappedCollectionTasks.id, taskId));
        } else {
            progress.currentShelfType = nextShelfType;
            progress.currentPage = nextPage;

            await db.update(wrappedCollectionTasks)
                .set({
                    totalCollected: newTotalCollected,
                    progress: progress as any,
                    updatedAt: new Date(),
                })
                .where(eq(wrappedCollectionTasks.id, taskId));
        }

        return c.json({
            done: isDone,
            skippedToNextShelf: shouldStop, // Indicates we skipped to next shelf because we found 2024 data
            progress: {
                percentage,
                currentShelf: currentShelfType,
                currentPage,
                totalPages,
                collectedCount: newTotalCollected,
                batchCollected: collectedCount,
            }
        });
    } catch (error) {
        console.error("[Marks Collection] Next error:", error);

        // Mark task as failed
        await db.update(wrappedCollectionTasks)
            .set({
                status: "failed",
                error: error instanceof Error ? error.message : String(error),
                updatedAt: new Date(),
            })
            .where(eq(wrappedCollectionTasks.id, taskId));

        return c.json({
            error: "Failed to collect marks",
            details: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});

/**
 * Get collection task status
 * GET /api/wrapped/2025/marks/collect/status/:taskId
 */
wrapped.get("/api/wrapped/2025/marks/collect/status/:taskId", jwtAuth, async (c) => {
    const user = c.get("user");
    const taskId = c.req.param("taskId");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        const task = await db
            .select()
            .from(wrappedCollectionTasks)
            .where(and(
                eq(wrappedCollectionTasks.id, taskId),
                eq(wrappedCollectionTasks.userId, user.id)
            ))
            .get();

        if (!task) {
            return c.json({ error: "Task not found or unauthorized" }, 404);
        }

        const progress = task.progress as MarksProgress;

        return c.json({
            taskId: task.id,
            status: task.status,
            totalCollected: task.totalCollected,
            currentShelf: progress.currentShelfType,
            currentPage: progress.currentPage,
            shelfMetadata: progress.shelfMetadata,
            error: task.error,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        });
    } catch (error) {
        console.error("[Marks Collection] Status error:", error);
        return c.json({
            error: "Failed to get task status",
            details: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});

/**
 * Finalize collection and clean up task
 * POST /api/wrapped/2025/marks/finalize/:taskId
 */
wrapped.post("/api/wrapped/2025/marks/finalize/:taskId", jwtAuth, async (c) => {
    const user = c.get("user");
    const taskId = c.req.param("taskId");
    const db = drizzle(c.env.WRAPPED_DB, { schema });

    try {
        const task = await db
            .select()
            .from(wrappedCollectionTasks)
            .where(and(
                eq(wrappedCollectionTasks.id, taskId),
                eq(wrappedCollectionTasks.userId, user.id)
            ))
            .get();

        if (!task) {
            return c.json({ error: "Task not found or unauthorized" }, 404);
        }

        if (task.status !== "completed") {
            return c.json({
                error: "Task not completed",
                status: task.status
            }, 400);
        }

        // Delete the task
        await db
            .delete(wrappedCollectionTasks)
            .where(eq(wrappedCollectionTasks.id, taskId));

        return c.json({
            message: "Collection finalized successfully",
            totalCollected: task.totalCollected,
        });
    } catch (error) {
        console.error("[Marks Collection] Finalize error:", error);
        return c.json({
            error: "Failed to finalize collection",
            details: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});

export default wrapped;
