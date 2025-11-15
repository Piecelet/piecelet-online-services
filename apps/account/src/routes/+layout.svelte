<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import GithubIcon from '$lib/icons/github.svg?component';
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
        <GithubIcon class="h-4 w-4" aria-hidden="true" />
      </a>
      <LanguageSwitcher />
    </div>
  </div>
</footer>
