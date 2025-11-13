<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header class="sticky top-0 z-20 border-b border-[var(--border)]/80 bg-[var(--surface)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--surface)/0.6]">
  <div class="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
    <a href="/" class="flex items-center gap-2 text-[var(--text)]">
      <span class="inline-block size-2.5 rounded-full bg-[var(--accent)]"></span>
      <span class="text-sm font-semibold tracking-[-0.01em]">Piecelet Account</span>
    </a>
    <nav class="flex items-center gap-3 text-xs text-[var(--muted)]">
      <a href="https://piecelet.app" target="_blank" rel="noreferrer" class="hover:text-[var(--text)]">piecelet.app</a>
      <span aria-hidden="true" class="select-none">•</span>
      <a href="https://status.piecelet.app" target="_blank" rel="noreferrer" class="hover:text-[var(--text)]">status</a>
    </nav>
  </div>
  </header>

<main>
  {@render children?.()}
</main>

<footer class="border-t border-[var(--border)]/80">
  <div class="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4 sm:px-6 text-[11px] text-[var(--muted)]">
    <span>© {new Date().getFullYear()} Piecelet</span>
    <a href="https://account.apple.com" target="_blank" rel="noreferrer" class="hover:text-[var(--text)]">Inspired by Apple Account</a>
  </div>
</footer>
