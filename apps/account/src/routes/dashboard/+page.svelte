<script lang="ts">
  import { goto } from '$app/navigation';
  import { useSession, signOut } from '$lib/auth';

  const session = useSession();

  // Redirect to login if not authenticated
  $effect(() => {
    if ($session.isPending === false && !$session.data?.session) {
      goto('/');
    }
  });

  async function handleSignOut() {
    await signOut();
    goto('/');
  }
</script>

<div class="min-h-screen bg-neutral-50">
  <div class="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6">
    {#if $session.isPending}
      <p class="text-neutral-600">Loading…</p>
    {:else if $session.data}
      <div class="flex flex-col items-center gap-4">
        {#if $session.data.user?.image}
          <img src={$session.data.user.image} alt="avatar" class="h-20 w-20 rounded-full object-cover" />
        {:else}
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200 text-xl font-medium text-neutral-700">
            {($session.data.user?.name?.[0] || 'U').toUpperCase()}
          </div>
        {/if}
        <div class="text-center">
          <div class="text-xl font-semibold text-neutral-900">{$session.data.user?.name || 'User'}</div>
        </div>
        <button
          onclick={handleSignOut}
          class="mt-2 inline-flex items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(48_102_92)]"
        >
          Sign Out
        </button>
      </div>
    {/if}
  </div>
  
</div>
