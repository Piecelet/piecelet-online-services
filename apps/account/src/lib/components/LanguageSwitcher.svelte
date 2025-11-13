<script lang="ts">
  import { setLocale, getLocale, locales } from '$lib/paraglide/runtime';

  let open = $state(false);
  const current = $derived(getLocale());

  function changeLocale(next: string) {
    if (!locales.includes(next as any)) return;
    setLocale(next as any); // default reload to apply globally
  }
</script>

<div class="fixed bottom-4 right-4 z-50">
  <div class="round border border-[var(--border)] bg-[var(--surface)]/95 shadow-md backdrop-blur px-2 py-1.5">
    <label for="lang-select" class="sr-only">Language</label>
    <select
      id="lang-select"
      class="min-w-[120px] bg-transparent text-[13px] text-[var(--text)] outline-none"
      onchange={(e) => changeLocale((e.target as HTMLSelectElement).value)}
    >
      {#each locales as l}
        <option value={l} selected={l === current}>{l}</option>
      {/each}
    </select>
  </div>
  
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>

