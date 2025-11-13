<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import ServerCombobox from '$lib/components/ServerCombobox.svelte';
	import { validateServerDomain, sanitizeDomain } from '$lib/utils/validation';
	import { getItem, setItem } from '$lib/utils/storage';
	import { API_URL, STORAGE_KEYS } from '$lib/constants';

	// State management
	let serverDomain = $state('');
	let error = $state<string | null>(null);
	let isLoading = $state(false);
	let isValidating = $state(false);
	let validationTimeout: ReturnType<typeof setTimeout> | null = null;
	let mounted = $state(false);
	let lastServerPlaceholder = $state('');

	// Load last used server from localStorage
	onMount(() => {
		const lastServer = getItem(STORAGE_KEYS.LAST_SERVER);
		if (lastServer) {
			lastServerPlaceholder = lastServer;
		}
		mounted = true;
	});

	// Save server to localStorage when it changes
	$effect(() => {
		if (serverDomain && mounted) {
			setItem(STORAGE_KEYS.LAST_SERVER, serverDomain);
		}
	});

	// Debounced validation
	function handleServerChange(value: string) {
		// Clear previous error on input change
		error = null;

		// Clear previous validation timeout
		if (validationTimeout) {
			clearTimeout(validationTimeout);
		}

		// Don't validate empty input
		if (!value.trim()) {
			isValidating = false;
			return;
		}

		// Set validating state
		isValidating = true;

		// Debounce validation by 300ms
		validationTimeout = setTimeout(() => {
			const sanitized = sanitizeDomain(value);
			const validationError = validateServerDomain(sanitized);

			if (validationError) {
				error = validationError;
			}

			isValidating = false;
		}, 300);
	}

	function resolvedDomain(): string {
		const input = serverDomain?.trim() || '';
		const fromPlaceholder = lastServerPlaceholder?.trim() || '';
		return input || fromPlaceholder;
	}

	// Handle sign in
	async function handleSignIn() {
		error = null;

		const input = resolvedDomain();
		if (!input) {
			error = 'Please enter a server domain';
			return;
		}

		const sanitized = sanitizeDomain(input);

		// Validate domain
		const validationError = validateServerDomain(sanitized);
		if (validationError) {
			error = validationError;
			return;
		}

		try {
			isLoading = true;

			// Build OAuth URL
			const callbackURL = window.location.origin + '/auth/callback';
			const authURL = `${API_URL}/api/auth/neodb/start?instance=${encodeURIComponent(sanitized)}&callbackURL=${encodeURIComponent(callbackURL)}`;

			// Small delay for better UX (show loading state)
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Redirect to auth flow
			window.location.href = authURL;
		} catch (err) {
			isLoading = false;
			error = err instanceof Error ? err.message : 'Failed to start authentication flow';
			console.error('Sign in error:', err);
		}
	}

</script>

<div class="bg-[var(--bg)]">
    <div
        class="mx-auto flex min-h-[calc(100svh-104px)] w-full max-w-md flex-col justify-center px-6 py-12"
        in:fade={{ duration: 300, delay: 100 }}
    >
		<!-- Header -->
        <div class="mb-8 text-center" in:fly={{ y: -20, duration: 400, delay: 200, easing: cubicOut }}>
            <h1 class="text-[32px] font-semibold tracking-[-0.02em] text-[var(--text)]">Sign in to Piecelet</h1>
            <p class="mt-2 text-[13px] text-[var(--muted)]">Connect your NeoDB account to continue</p>
        </div>

		<!-- Sign in card -->
        <div in:fly={{ y: 20, duration: 400, delay: 300, easing: cubicOut }}>
            <Card class="shadow-sm">
                <form onsubmit={(e) => { e.preventDefault(); handleSignIn(); }} novalidate>
                    <!-- Error message -->
                    {#if error}
                        <div class="mb-4">
                            <ErrorMessage message={error} />
                        </div>
                    {/if}

                    <!-- Server selection -->
                    <ServerCombobox
                        bind:value={serverDomain}
                        onInputChange={handleServerChange}
                        onSubmit={handleSignIn}
                        disabled={isLoading}
                        error={error}
                        placeholder={lastServerPlaceholder || 'neodb.social'}
                    />

                    <!-- Sign in button -->
                    <div class="mt-6">
                        <Button
                            type="submit"
                            loading={isLoading}
                            disabled={
                                isLoading ||
                                isValidating ||
                                !(serverDomain.trim() || lastServerPlaceholder)
                            }
                            class="w-full"
                        >
                            {#if isLoading}
                                Connecting...
                            {:else if isValidating}
                                Validating...
                            {:else}
                                Continue
                            {/if}
                        </Button>
                    </div>

                    <!-- Help text -->
                    <!-- <div class="mt-4 text-center text-xs text-[var(--muted)]">
                        Don't have a NeoDB account?
                        <a
                            href="https://neodb.social"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="font-medium text-[var(--accent)] hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                            Get started
                        </a>
                    </div> -->
                </form>
            </Card>
        </div>

		<!-- Footer -->
        <div class="mt-8 text-center text-[11px] text-[var(--muted)]" in:fade={{ duration: 300, delay: 400 }}>
            <p>Secure authentication powered by Better Auth</p>
        </div>
    </div>
</div>
