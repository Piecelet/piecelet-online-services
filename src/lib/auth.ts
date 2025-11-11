import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { DatabaseSync } from "node:sqlite";

// Initialize a local SQLite database using Node's built-in (experimental) driver
const db = new DatabaseSync("database.sqlite");

export const auth = betterAuth({
  // Enable basic email/password auth
  emailAndPassword: {
    enabled: true,
  },

  // Use SQLite database
  database: db,

  // SvelteKit cookies plugin must be last
  plugins: [sveltekitCookies(getRequestEvent)],
});

