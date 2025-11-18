# NeoDB API Integration Usage

This document explains how to use the NeoDB API proxy in the wrapped service.

## Architecture

```
客户端 → [JWT] → apps/wrapped → [JWT] → apps/api → [NeoDB Token] → neodb.social
```

**Security Flow:**
1. User authenticates with apps/api and gets JWT
2. Client calls apps/wrapped with JWT
3. apps/wrapped forwards request to apps/api with same JWT
4. apps/api validates JWT, fetches NeoDB token from database
5. apps/api calls NeoDB with access token
6. Response flows back to client

**Key Security Features:**
- NeoDB access token NEVER exposed to client
- Token stays in apps/api database
- JWT used for authentication between services
- Automatic token revocation on logout

## Available Endpoints

### 1. Get Shelf Data

**Endpoint:** `GET /api/neodb/shelf`

**Query Parameters:**
- `category` (optional): `wishlist`, `progress`, or `complete`

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:8788/api/neodb/shelf?category=complete"
```

**Response:**
```json
{
  "items": [...],
  "count": 42,
  "category": "complete"
}
```

### 2. Get Marks (Ratings/Reviews)

**Endpoint:** `GET /api/neodb/marks`

**Query Parameters:**
- `year` (optional): Filter by year (e.g., `2024`)
- `category` (optional): Filter by category
- `limit` (optional): Number of results
- `offset` (optional): Pagination offset

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:8788/api/neodb/marks?year=2024&limit=50"
```

**Response:**
```json
{
  "marks": [
    {
      "item": {...},
      "rating": 5,
      "comment": "Great book!",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 156
}
```

### 3. Get Item Details

**Endpoint:** `GET /api/neodb/item/:id`

**Path Parameters:**
- `id`: Item ID or UUID

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:8788/api/neodb/item/abc123"
```

**Response:**
```json
{
  "id": "abc123",
  "title": "Example Book",
  "author": "Author Name",
  "rating": 4.5,
  ...
}
```

### 4. Get User Statistics

**Endpoint:** `GET /api/neodb/stats`

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:8788/api/neodb/stats"
```

**Response:**
```json
{
  "total_items": 250,
  "total_marks": 180,
  "reading_hours": 1200,
  "top_categories": [...],
  ...
}
```

## Usage in Code

### TypeScript/JavaScript Example

```typescript
// Get JWT from apps/api first
const authResponse = await fetch('http://api-url/api/auth/token', {
  credentials: 'include'
});
const { token } = await authResponse.json();

// Use JWT to call wrapped service
const shelfResponse = await fetch('http://wrapped-url/api/neodb/shelf?category=complete', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const shelfData = await shelfResponse.json();
console.log('Complete shelf:', shelfData);

// Get 2024 reading data
const marksResponse = await fetch('http://wrapped-url/api/neodb/marks?year=2024', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const marks2024 = await marksResponse.json();
console.log('2024 readings:', marks2024);
```

### Frontend Integration Example

```typescript
// Store JWT in memory or secure storage
let jwt: string | null = null;

async function login() {
  const response = await fetch('http://api-url/api/auth/token', {
    credentials: 'include'
  });
  const data = await response.json();
  jwt = data.token;
}

async function getNeoDBShelf(category?: string) {
  if (!jwt) throw new Error('Not authenticated');

  const url = new URL('http://wrapped-url/api/neodb/shelf');
  if (category) url.searchParams.set('category', category);

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${jwt}` }
  });

  return response.json();
}

// Usage
await login();
const complete = await getNeoDBShelf('complete');
const wishlist = await getNeoDBShelf('wishlist');
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: JWT invalid or NeoDB token unavailable
- `404 Not Found`: NeoDB account not connected
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "error": "NeoDB account not connected"
}
```

## Configuration

### Environment Variables

**apps/wrapped** needs:
```bash
API_URL=http://localhost:8787  # Development
API_URL=https://api.piecelet.app  # Production
```

Add to `wrangler.jsonc`:
```json
{
  "vars": {
    "API_URL": "http://localhost:8787"
  }
}
```

## Data Model

### Database Schema (apps/api)

**users table:**
- `email`: With instance suffix (e.g., `user@example.com+neodb.social`)
- `realEmail`: Original email without suffix
- `username`: Unique identifier (e.g., `@username@neodb.social`)

**accounts table:**
- `accessToken`: NeoDB access token (server-only)
- `instance`: NeoDB instance domain (e.g., `neodb.social`)
- `isAccessTokenRedacted`: Token revocation status

## Security Best Practices

1. ✅ **Never expose NeoDB access token to client**
2. ✅ **Always use JWT for authentication**
3. ✅ **Validate JWT on every request**
4. ✅ **Check token revocation status**
5. ✅ **Use HTTPS in production**
6. ✅ **Implement rate limiting** (TODO)
7. ✅ **Add request logging** (TODO)

## Future Enhancements

- [ ] Add response caching (reduce NeoDB API calls)
- [ ] Implement rate limiting per user
- [ ] Add webhook support for data sync
- [ ] Support multiple NeoDB accounts per user
- [ ] Add data aggregation/statistics endpoints
