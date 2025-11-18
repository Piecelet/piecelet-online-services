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
 * Universal NeoDB API Proxy
 * Forwards all /api/neodb/* requests to apps/api
 *
 * Path mapping:
 * /api/neodb/* -> {API_URL}/api/auth/neodb/api/*
 *
 * Examples:
 * GET  /api/neodb/me/shelf?category=complete
 * GET  /api/neodb/me/marks?year=2024
 * GET  /api/neodb/item/:id
 * POST /api/neodb/me/marks
 * PUT  /api/neodb/me/marks/:id
 * DELETE /api/neodb/me/marks/:id
 */
neodb.all("/api/neodb/*", jwtAuth, async (c) => {
  const apiUrl = getApiUrl(c);

  // Extract path after /api/neodb/
  // Example: /api/neodb/me/shelf -> /me/shelf
  const neodbPath = c.req.path.replace(/^\/api\/neodb/, "");

  // Build target URL: {API_URL}/api/auth/neodb/api{path}
  const targetUrl = new URL(`/api/auth/neodb/api${neodbPath}`, apiUrl);

  // Copy all query parameters
  const url = new URL(c.req.url);
  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  try {
    // Forward headers
    const headers: Record<string, string> = {
      Authorization: c.req.header("Authorization") || "",
    };

    // Copy Content-Type if present
    const contentType = c.req.header("Content-Type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const fetchOptions: RequestInit = {
      method: c.req.method,
      headers,
    };

    // Forward request body for POST/PUT/PATCH/DELETE
    if (["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) {
      const body = await c.req.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);

    // Forward response
    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[Wrapped -> API] NeoDB proxy error:", error);
    return c.json({
      error: "Failed to proxy request to API service",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default neodb;
