<script lang="ts">
  import { authClient } from "$lib/auth-client";
  const session = authClient.useSession();
  $effect(() => {
    // no-op; ensures store subscription
    void $session;
  });
</script>

<h1>Welcome to SvelteKit</h1>
{#if $session.data}
  <p>You are signed in as {$session.data.user.email}</p>
  <button onclick={() => authClient.signOut()}>Sign out</button>
{:else}
  <p><a href="/login">Sign in or create an account</a></p>
{/if}
