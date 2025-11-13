/**
 * Validation utilities for server domain input
 */

/**
 * Validates if a string is a valid domain format
 * Accepts: example.com, sub.example.com, example.co.uk
 */
export function isValidDomain(domain: string): boolean {
	if (!domain || domain.trim().length === 0) {
		return false;
	}

	// Remove protocol if present
	const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

	// Basic domain regex: allows letters, numbers, hyphens, and dots
	// Must start and end with alphanumeric, at least one dot
	const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

	return domainRegex.test(cleanDomain);
}

/**
 * Sanitizes domain input by removing protocol and trailing slashes
 */
export function sanitizeDomain(domain: string): string {
	return domain
		.trim()
		.replace(/^https?:\/\//, '')
		.replace(/\/+$/, '')
		.toLowerCase();
}

/**
 * Validates and returns error message if invalid
 */
import { t } from '$lib/i18n';

export function validateServerDomain(domain: string): string | null {
	if (!domain || domain.trim().length === 0) {
		return t.error_enter_domain();
	}

	const sanitized = sanitizeDomain(domain);

	if (!isValidDomain(sanitized)) {
		return t.error_invalid_domain();
	}

	if (sanitized.length > 253) {
		return t.error_domain_too_long();
	}

	return null;
}
