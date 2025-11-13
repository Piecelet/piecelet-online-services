<script lang="ts">
  import { page } from '$app/stores';

  $: error = $page.url.searchParams.get('error') || 'unknown_error';
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
    <h1 class="text-2xl font-bold text-red-800 mb-4">Authentication Error</h1>

    <div class="space-y-4">
      <div>
        <p class="font-semibold text-red-700">Error Code:</p>
        <p class="font-mono text-sm bg-red-100 p-2 rounded">{error}</p>
      </div>

      <div class="text-sm text-gray-700">
        <p class="font-semibold mb-2">Common errors:</p>
        <ul class="list-disc list-inside space-y-1">
          <li><code>database_unavailable</code> - Database adapter not initialized</li>
          <li><code>invalid_instance</code> - Invalid NeoDB instance URL</li>
          <li><code>app_registration_failed</code> - Failed to register OAuth app</li>
          <li><code>state_not_found</code> - OAuth state mismatch</li>
          <li><code>oauth_code_verification_failed</code> - Token exchange failed</li>
        </ul>
      </div>

      <div class="pt-4">
        <a href="/login" class="text-blue-600 hover:underline">← Back to login</a>
      </div>
    </div>
  </div>
</div>
