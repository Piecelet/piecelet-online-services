<script lang="ts">
    import { Combobox } from 'melt/components';
    import { fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import {
        NEODB_SERVERS,
        PUBLIC_SERVERS_ENDPOINT,
        STORAGE_KEYS,
        SERVERS_CACHE_TTL_MS
    } from '$lib/constants';
    import { getItem, setItem } from '$lib/utils/storage';

    interface ServerComboboxProps {
        value: string;
        disabled?: boolean;
        error?: string | null;
        onInputChange?: (value: string) => void;
        onSubmit?: () => void;
        placeholder?: string;
    }

    let {
        value = $bindable(),
        disabled = false,
        error = null,
        onInputChange,
        onSubmit,
        placeholder = 'neodb.social'
    }: ServerComboboxProps = $props();

    /** Public servers state (autofill list) */
    type ServerItem = { value: string; description: string };
    let servers = $state<ServerItem[]>([...NEODB_SERVERS]);
    let serversLoaded = $state(false);
    let serversLoading = $state(false);

    // Load servers from cache or network
    onMount(async () => {
        try {
            // Try cache first
            const cached = getItem(STORAGE_KEYS.SERVERS_CACHE);
            const cachedAtStr = getItem(STORAGE_KEYS.SERVERS_CACHE_AT);
            const cachedAt = cachedAtStr ? Number(cachedAtStr) : 0;
            const fresh = cached && cachedAt && Date.now() - cachedAt < SERVERS_CACHE_TTL_MS;

            if (fresh) {
                const parsed = JSON.parse(cached) as any[];
                const mapped = normalizeServers(parsed);
                if (mapped.length) {
                    servers = mapped;
                    serversLoaded = true;
                    return;
                }
            }

            serversLoading = true;
            const res = await fetch(PUBLIC_SERVERS_ENDPOINT, { mode: 'cors' });
            if (res.ok) {
                const data = (await res.json()) as any[];
                const mapped = normalizeServers(data);
                if (mapped.length) {
                    servers = mapped;
                    setItem(STORAGE_KEYS.SERVERS_CACHE, JSON.stringify(mapped));
                    setItem(STORAGE_KEYS.SERVERS_CACHE_AT, String(Date.now()));
                }
            }
        } catch (e) {
            // Silently fall back to built-in list
            console.warn('Failed to load public servers, using fallback list');
        } finally {
            serversLoaded = true;
            serversLoading = false;
        }
    });

    // Normalize possible API shapes to { value, description }
    function normalizeServers(arr: any[]): ServerItem[] {
        if (!Array.isArray(arr)) return [];
        return arr
            .map((item) => {
                if (!item) return null;
                if (typeof item === 'string') return { value: item, description: '' };
                const value = item.value || item.domain || item.host || item.name || '';
                const description = item.description || item.label || item.title || '';
                if (typeof value !== 'string' || value.trim() === '') return null;
                return { value: value.trim(), description: String(description || '').trim() };
            })
            .filter(Boolean) as ServerItem[];
    }

    // Filter servers based on input value
    function getFilteredServers(combobox: any) {
        const query = combobox.inputValue.trim().toLowerCase();

        // If not touched yet, show all servers
        if (!combobox.touched) {
            return servers;
        }

        // If no query, show all
        if (!query) {
            return servers;
        }

        // Filter based on value or description
        return servers.filter(
            (server) =>
                server.value.toLowerCase().includes(query) ||
                server.description.toLowerCase().includes(query)
        );
    }

    // Shared helpers for syncing value and submitting
    function syncFrom(target: HTMLInputElement) {
        value = target.value;
        onInputChange?.(target.value);
    }

    function requestFormSubmitFrom(target: HTMLInputElement) {
        const form = (target.form || target.closest('form')) as HTMLFormElement | null;
        if (form) form.requestSubmit();
        else onSubmit?.();
    }

    // Handle input changes: always reflect raw text to bound value
    function handleInput(combobox: any) {
        return (e: Event) => {
            syncFrom(e.currentTarget as HTMLInputElement);
        };
    }

    // Ensure composition text (IME) is also reflected immediately
    function handleComposition(combobox: any) {
        return (e: CompositionEvent) => {
            syncFrom(e.currentTarget as HTMLInputElement);
        };
    }

    // On blur, sync once more to capture any pending edits
    function handleBlur(combobox: any) {
        return (e: FocusEvent) => {
            syncFrom(e.currentTarget as HTMLInputElement);
        };
    }

    // Handle keyboard: Enter submits via the parent form to share same path as the button
    function handleKeyDown(combobox: any) {
        return (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                // Prevent Combobox default selection behavior and use the form submit instead
                e.preventDefault();
                const input = e.currentTarget as HTMLInputElement;
                // Do not force-set value here to avoid clobbering with empty/placeholder.
                // 'value' is already kept in sync by input/composition/blur handlers.
                requestFormSubmitFrom(input);
            }
        };
    }
</script>

<div class="space-y-2">
	<Combobox bind:value>
		{#snippet children(combobox)}
			<label for={combobox.ids.input} class="block text-sm font-medium text-[var(--text)]">
				NeoDB Instance
			</label>

            <div class="relative">
                <!-- Input field -->
                <input
                    {...combobox.input}
                    id={combobox.ids.input}
                    placeholder={placeholder}
                    disabled={disabled}
                    oninput={handleInput(combobox)}
                    onkeydown={handleKeyDown(combobox)}
                    oncompositionstart={handleComposition(combobox)}
                    oncompositionupdate={handleComposition(combobox)}
                    oncompositionend={handleComposition(combobox)}
                    onblur={handleBlur(combobox)}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? 'server-error' : undefined}
                    class="w-full round border px-3 py-2.5 text-[15px] placeholder:text-[var(--muted)] outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60 {error
                        ? 'border-red-300 bg-red-50/50 text-red-900 focus-visible:border-red-400 focus-visible:ring-red-400 dark:border-red-800 dark:bg-red-950/20 dark:text-red-100'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]'}"
                />

				<!-- Dropdown content -->
				{#if combobox.open}
					{@const filtered = getFilteredServers(combobox)}
                    <div
                        {...combobox.content}
                        transition:fly={{ duration: 150, y: -4 }}
                        class="absolute z-50 mt-1 w-full max-h-80 overflow-auto round border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
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
                                <div>
                                    {#if serversLoading}
                                        Loading servers…
                                    {:else}
                                        Type a domain to continue
                                    {/if}
                                </div>
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
				Select or enter the address of your NeoDB instance.
			</p>
		{/snippet}
	</Combobox>
</div>
