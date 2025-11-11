import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/db";
import { neodbOAuthPlugin } from "$lib/neodb/plugin";

export const auth = betterAuth({
  emailAndPassword: { enabled: false },
  database: db,
  plugins: [neodbOAuthPlugin, sveltekitCookies(getRequestEvent)],
});
