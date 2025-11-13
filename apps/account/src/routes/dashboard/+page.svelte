<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession, signOut } from '$lib/auth';
	import { onMount } from 'svelte';

	const session = useSession();
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

	let geolocation = $state<any>(null);
	let loadingGeo = $state(false);
	let accounts = $state<any[]>([]);
	let loadingAccounts = $state(false);

	// Redirect to login if not authenticated
	$effect(() => {
		if ($session.isPending === false && !$session.data?.session) {
			goto('/');
		}
	});

	async function fetchGeolocation() {
		loadingGeo = true;
		try {
			const response = await fetch(`${API_URL}/api/auth/cloudflare/geolocation`, {
				credentials: 'include'
			});

			if (response.ok) {
				geolocation = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch geolocation:', error);
		} finally {
			loadingGeo = false;
		}
	}

	async function fetchAccounts() {
		loadingAccounts = true;
		try {
			const response = await fetch(`${API_URL}/api/auth/list-accounts`, {
				credentials: 'include'
			});

			if (response.ok) {
				const data = await response.json();
				accounts = data.accounts || [];
			}
		} catch (error) {
			console.error('Failed to fetch accounts:', error);
		} finally {
			loadingAccounts = false;
		}
	}

	async function handleSignOut() {
		await signOut();
		goto('/');
	}

	onMount(() => {
		if ($session.data?.session) {
			fetchGeolocation();
			fetchAccounts();
		}
	});
</script>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-4xl px-4">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Account Dashboard</h1>
				<p class="mt-1 text-sm text-gray-600">Manage your Piecelet account</p>
			</div>
			<button
				onclick={handleSignOut}
				class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
			>
				Sign Out
			</button>
		</div>

		{#if $session.isPending}
			<div class="rounded-lg bg-white p-8 text-center shadow-md">
				<p class="text-gray-600">Loading...</p>
			</div>
		{:else if $session.data}
			<div class="space-y-6">
				<!-- User Info Card -->
				<div class="rounded-lg bg-white p-6 shadow-md">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">User Information</h2>
					<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<dt class="text-sm font-medium text-gray-500">User ID</dt>
							<dd class="mt-1 text-sm text-gray-900">{$session.data.user?.id || 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Name</dt>
							<dd class="mt-1 text-sm text-gray-900">{$session.data.user?.name || 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Email</dt>
							<dd class="mt-1 text-sm text-gray-900">{$session.data.user?.email || 'Anonymous'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Email Verified</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{$session.data.user?.emailVerified ? 'Yes' : 'No'}
							</dd>
						</div>
						{#if $session.data.user?.image}
							<div class="sm:col-span-2">
								<dt class="text-sm font-medium text-gray-500">Avatar</dt>
								<dd class="mt-2">
									<img
										src={$session.data.user.image}
										alt="User avatar"
										class="h-16 w-16 rounded-full"
									/>
								</dd>
							</div>
						{/if}
					</dl>
				</div>

				<!-- Session Info Card -->
				<div class="rounded-lg bg-white p-6 shadow-md">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Session Information</h2>
					<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<dt class="text-sm font-medium text-gray-500">Session ID</dt>
							<dd class="mt-1 text-sm text-gray-900 font-mono break-all">
								{$session.data.session?.id || 'N/A'}
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Created At</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{$session.data.session?.createdAt
									? new Date($session.data.session.createdAt).toLocaleString()
									: 'N/A'}
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Expires At</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{$session.data.session?.expiresAt
									? new Date($session.data.session.expiresAt).toLocaleString()
									: 'N/A'}
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">IP Address</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{$session.data.session?.ipAddress || 'N/A'}
							</dd>
						</div>
					</dl>
				</div>

				<!-- Geolocation Card -->
				{#if loadingGeo}
					<div class="rounded-lg bg-white p-6 shadow-md">
						<h2 class="mb-4 text-xl font-semibold text-gray-900">Geolocation</h2>
						<p class="text-sm text-gray-600">Loading...</p>
					</div>
				{:else if geolocation}
					<div class="rounded-lg bg-white p-6 shadow-md">
						<h2 class="mb-4 text-xl font-semibold text-gray-900">Geolocation</h2>
						<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500">Country</dt>
								<dd class="mt-1 text-sm text-gray-900">{geolocation.country || 'N/A'}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">Region</dt>
								<dd class="mt-1 text-sm text-gray-900">{geolocation.region || 'N/A'}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">City</dt>
								<dd class="mt-1 text-sm text-gray-900">{geolocation.city || 'N/A'}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">Timezone</dt>
								<dd class="mt-1 text-sm text-gray-900">{geolocation.timezone || 'N/A'}</dd>
							</div>
							{#if geolocation.latitude && geolocation.longitude}
								<div class="sm:col-span-2">
									<dt class="text-sm font-medium text-gray-500">Coordinates</dt>
									<dd class="mt-1 text-sm text-gray-900">
										{geolocation.latitude}, {geolocation.longitude}
									</dd>
								</div>
							{/if}
							{#if geolocation.colo}
								<div>
									<dt class="text-sm font-medium text-gray-500">Data Center</dt>
									<dd class="mt-1 text-sm text-gray-900">{geolocation.colo}</dd>
								</div>
							{/if}
						</dl>
					</div>
				{/if}

				<!-- Connected Accounts Card -->
				<div class="rounded-lg bg-white p-6 shadow-md">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Connected Accounts</h2>
					{#if loadingAccounts}
						<p class="text-sm text-gray-600">Loading accounts...</p>
					{:else if accounts.length > 0}
						<ul class="divide-y divide-gray-200">
							{#each accounts as account}
								<li class="py-4">
									<div class="flex items-center justify-between">
										<div>
											<p class="text-sm font-medium text-gray-900">{account.providerId}</p>
											<p class="text-sm text-gray-500">{account.accountId}</p>
										</div>
										<span
											class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
										>
											Connected
										</span>
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-gray-600">No connected accounts found.</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
