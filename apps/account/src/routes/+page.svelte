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
      const res = await fetch('https://neodb-public-api.piecelet.app/servers');
      if (res.ok) {
        const data = await res.json();
        // Expecting array of { domain, description }
        if (Array.isArray(data)) {
          servers = data.filter((s) => typeof s?.domain === 'string');
        }
      }
    } catch (e) {
      // Silently ignore and allow manual input
    } finally {
      fetchingServers = false;
    }
  }

  const {
    elements: { input, menu, option },
    states: { selected, inputValue, open }
  } = createCombobox({});

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

  function labelFor(domain: string) {
    const s = servers.find((x) => x.domain === domain);
    return s?.description ? `${s.domain} — ${s.description}` : domain;
  }
</script>

<div class="min-h-screen bg-neutral-50">
  <div class="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-semibold tracking-tight text-neutral-900">Piecelet Account</h1>
      <p class="mt-2 text-sm text-neutral-600">Sign in to continue</p>
    </div>

    <div class="rounded-2xl bg-white/90 p-8 shadow-sm ring-1 ring-black/5">
      {#if error}
        <div class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      {/if}

      <div class="space-y-3">
        <label class="block text-sm font-medium text-neutral-800">NeoDB Server</label>

        <div class="relative">
          <input
            use:input
            onkeydown={onInputKeyDown}
            placeholder="neodb.social"
            disabled={loading}
            class="w-full rounded-xl border border-neutral-300/80 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none ring-0 transition focus-visible:border-[rgb(48_102_92)] focus-visible:ring-2 focus-visible:ring-[rgb(48_102_92)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
          />
          <!-- Dropdown menu -->
          <div
            use:menu
            class="z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg"
          >
            {#if servers.length === 0}
              <div class="px-3 py-2 text-sm text-neutral-500">
                {fetchingServers ? 'Loading servers…' : 'No suggestions. Type to enter manually.'}
              </div>
            {:else}
              {#each servers as s (s.domain)}
                <div
                  use:option={{ value: s.domain, label: s.domain }}
                  class="cursor-default rounded-lg px-3 py-2 text-[15px] text-neutral-900 data-[highlighted]:bg-neutral-100"
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
      </div>

      <button
        type="button"
        onclick={handleLogin}
        disabled={loading}
        class="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[rgb(48_102_92)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(48_102_92)] disabled:cursor-not-allowed disabled:opacity-60"
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
