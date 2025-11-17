import type { D1Database } from "@cloudflare/workers-types";

export interface CloudflareBindings {
    WRAPPED_DB: D1Database;
}
