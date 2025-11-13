<script lang="ts">
  import { goto } from '$app/navigation';
  import { useSession, signOut } from '$lib/auth';
  import { Avatar } from 'bits-ui';

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

<div class="min-h-screen bg-[var(--bg)]">
  <div class="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6">
    {#if $session.isPending}
      <p class="text-[var(--muted)]">Loading…</p>
    {:else if $session.data}
      <div class="flex flex-col items-center gap-4">
        <Avatar.Root class="h-20 w-20 rounded-full">
          <Avatar.Image src={$session.data.user?.image} alt="avatar" class="h-full w-full rounded-full object-cover" />
          <Avatar.Fallback class="flex h-full w-full items-center justify-center rounded-full bg-[var(--hover)] text-xl font-medium text-[var(--text)]/70">
            {($session.data.user?.name?.[0] || 'U').toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
        <div class="text-center">
          <div class="text-xl font-semibold text-[var(--text)]">{$session.data.user?.name || 'User'}</div>
        </div>
        <button
          onclick={handleSignOut}
          class="mt-2 inline-flex items-center justify-center rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Sign Out
        </button>
      </div>
    {/if}
  </div>
  
</div>
