/**
 * NeoDB API Client
 * Wrapper functions for calling NeoDB API endpoints
 */

export interface NeoDBShelfCategory {
  wishlist?: string;
  progress?: string;
  complete?: string;
}

export interface NeoDBMarkFilters {
  year?: number;
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch user's shelf data from NeoDB
 * @param instance - NeoDB instance domain (e.g., "neodb.social")
 * @param token - Access token
 * @param category - Shelf category (wishlist, progress, complete)
 */
export async function fetchNeoDBShelf(
  instance: string,
  token: string,
  category?: string
): Promise<any> {
  const baseUrl = `https://${instance}`;
  let endpoint = `${baseUrl}/api/me/shelf`;

  if (category) {
    endpoint += `/${category}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`NeoDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch user's marks (ratings, reviews, annotations) from NeoDB
 * @param instance - NeoDB instance domain
 * @param token - Access token
 * @param filters - Optional filters (year, category, pagination)
 */
export async function fetchNeoDBMarks(
  instance: string,
  token: string,
  filters?: NeoDBMarkFilters
): Promise<any> {
  const baseUrl = `https://${instance}`;
  const url = new URL(`${baseUrl}/api/me/marks`);

  if (filters?.year) {
    url.searchParams.set("year", filters.year.toString());
  }
  if (filters?.category) {
    url.searchParams.set("category", filters.category);
  }
  if (filters?.limit) {
    url.searchParams.set("limit", filters.limit.toString());
  }
  if (filters?.offset) {
    url.searchParams.set("offset", filters.offset.toString());
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`NeoDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a specific item from NeoDB
 * @param instance - NeoDB instance domain
 * @param token - Access token
 * @param itemId - Item ID or UUID
 */
export async function fetchNeoDBItem(
  instance: string,
  token: string,
  itemId: string
): Promise<any> {
  const baseUrl = `https://${instance}`;
  const endpoint = `${baseUrl}/api/item/${itemId}`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`NeoDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch user's collection statistics
 * @param instance - NeoDB instance domain
 * @param token - Access token
 */
export async function fetchNeoDBStats(
  instance: string,
  token: string
): Promise<any> {
  const baseUrl = `https://${instance}`;
  const endpoint = `${baseUrl}/api/me/stats`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`NeoDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
