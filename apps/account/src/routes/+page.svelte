<script lang="ts">
  import { goto } from '$app/navigation';
  import { useSession } from '$lib/auth';
  import { onMount } from 'svelte';
  import { createCombobox } from '@melt-ui/svelte';

  type Server = { domain: string; description?: string };

  let servers = $state<Server[]>([]);
  let error = $state('');
  let loading = $state(false);
  let fetchingServers = $state(true);

  const session = useSession();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

  // Redirect to dashboard if already logged in
  $effect(() => {
    if ($session.data?.session) {
      goto('/dashboard');
    }
  });

  onMount(async () => {
    await loadServers();
  });

  async function loadServers() {
    fetchingServers = true;
    try {
      const res = await fetch('https://neodb-public-api.piecelet.app/servers', { cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      servers = normalizeServers(data);
    } catch (e) {
      // Fallback list so there is always at least one suggestion
      servers = [{ domain: 'neodb.social', description: 'NeoDB default' }];
    } finally {
      // Ensure there is at least one item
      if (!servers || servers.length === 0) {
        servers = [{ domain: 'neodb.social', description: 'NeoDB default' }];
      }
      fetchingServers = false;
    }
  }

  function normalizeServers(data: any): Server[] {
    // If array of strings
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'string') {
        return (data as string[]).map((d) => ({ domain: d }));
      }
      // Array of objects
      return (data as any[])
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const domain = item.domain || item.host || item.hostname || item.url || item.instance;
          const description = item.description || item.note || item.title;
          if (typeof domain === 'string') {
            return { domain, description } as Server;
          }
          return null;
        })
        .filter(Boolean) as Server[];
    }

    // If object with known keys
    if (data && typeof data === 'object') {
      // Nested `servers` key
      if (Array.isArray(data.servers)) return normalizeServers(data.servers);

      // domains + descriptions arrays aligned by index
      if (Array.isArray(data.domains)) {
        const descArr = Array.isArray(data.descriptions) ? data.descriptions : [];
        return (data.domains as any[])
          .map((d: any, i: number) => {
            if (typeof d === 'string') return { domain: d, description: descArr[i] } as Server;
            if (d && typeof d === 'object' && typeof d.domain === 'string') return { domain: d.domain, description: d.description } as Server;
            return null;
          })
          .filter(Boolean) as Server[];
      }

      // Object map { domain: description }
      const entries = Object.entries(data as Record<string, any>);
      if (entries.length > 0) {
        const mapped = entries
          .map(([k, v]) => {
            if (k.includes('.')) return { domain: k, description: typeof v === 'string' ? v : undefined } as Server;
            return null;
          })
          .filter(Boolean) as Server[];
        if (mapped.length > 0) return mapped;
      }
    }

    return [];
  }

  const {
    elements: { input, menu, option },
    states: { selected, inputValue, open }
  } = createCombobox({});

  // Reflect selected item into input value for click selection UX
  $effect(() => {
    const sel = $selected;
    if (sel) {
      inputValue.set((sel.label ?? sel.value ?? '').toString());
    }
  });

  // Filter suggestions as user types (client-side)
  const filteredServers = $derived(() => {
    const q = ($inputValue || '').toLowerCase().trim();
    if (!q) return servers;
    return servers.filter((s) =>
      s.domain.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    );
  });

  const topSuggestions = $derived(() => servers.slice(0, 8));

  function handleLogin() {
    error = '';
    const value = ($selected?.value ?? $inputValue)?.toString().trim();
    if (!value) {
      error = 'Please select or enter a server domain';
      return;
    }
    loading = true;
    const callbackURL = window.location.origin + '/auth/callback';
    const authURL = `${API_URL}/api/auth/neodb/start?instance=${encodeURIComponent(value)}&callbackURL=${encodeURIComponent(callbackURL)}`;
    window.location.href = authURL;
  }

  function onInputKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleLogin();
    }
  }

  // no-op helper removed for minimal surface
</script>

<div class="min-h-screen bg-neutral-50">
  <div class="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-semibold tracking-tight text-neutral-900">Piecelet Account</h1>
      <p class="mt-2 text-sm text-neutral-600">Sign in to continue</p>
    </div>

    <div class="rounded-2xl bg-white p-8 border border-neutral-200">
      {#if error}
        <div class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      {/if}

      <div class="space-y-3">
        <label class="block text-sm font-medium text-neutral-800">NeoDB Server</label>

        <div class="relative">
          <input
            use:input
            onfocus={() => open.set(true)}
            onkeydown={onInputKeyDown}
            placeholder="neodb.social"
            disabled={loading}
            class="w-full rounded-xl border border-neutral-300/80 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none ring-0 transition focus-visible:border-[rgb(48_102_92)] focus-visible:ring-2 focus-visible:ring-[rgb(48_102_92)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
          />
          <!-- Dropdown menu -->
          <div
            use:menu
            class="z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-neutral-200 bg-white p-1.5"
          >
            {#if filteredServers.length === 0}
              <div class="px-3 py-2 text-sm text-neutral-500">
                {fetchingServers ? 'Loading servers…' : 'No suggestions. Type to enter manually.'}
              </div>
            {:else}
              {#each filteredServers as s (s.domain)}
                <div
                  use:option={{ value: s.domain, label: s.domain }}
                  class="cursor-pointer rounded-lg px-3 py-2 text-[15px] text-neutral-900 data-[highlighted]:bg-neutral-100"
                >
                  <div class="font-medium">{s.domain}</div>
                  {#if s.description}
                    <div class="text-xs text-neutral-500">{s.description}</div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>
        <p class="text-xs text-neutral-500">Select from list or type a domain</p>

        <!-- Always-visible light suggestions -->
        {#if topSuggestions.length > 0}
          <div class="mt-2 flex flex-wrap gap-2">
            {#each topSuggestions as s (s.domain)}
              <button
                type="button"
                onclick={() => inputValue.set(s.domain)}
                class="rounded-full border border-neutral-300/80 px-3 py-1 text-xs text-neutral-800 hover:bg-neutral-100"
                aria-label={`Use ${s.domain}`}
              >
                {s.domain}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <button
        type="button"
        onclick={handleLogin}
        disabled={loading}
        class="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[rgb(48_102_92)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(48_102_92)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : 'Sign in with NeoDB'}
      </button>
    </div>

    <div class="mt-6 text-center text-xs text-neutral-500">
      <p>
        By signing in, you agree to our
        <a href="/terms" class="text-[rgb(48_102_92)] hover:underline">Terms of Service</a>
        and
        <a href="/privacy" class="text-[rgb(48_102_92)] hover:underline">Privacy Policy</a>
      </p>
    </div>
  </div>
</div>
