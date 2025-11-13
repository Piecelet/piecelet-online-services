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

	// Load last used server from localStorage
	onMount(() => {
		const lastServer = getItem(STORAGE_KEYS.LAST_SERVER);
		if (lastServer) {
			serverDomain = lastServer;
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

	// Handle sign in
	async function handleSignIn() {
		error = null;

		const sanitized = sanitizeDomain(serverDomain);

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
			const authURL = `${API_URL}/api/auth/neodb/start?instance=${encodeURIComponent(
				sanitized
			)}&callbackURL=${encodeURIComponent(callbackURL)}`;

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

	// Handle form submission event from combobox
	function handleSubmitForm(e: Event) {
		e.preventDefault();
		if (!isLoading && !isValidating) {
			handleSignIn();
		}
	}
</script>

<svelte:window onsubmitform={handleSubmitForm} />

<div class="min-h-screen bg-[var(--bg)]">
	<div
		class="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12"
		in:fade={{ duration: 300, delay: 100 }}
	>
		<!-- Header -->
		<div class="mb-8 text-center" in:fly={{ y: -20, duration: 400, delay: 200, easing: cubicOut }}>
			<h1 class="text-5xl font-semibold tracking-tight text-[var(--text)]">Piecelet</h1>
			<p class="mt-3 text-sm text-[var(--muted)]">Connect your NeoDB account</p>
		</div>

		<!-- Sign in card -->
		<div in:fly={{ y: 20, duration: 400, delay: 300, easing: cubicOut }}>
			<Card>
				<!-- Error message -->
				{#if error}
					<div class="mb-4">
						<ErrorMessage message={error} />
					</div>
				{/if}

				<!-- Server selection -->
				<ServerCombobox
					bind:value={serverDomain}
					onValueChange={(value) => {
						serverDomain = value;
					}}
					onInputChange={handleServerChange}
					disabled={isLoading}
					error={error}
				/>

				<!-- Sign in button -->
				<div class="mt-6">
					<Button
						onclick={handleSignIn}
						loading={isLoading}
						disabled={isLoading || isValidating || !serverDomain.trim()}
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
				<div class="mt-4 text-center text-xs text-[var(--muted)]">
					Don't have a NeoDB account?
					<a
						href="https://neodb.social"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-[var(--accent)] hover:underline focus-visible:underline focus-visible:outline-none"
					>
						Get started
					</a>
				</div>
			</Card>
		</div>

		<!-- Footer -->
		<div
			class="mt-8 text-center text-xs text-[var(--muted)]"
			in:fade={{ duration: 300, delay: 400 }}
		>
			<p>Secure authentication powered by Better Auth</p>
		</div>
	</div>
</div>
