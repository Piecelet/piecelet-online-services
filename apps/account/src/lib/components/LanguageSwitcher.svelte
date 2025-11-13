<script lang="ts">
  import { setLocale, getLocale, locales } from '$lib/paraglide/runtime';

  const current = $derived(getLocale());

  function changeLocale(next: string) {
    if (!locales.includes(next as any)) return;
    setLocale(next as any);
  }
</script>

<label for="lang-select" class="sr-only">Language</label>
<select id="lang-select" onchange={(e) => changeLocale((e.target as HTMLSelectElement).value)}>
  {#each locales as l}
    <option value={l} selected={l === current}>{l}</option>
  {/each}
  </select>

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
