<script lang="ts">
  import { authClient } from "$lib/auth-client";

  let email = "";
  let password = "";
  let name = "";
  let errorMsg: string | null = null;

  const session = authClient.useSession();

  async function doSignUp() {
    errorMsg = null;
    const { error } = await authClient.signUp.email(
      { email, password, name },
      {
        onError: (ctx) => {
          errorMsg = ctx.error.message;
        },
      },
    );
  }

  async function doSignIn() {
    errorMsg = null;
    const { error } = await authClient.signIn.email(
      { email, password },
      {
        onError: (ctx) => {
          errorMsg = ctx.error.message;
        },
      },
    );
  }
</script>

<h1>Login</h1>

{#if $session.data}
  <p>Signed in as {$session.data.user.email}</p>
  <button onclick={() => authClient.signOut()}>Sign out</button>
{:else}
  {#if errorMsg}
    <p style="color: crimson">{errorMsg}</p>
  {/if}
  <div style="display: grid; gap: 8px; max-width: 360px;">
    <input
      placeholder="Email"
      bind:value={email}
      type="email"
      autocomplete="email"
      required
    />
    <input
      placeholder="Password"
      bind:value={password}
      type="password"
      autocomplete="current-password"
      required
    />
    <input placeholder="Name (for sign up)" bind:value={name} />
    <div style="display: flex; gap: 8px;">
      <button onclick={doSignIn}>Sign in</button>
      <button onclick={doSignUp}>Sign up</button>
    </div>
  </div>
{/if}
