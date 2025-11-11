import { createAuthClient } from "better-auth/svelte";
import { cloudflareClient } from "better-auth-cloudflare/client";

export const authClient = createAuthClient({
  plugins: [cloudflareClient()],
});
