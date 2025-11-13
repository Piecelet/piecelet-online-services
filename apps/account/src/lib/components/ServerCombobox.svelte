<script lang="ts">
	import { Combobox } from 'melt/components';
	import { fly } from 'svelte/transition';
	import { NEODB_SERVERS } from '$lib/constants';

	interface ServerComboboxProps {
		value: string;
		disabled?: boolean;
		error?: string | null;
		onInputChange?: (value: string) => void;
		onSubmit?: () => void;
	}

	let {
		value = $bindable(),
		disabled = false,
		error = null,
		onInputChange,
		onSubmit
	}: ServerComboboxProps = $props();

	// Filter servers based on input value
	function getFilteredServers(combobox: any) {
		const query = combobox.inputValue.trim().toLowerCase();

		// If not touched yet, show all servers
		if (!combobox.touched) {
			return NEODB_SERVERS;
		}

		// If no query, show all
		if (!query) {
			return NEODB_SERVERS;
		}

		// Filter based on value or description
		return NEODB_SERVERS.filter(
			(server) =>
				server.value.toLowerCase().includes(query) ||
				server.description.toLowerCase().includes(query)
		);
	}

	// Handle input changes
	function handleInput(combobox: any) {
		return (e: Event) => {
			const target = e.currentTarget as HTMLInputElement;
			onInputChange?.(target.value);
		};
	}

	// Handle keyboard for form submission
	function handleKeyDown(combobox: any) {
		return (e: KeyboardEvent) => {
			// Allow parent to handle Enter key for form submission when combobox is closed
			if (e.key === 'Enter' && !combobox.open) {
				e.preventDefault();
				onSubmit?.();
			}
		};
	}
</script>

<div class="space-y-2">
	<Combobox bind:value>
		{#snippet children(combobox)}
			<label for={combobox.ids.input} class="block text-sm font-medium text-[var(--text)]">
				NeoDB Server
			</label>

			<div class="relative">
				<!-- Input field -->
				<input
					{...combobox.input}
					id={combobox.ids.input}
					placeholder="neodb.social"
					disabled={disabled}
					oninput={handleInput(combobox)}
					onkeydown={handleKeyDown(combobox)}
					aria-invalid={error ? 'true' : 'false'}
					aria-describedby={error ? 'server-error' : undefined}
					class="w-full rounded-xl border px-3 py-2.5 text-[15px] placeholder:text-[var(--muted)] outline-none transition-all duration-200 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 {error
						? 'border-red-300 bg-red-50/50 text-red-900 focus-visible:border-red-400 focus-visible:ring-red-400 dark:border-red-800 dark:bg-red-950/20 dark:text-red-100'
						: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]'}"
				/>

				<!-- Dropdown content -->
				{#if combobox.open}
					{@const filtered = getFilteredServers(combobox)}
					<div
						{...combobox.content}
						transition:fly={{ duration: 150, y: -4 }}
						class="absolute z-50 mt-1 w-full max-h-80 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
					>

						{#if filtered.length === 0}
							<div class="px-3 py-6 text-center text-sm text-[var(--muted)]">
								{#if combobox.inputValue.trim()}
									<div class="space-y-1">
										<div>No servers found</div>
										<div class="text-xs">
											Press <kbd
												class="rounded border border-[var(--border)] bg-[var(--hover)] px-1.5 py-0.5 font-mono text-[10px]"
												>Enter</kbd
											> to use "{combobox.inputValue}"
										</div>
									</div>
								{:else}
									<div>Type a domain to continue</div>
								{/if}
							</div>
						{:else}
							{#each filtered as server (server.value)}
								{@const option = combobox.getOption(server.value, server.value)}
								<div
									{...option}
									class="group cursor-pointer rounded-lg px-3 py-2.5 text-[15px] outline-none transition-colors data-[highlighted]:bg-[var(--hover)]"
								>
									<div class="flex items-center justify-between gap-2">
										<div class="flex-1">
											<div class="font-medium text-[var(--text)]">
												{server.value}
											</div>
											<div class="text-xs text-[var(--muted)]">
												{server.description}
											</div>
										</div>
										{#if combobox.isSelected(server.value)}
											<svg
												class="size-4 text-[var(--accent)]"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2.5"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M5 13l4 4L19 7"
												></path>
											</svg>
										{/if}
									</div>
								</div>
							{/each}

							{#if combobox.inputValue.trim() && !filtered.some((s) => s.value === combobox.inputValue.trim())}
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

			{#if error}
				<p id="server-error" class="text-xs text-red-600 dark:text-red-400" role="alert">
					{error}
				</p>
			{/if}

			<p class="text-xs text-[var(--muted)]">
				Select a server or enter your own NeoDB instance domain
			</p>
		{/snippet}
	</Combobox>
</div>
