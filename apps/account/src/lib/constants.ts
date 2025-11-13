/**
 * Curated list of NeoDB server instances
 */
export const NEODB_SERVERS = [
	{ value: 'neodb.social', description: 'Official public instance' },
	{ value: 'neodb.app', description: 'Global community server' },
	{ value: 'neodb.cn', description: 'China regional server' }
] as const;

/**
 * API configuration
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * Public servers source (for auto-fill)
 */
export const PUBLIC_SERVERS_ENDPOINT = 'https://neodb-public-api.piecelet.app/servers';

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
	LAST_SERVER: 'piecelet:last-server',
	SERVERS_CACHE: 'piecelet:neodb-servers',
	SERVERS_CACHE_AT: 'piecelet:neodb-servers:ts'
} as const;

/** Cache TTL for public servers list (12 hours) */
export const SERVERS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
