/**
 * LocalStorage utilities with type safety and error handling
 */

/**
 * Safely get item from localStorage
 */
export function getItem(key: string): string | null {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		return localStorage.getItem(key);
	} catch (error) {
		console.warn(`Failed to get item from localStorage: ${key}`, error);
		return null;
	}
}

/**
 * Safely set item in localStorage
 */
export function setItem(key: string, value: string): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	try {
		localStorage.setItem(key, value);
		return true;
	} catch (error) {
		console.warn(`Failed to set item in localStorage: ${key}`, error);
		return false;
	}
}

/**
 * Safely remove item from localStorage
 */
export function removeItem(key: string): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	try {
		localStorage.removeItem(key);
		return true;
	} catch (error) {
		console.warn(`Failed to remove item from localStorage: ${key}`, error);
		return false;
	}
}
