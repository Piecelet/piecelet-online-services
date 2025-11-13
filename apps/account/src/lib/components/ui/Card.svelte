<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface CardProps extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
	}

	let { class: className = '', children, ...restProps }: CardProps = $props();
</script>

<div
	class="round border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm transition-shadow duration-200 hover:shadow-md {className}"
	style="box-shadow: var(--shadow-sm)"
	{...restProps}
>
	{@render children()}
</div>
