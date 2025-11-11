<script lang="ts">
  import { authClient } from "$lib/auth-client";

  let instance = "";
  let errorMsg: string | null = null;

  const session = authClient.useSession();

  function startNeoDB() {
    errorMsg = null;
    const inst = instance.trim();
    if (!inst) {
      errorMsg = "请输入 NeoDB 实例地址";
      return;
    }
    const u = new URL(window.location.origin);
    const callbackURL = `${u.origin}/`; // 登录成功后回到首页（可按需修改）
    const start = new URL(`/api/auth/neodb/start`, u.origin);
    start.searchParams.set("instance", inst);
    start.searchParams.set("callbackURL", callbackURL);
    window.location.href = start.toString();
  }
</script>

<h1>Login</h1>

{#if $session.data}
  <p>已登录：{$session.data.user.email}</p>
  <button onclick={() => authClient.signOut()}>Sign out</button>
{:else}
  {#if errorMsg}
    <p style="color: crimson">{errorMsg}</p>
  {/if}
  <div style="display: grid; gap: 8px; max-width: 360px;">
    <input placeholder="NeoDB 实例（例如 neodb.social 或 https://neodb.social）" bind:value={instance} />
    <button onclick={startNeoDB}>使用 NeoDB 登录</button>
  </div>
{/if}
