import { createAuthClient } from 'better-auth/svelte';
import { anonymousClient } from 'better-auth/client/plugins';

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const authClient = createAuthClient({
	baseURL: `${API_URL}/api/auth`,
	plugins: [anonymousClient()]
});

export const { signIn, signUp, signOut, useSession } = authClient;
