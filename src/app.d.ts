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
            env: Env
            cf: CfProperties
            ctx: ExecutionContext
        }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
