<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { fly } from 'svelte/transition';
	import { NEODB_SERVERS } from '$lib/constants';

	interface ServerComboboxProps {
		value: string;
		onValueChange: (value: string) => void;
		disabled?: boolean;
		error?: string | null;
		onInputChange?: (value: string) => void;
	}

	let {
		value = $bindable(),
		onValueChange,
		disabled = false,
		error = null,
		onInputChange
	}: ServerComboboxProps = $props();

	let open = $state(false);
	let searchQuery = $state('');

	// Initialize search query with current value
	$effect(() => {
		if (value && searchQuery !== value) {
			searchQuery = value;
		}
	});

	// Filter servers based on search query
	const filteredServers = $derived(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return NEODB_SERVERS;

		return NEODB_SERVERS.filter(
			(server) =>
				server.value.toLowerCase().includes(query) ||
				server.description.toLowerCase().includes(query)
		);
	});

	function handleInputChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		searchQuery = target.value;
		onInputChange?.(target.value);
	}

	function handleKeyDown(e: KeyboardEvent) {
		// Allow parent to handle Enter key for form submission
		if (e.key === 'Enter' && !open) {
			e.preventDefault();
			const handler = (e.currentTarget as HTMLElement)?.dispatchEvent;
			if (handler) {
				const enterEvent = new CustomEvent('submitform', { bubbles: true });
				(e.currentTarget as HTMLElement).dispatchEvent(enterEvent);
			}
		}
	}
</script>

<div class="space-y-2">
	<label for="server-input" class="block text-sm font-medium text-[var(--text)]">
		NeoDB Server
	</label>

	<Combobox.Root type="single" bind:value bind:open {disabled}>
		<div class="relative">
			<Combobox.Input
				id="server-input"
				placeholder="neodb.social"
				bind:value={searchQuery}
				oninput={handleInputChange}
				onkeydown={handleKeyDown}
				aria-invalid={error ? 'true' : 'false'}
				aria-describedby={error ? 'server-error' : undefined}
				class="w-full rounded-xl border px-3 py-2.5 text-[15px] placeholder:text-[var(--muted)] outline-none transition-all duration-200 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 {error
					? 'border-red-300 bg-red-50/50 text-red-900 focus-visible:border-red-400 focus-visible:ring-red-400 dark:border-red-800 dark:bg-red-950/20 dark:text-red-100'
					: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]'}"
			/>

			<Combobox.Portal>
				<Combobox.Content
					sideOffset={4}
					align="start"
					forceMount
					class="z-50 w-[--bits-combobox-anchor-width]"
				>
					{#snippet child({ props, wrapperProps, open: isOpen })}
						<div {...wrapperProps}>
							{#if isOpen}
								<div
									{...props}
									transition:fly={{ duration: 150, y: -4 }}
									class="max-h-80 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
								>
									{#if filteredServers.length === 0}
										<div class="px-3 py-6 text-center text-sm text-[var(--muted)]">
											{#if searchQuery.trim()}
												<div class="space-y-1">
													<div>No servers found</div>
													<div class="text-xs">
														Press <kbd
															class="rounded border border-[var(--border)] bg-[var(--hover)] px-1.5 py-0.5 font-mono text-[10px]"
															>Enter</kbd
														> to use "{searchQuery}"
													</div>
												</div>
											{:else}
												<div>Type a domain to continue</div>
											{/if}
										</div>
									{:else}
										{#each filteredServers as server (server.value)}
											<Combobox.Item
												value={server.value}
												label={server.value}
												class="group cursor-pointer rounded-lg px-3 py-2.5 text-[15px] outline-none transition-colors data-[highlighted]:bg-[var(--hover)]"
											>
												<div class="font-medium text-[var(--text)]">
													{server.value}
												</div>
												<div class="text-xs text-[var(--muted)]">
													{server.description}
												</div>
											</Combobox.Item>
										{/each}

										{#if searchQuery.trim() && !filteredServers.some((s) => s.value === searchQuery.trim())}
											<div
												class="mt-1 border-t border-[var(--border)] pt-1.5 text-xs text-[var(--muted)]"
											>
												<div class="px-3 py-2">
													Can't find your server? Press <kbd
														class="rounded border border-[var(--border)] bg-[var(--hover)] px-1.5 py-0.5 font-mono text-[10px]"
														>Enter</kbd
													> to use custom domain
												</div>
											</div>
										{/if}
									{/if}
								</div>
							{/if}
						</div>
					{/snippet}
				</Combobox.Content>
			</Combobox.Portal>
		</div>
	</Combobox.Root>

	{#if error}
		<p id="server-error" class="text-xs text-red-600 dark:text-red-400" role="alert">
			{error}
		</p>
	{/if}

	<p class="text-xs text-[var(--muted)]">
		Select a server or enter your own NeoDB instance domain
	</p>
</div>
