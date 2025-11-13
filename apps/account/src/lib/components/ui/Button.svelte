<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface ButtonProps extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost';
		loading?: boolean;
		children: Snippet;
	}

	let {
		variant = 'primary',
		loading = false,
		disabled = false,
		class: className = '',
		onclick,
		children,
		...restProps
	}: ButtonProps = $props();

	const isDisabled = $derived(disabled || loading);

    const variantClasses = {
        primary:
            'bg-[var(--accent)] text-white shadow-sm hover:brightness-[1.08] focus-visible:ring-[var(--accent)]',
        secondary:
            'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--hover)] focus-visible:ring-[var(--border)]',
        ghost: 'text-[var(--text)] hover:bg-[var(--hover)] focus-visible:ring-[var(--border)]'
    };
</script>

<button
    type="button"
    disabled={isDisabled}
    class="inline-flex h-11 items-center justify-center gap-2 round px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60 {variantClasses[
        variant
    ]} {className}"
    {onclick}
    {...restProps}
>
	{#if loading}
		<svg
			class="size-4 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{@render children()}
</button>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
