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
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
	LAST_SERVER: 'piecelet:last-server'
} as const;
