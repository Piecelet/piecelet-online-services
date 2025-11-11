// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, User } from "better-auth";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: User;
			session?: Session;
		}
		interface Platform {
			env: {
				COUNTER: DurableObjectNamespace;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache }
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
