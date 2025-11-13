<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { HTMLAttributes } from 'svelte/elements';

	interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
		message: string | null;
	}

	let { message, class: className = '', ...restProps }: ErrorMessageProps = $props();
</script>

{#if message}
	<div
		role="alert"
		aria-live="assertive"
		transition:fade={{ duration: 200 }}
		class="rounded-xl border border-red-200/60 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200 {className}"
		{...restProps}
	>
		{message}
	</div>
{/if}
