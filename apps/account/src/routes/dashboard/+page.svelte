<script lang="ts">
  import { goto } from '$app/navigation';
  import { useSession, signOut } from '$lib/auth';
  import { Avatar } from 'bits-ui';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';

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

<div class="bg-[var(--bg)]">
  <div class="mx-auto flex min-h-[calc(100svh-104px)] w-full max-w-xl flex-col items-center justify-center px-6">
    {#if $session.isPending}
      <p class="text-[var(--muted)]">Loading…</p>
    {:else if $session.data}
      <Card class="w-full px-8 py-10 text-center">
        <div class="flex flex-col items-center gap-4">
          <Avatar.Root class="h-20 w-20 rounded-full">
            <Avatar.Image src={$session.data.user?.image} alt="avatar" class="h-full w-full rounded-full object-cover" />
            <Avatar.Fallback class="flex h-full w-full items-center justify-center rounded-full bg-[var(--hover)] text-xl font-medium text-[var(--text)]/70">
              {($session.data.user?.name?.[0] || 'U').toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
          <div class="text-center">
            <div class="text-[20px] font-semibold text-[var(--text)]">{$session.data.user?.name || 'User'}</div>
          </div>
          <div class="mt-2">
            <Button variant="secondary" onclick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </Card>
    {/if}
  </div>
</div>
