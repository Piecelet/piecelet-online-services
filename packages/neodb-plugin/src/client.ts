
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
 * NeoDB API Client
 * Shared client for interacting with NeoDB instances
 */
export class NeoDBApiClient {
    private baseUrl: string;
    private token: string;

    constructor(instance: string, token: string) {
        // Ensure instance is just the host, but handle if full URL is passed
        const host = instance.replace(/^https?:\/\//, "").replace(/\/$/, "");
        this.baseUrl = `https://${host}`;
        this.token = token;
    }

    /**
     * Helper to make authenticated requests
     */
    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = new URL(path, this.baseUrl);

        // Add params if they are in options (custom extension to RequestInit for internal use, 
        // but here we just manually handle searchParams in specific methods for clarity)

        const headers = {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
            ...options.headers,
        };

        const response = await fetch(url.toString(), {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`NeoDB API error: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<T>;
    }

    /**
     * Fetch user's shelf data
     */
    async fetchShelf(category?: string) {
        let path = "/api/me/shelf";
        if (category) {
            path += `/${category}`;
        }
        return this.request(path);
    }

    /**
     * Fetch user's marks (ratings, reviews, annotations)
     */
    async fetchMarks(filters?: NeoDBMarkFilters) {
        const params = new URLSearchParams();
        if (filters?.year) params.set("year", filters.year.toString());
        if (filters?.category) params.set("category", filters.category);
        if (filters?.limit) params.set("limit", filters.limit.toString());
        if (filters?.offset) params.set("offset", filters.offset.toString());

        const queryString = params.toString();
        const path = `/api/me/marks${queryString ? `?${queryString}` : ""}`;

        return this.request(path);
    }

    /**
     * Fetch a specific item
     */
    async fetchItem(itemId: string) {
        return this.request(`/api/item/${itemId}`);
    }

    /**
     * Fetch user's collection statistics
     */
    async fetchStats() {
        return this.request("/api/me/stats");
    }
}

/**
 * Functional exports for backwards compatibility/simpler usage
 */
export async function fetchNeoDBShelf(instance: string, token: string, category?: string) {
    const client = new NeoDBApiClient(instance, token);
    return client.fetchShelf(category);
}

export async function fetchNeoDBMarks(instance: string, token: string, filters?: NeoDBMarkFilters) {
    const client = new NeoDBApiClient(instance, token);
    return client.fetchMarks(filters);
}

export async function fetchNeoDBItem(instance: string, token: string, itemId: string) {
    const client = new NeoDBApiClient(instance, token);
    return client.fetchItem(itemId);
}

export async function fetchNeoDBStats(instance: string, token: string) {
    const client = new NeoDBApiClient(instance, token);
    return client.fetchStats();
}
