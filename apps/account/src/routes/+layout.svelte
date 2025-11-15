<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import { t } from '$lib/i18n';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header class="sticky top-0 z-20 border-b border-[var(--border)]/80 bg-[var(--surface)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--surface)/0.6]">
  <div class="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
    <a href="/" class="flex items-center gap-2 text-[var(--text)]">
      <span class="inline-block size-2.5 rounded-full bg-[var(--accent)]"></span>
      <span class="text-sm font-semibold tracking-[-0.01em]">Piecelet Connect</span>
    </a>
    <nav class="flex items-center gap-3 text-xs text-[var(--muted)]">
      <a href="https://piecelet.app" target="_blank" rel="noreferrer" class="hover:text-[var(--text)]">{t.nav_download_piecelet()}</a>
    </nav>
  </div>
  </header>

<main class="pb-12">
  {@render children?.()}
</main>

<footer class="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border)]/80 bg-[var(--surface)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--surface)/0.6]">
  <div class="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4 sm:px-6 text-[11px] text-[var(--muted)]">
    <span>© {new Date().getFullYear()} Piecelet</span>
    <div class="flex items-center gap-3">
      <a
        href="https://github.com/Piecelet/piecelet-online-services"
        target="_blank"
        rel="noreferrer"
        aria-label="View Piecelet online services on GitHub"
        class="text-[var(--muted)] hover:text-[var(--text)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34a2.65 2.65 0 0 0-1.11-1.46c-.91-.62.07-.6.07-.6a2.1 2.1 0 0 1 1.54 1.03 2.14 2.14 0 0 0 2.92.83 2.16 2.16 0 0 1 .64-1.35c-2.22-.25-4.55-1.11-4.55-4.94A3.87 3.87 0 0 1 6.4 7.4a3.6 3.6 0 0 1 .1-2.66s.84-.27 2.75 1.02a9.38 9.38 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.37.84.41 1.8.1 2.66a3.86 3.86 0 0 1 1.03 2.68c0 3.84-2.34 4.68-4.57 4.93a2.4 2.4 0 0 1 .69 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
          />
        </svg>
      </a>
      <LanguageSwitcher />
    </div>
  </div>
</footer>
