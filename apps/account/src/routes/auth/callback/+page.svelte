<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
    import Card from '$lib/components/ui/Card.svelte';
    import Button from '$lib/components/ui/Button.svelte';

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

<div class="flex min-h-[calc(100svh-104px)] items-center justify-center bg-[var(--bg)] px-4">
    <div class="w-full max-w-md text-center">
        {#if loading}
            <Card class="px-8 py-10">
                <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]"></div>
                <h2 class="mt-4 text-[17px] font-semibold text-[var(--text)]">Completing sign in…</h2>
                <p class="mt-1.5 text-[13px] text-[var(--muted)]">Please wait while we verify your authentication.</p>
            </Card>
        {:else if error}
            <Card class="px-8 py-10">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                    <svg
                        class="h-6 w-6 text-red-600 dark:text-red-400"
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
                <h2 class="mt-4 text-[17px] font-semibold text-[var(--text)]">Authentication Failed</h2>
                <p class="mt-1.5 text-[13px] text-[var(--muted)]">{error}</p>
                <div class="mt-6">
                    <Button onclick={handleRetry} class="px-5">Try Again</Button>
                </div>
            </Card>
        {/if}
    </div>
    
</div>
