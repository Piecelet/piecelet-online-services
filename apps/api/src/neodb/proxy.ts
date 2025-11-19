/**
 * NeoDB API Proxy - Secure implementation
 *
 * Security features:
 * - Path traversal protection
 * - Instance whitelist validation
 * - Request size limits
 * - Sanitized error messages
 * - Minimal logging (audit only)
 */

import type { Context } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { schema, accounts } from "../db";
import type { CloudflareBindings } from "../env";

// Security: Whitelist of allowed NeoDB instances
const ALLOWED_INSTANCES = [
  "neodb.social",
  // Add other official instances here if needed
];

// Security: Maximum request body size (1MB)
const MAX_BODY_SIZE = 1024 * 1024;

/**
 * Handle NeoDB API proxy request
 */
export async function handleNeoDBApiProxy(
  c: Context<{ Bindings: CloudflareBindings; Variables: any }>
) {
  const auth = c.get("auth");

  // 1. Authentication check
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // 2. Extract and validate path
  const requestUrl = new URL(c.req.url);
  const neodbPath = requestUrl.pathname.replace(/^\/api\/auth\/neodb\/api/, "/api");

  // Security: Prevent path traversal attacks
  if (neodbPath.includes("..") || neodbPath.includes("//")) {
    return c.json({ error: "Invalid path" }, 400);
  }

  // Security: Validate path starts with /api
  if (!neodbPath.startsWith("/api")) {
    return c.json({ error: "Invalid path" }, 400);
  }

  // 3. Database access
  const db = drizzle(c.env.ACCOUNT_DATABASE, { schema });

  try {
    // 4. Find user's NeoDB account
    const account = await db
      .select({
        id: accounts.id,
        accessToken: accounts.accessToken,
        instance: accounts.instance,
        isAccessTokenRedacted: accounts.isAccessTokenRedacted,
      })
      .from(accounts)
      .where(and(
        eq(accounts.userId, session.user.id),
        eq(accounts.providerId, "neodb")
      ))
      .get();

    // 5. Validate account exists
    if (!account) {
      return c.json({ error: "NeoDB account not connected" }, 404);
    }

    // 6. Validate access token availability
    if (!account.accessToken || account.isAccessTokenRedacted) {
      return c.json({ error: "Access token unavailable" }, 401);
    }

    // 7. Validate instance exists
    if (!account.instance) {
      return c.json({ error: "Instance configuration missing" }, 500);
    }

    // Security: Validate instance is in whitelist
    if (!ALLOWED_INSTANCES.includes(account.instance)) {
      // Audit log for security monitoring (no sensitive data)
      console.warn("[NeoDB Proxy] Blocked request to non-whitelisted instance");
      return c.json({ error: "Invalid instance" }, 403);
    }

    // 8. Build target URL
    const targetUrl = new URL(neodbPath, `https://${account.instance}`);

    // Copy query parameters
    requestUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    // 9. Prepare headers
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${account.accessToken}`,
      "Accept": "application/json",
    };

    // Copy Content-Type if present
    const contentType = c.req.header("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    // 10. Prepare request options
    const fetchOptions: RequestInit = {
      method: c.req.method,
      headers,
    };

    // 11. Forward request body for POST/PUT/PATCH with size check
    if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
      // Security: Check content length
      const contentLength = c.req.header("content-length");
      if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
        return c.json({ error: "Request too large" }, 413);
      }

      fetchOptions.body = await c.req.text();
    }

    // 12. Forward request to NeoDB
    const response = await fetch(targetUrl.toString(), fetchOptions);

    // 13. Forward response
    const responseData = await response.text();

    return new Response(responseData, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });

  } catch (error) {
    // Security: Don't expose internal error details
    // Audit log (no sensitive data)
    console.error("[NeoDB Proxy] Request failed");

    return c.json({ error: "Request failed" }, 500);
  }
}
