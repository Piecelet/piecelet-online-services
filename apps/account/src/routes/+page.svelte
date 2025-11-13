<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession } from '$lib/auth';

	let instance = $state('neodb.social');
	let error = $state('');
	let loading = $state(false);

	const session = useSession();
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

	// Redirect to dashboard if already logged in
	$effect(() => {
		if ($session.data?.session) {
			goto('/dashboard');
		}
	});

	function handleLogin() {
		error = '';

		if (!instance.trim()) {
			error = 'Please enter a NeoDB instance';
			return;
		}

		loading = true;

		// Construct the OAuth start URL
		const instanceValue = instance.trim();
		const callbackURL = window.location.origin + '/auth/callback';
		const authURL = `${API_URL}/api/auth/neodb/start?instance=${encodeURIComponent(instanceValue)}&callbackURL=${encodeURIComponent(callbackURL)}`;

		// Redirect to the OAuth start endpoint
		window.location.href = authURL;
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}

	async function handleAnonymousLogin() {
		error = '';
		loading = true;

		try {
			const response = await fetch(`${API_URL}/api/auth/sign-in/anonymous`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const text = await response.text();
				error = `Anonymous login failed: ${text}`;
				loading = false;
				return;
			}

			// Redirect to dashboard after successful login
			goto('/dashboard');
		} catch (err) {
			error = `Anonymous login failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold tracking-tight text-gray-900">Piecelet Account</h1>
			<p class="mt-2 text-sm text-gray-600">Sign in to manage your account</p>
		</div>

		<div class="mt-8 space-y-6 rounded-lg bg-white px-8 py-10 shadow-md">
			{#if error}
				<div class="rounded-md bg-red-50 p-3">
					<p class="text-sm text-red-800">{error}</p>
				</div>
			{/if}

			<!-- NeoDB Login Section -->
			<div class="space-y-4">
				<h2 class="text-lg font-semibold text-gray-900">Sign in with NeoDB</h2>
				<div>
					<label for="instance" class="block text-sm font-medium text-gray-700">
						NeoDB Instance
					</label>
					<div class="mt-1">
						<input
							id="instance"
							type="text"
							bind:value={instance}
							onkeypress={handleKeyPress}
							placeholder="neodb.social"
							disabled={loading}
							class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
						/>
					</div>
					<p class="mt-2 text-xs text-gray-500">
						Enter your NeoDB instance host (e.g., neodb.social)
					</p>
				</div>

				<button
					type="button"
					onclick={handleLogin}
					disabled={loading}
					class="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					{loading ? 'Redirecting...' : 'Sign in with NeoDB'}
				</button>
			</div>

			<!-- Divider -->
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-white px-2 text-gray-500">Or</span>
				</div>
			</div>

			<!-- Anonymous Login -->
			<div>
				<button
					type="button"
					onclick={handleAnonymousLogin}
					disabled={loading}
					class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-100"
				>
					Continue Anonymously
				</button>
			</div>
		</div>

		<div class="text-center text-xs text-gray-500">
			<p>
				By signing in, you agree to our
				<a href="/terms" class="text-blue-600 hover:underline">Terms of Service</a>
				and
				<a href="/privacy" class="text-blue-600 hover:underline">Privacy Policy</a>
			</p>
		</div>
	</div>
</div>
