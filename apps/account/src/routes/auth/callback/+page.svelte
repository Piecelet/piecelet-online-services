<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let error = $state('');
	let loading = $state(true);

	onMount(async () => {
		// Check for error in URL params
		const errorParam = $page.url.searchParams.get('error');
		if (errorParam) {
			error = decodeURIComponent(errorParam).replace(/_/g, ' ');
			loading = false;
			return;
		}

		// Wait a moment to allow cookies to be set
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Check if we have a session
		try {
			const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
			const response = await fetch(`${API_URL}/api/auth/get-session`, {
				credentials: 'include'
			});

			if (response.ok) {
				const data = (await response.json()) as { session?: unknown };
				if (data?.session) {
					// Success - redirect to dashboard
					goto('/dashboard');
					return;
				}
			}

			// No session found
			error = 'Authentication failed. Please try again.';
			loading = false;
		} catch (err) {
			error = 'Failed to verify authentication. Please try again.';
			loading = false;
		}
	});

	function handleRetry() {
		goto('/');
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
	<div class="w-full max-w-md text-center">
		{#if loading}
	    			<div class="rounded-2xl bg-[var(--surface)] px-8 py-12 border border-[var(--border)] shadow-sm">
				<div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]"></div>
				<h2 class="mt-4 text-lg font-semibold text-[var(--text)]">Completing sign in...</h2>
				<p class="mt-2 text-sm text-[var(--muted)]">Please wait while we verify your authentication.</p>
			</div>
		{:else if error}
	    			<div class="rounded-2xl bg-[var(--surface)] px-8 py-12 border border-[var(--border)] shadow-sm">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
					<svg
						class="h-6 w-6 text-red-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</div>
				<h2 class="mt-4 text-lg font-semibold text-[var(--text)]">Authentication Failed</h2>
				<p class="mt-2 text-sm text-[var(--muted)]">{error}</p>
				<button
					onclick={handleRetry}
					class="mt-6 inline-flex justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
				>
					Try Again
				</button>
			</div>
		{/if}
	</div>
</div>
