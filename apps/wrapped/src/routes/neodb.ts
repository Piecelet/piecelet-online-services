import { Hono } from "hono";
import type { CloudflareBindings } from "../env";
import { jwtAuth, type AuthContext } from "../middleware/auth";

const neodb = new Hono<{ Bindings: CloudflareBindings; Variables: AuthContext }>();

// Configuration: apps/api URL
const getApiUrl = (c: any) => {
  // In production, use environment variable
  // In development, default to localhost
  return c.env.API_URL || "http://localhost:8787";
};

/**
 * Example: Get user's NeoDB shelf
 * GET /api/neodb/shelf?category=complete
 */
neodb.get("/api/neodb/shelf", jwtAuth, async (c) => {
  const user = c.get("user");
  const apiUrl = getApiUrl(c);

  const category = c.req.query("category");
  const url = new URL(`${apiUrl}/api/auth/neodb/api/shelf`);
  if (category) {
    url.searchParams.set("category", category);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        // Forward JWT from wrapped service to api service
        Authorization: c.req.header("Authorization") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      return c.json(error, response.status);
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("[Wrapped -> API] NeoDB shelf fetch error:", error);
    return c.json({ error: "Failed to fetch NeoDB shelf" }, 500);
  }
});

/**
 * Example: Get user's NeoDB marks (ratings/reviews)
 * GET /api/neodb/marks?year=2024
 */
neodb.get("/api/neodb/marks", jwtAuth, async (c) => {
  const user = c.get("user");
  const apiUrl = getApiUrl(c);

  const year = c.req.query("year");
  const category = c.req.query("category");
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");

  const url = new URL(`${apiUrl}/api/auth/neodb/api/marks`);
  if (year) url.searchParams.set("year", year);
  if (category) url.searchParams.set("category", category);
  if (limit) url.searchParams.set("limit", limit);
  if (offset) url.searchParams.set("offset", offset);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: c.req.header("Authorization") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      return c.json(error, response.status);
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("[Wrapped -> API] NeoDB marks fetch error:", error);
    return c.json({ error: "Failed to fetch NeoDB marks" }, 500);
  }
});

/**
 * Example: Get specific NeoDB item
 * GET /api/neodb/item/:id
 */
neodb.get("/api/neodb/item/:id", jwtAuth, async (c) => {
  const user = c.get("user");
  const apiUrl = getApiUrl(c);
  const itemId = c.req.param("id");

  const url = `${apiUrl}/api/auth/neodb/api/item/${itemId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: c.req.header("Authorization") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      return c.json(error, response.status);
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("[Wrapped -> API] NeoDB item fetch error:", error);
    return c.json({ error: "Failed to fetch NeoDB item" }, 500);
  }
});

/**
 * Example: Get user's NeoDB statistics
 * GET /api/neodb/stats
 */
neodb.get("/api/neodb/stats", jwtAuth, async (c) => {
  const user = c.get("user");
  const apiUrl = getApiUrl(c);

  const url = `${apiUrl}/api/auth/neodb/api/stats`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: c.req.header("Authorization") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      return c.json(error, response.status);
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("[Wrapped -> API] NeoDB stats fetch error:", error);
    return c.json({ error: "Failed to fetch NeoDB stats" }, 500);
  }
});

export default neodb;
