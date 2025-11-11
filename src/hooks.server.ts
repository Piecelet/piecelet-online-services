import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/auth";
import { building } from "$app/environment";

export async function handle({ event, resolve }) {
  // Populate session/user on server-side locals for convenience
  try {
    const current = await auth.api.getSession({
      headers: event.request.headers,
    });
    if (current) {
      // current has shape { session, user }
      event.locals.session = current.session;
      event.locals.user = current.user;
    }
  } catch {
    // ignore if session not found
  }

  return svelteKitHandler({ event, resolve, auth, building });
}

