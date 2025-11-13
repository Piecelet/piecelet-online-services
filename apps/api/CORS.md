# CORS Configuration

This document explains the CORS (Cross-Origin Resource Sharing) and origin configuration for the Piecelet Account API.

## Overview

The API uses a **centralized origin configuration** in `src/config/origins.ts` that is shared between:
- **Hono CORS middleware** - HTTP-level CORS headers
- **Better Auth `trustedOrigins`** - Application-level origin validation

This prevents "INVALID_ORIGIN" errors by ensuring both layers use the same whitelist.

## Centralized Configuration

All allowed origins are managed in `src/config/origins.ts`:

```typescript
// Production origins
export const PRODUCTION_ORIGINS = [
    "https://account.piecelet.app",
    "https://online.piecelet.app",
    "https://services.piecelet.app",
    "https://www.piecelet.app",
    "https://piecelet.app",
];

// Development origins (includes localhost)
export const DEVELOPMENT_ORIGINS = [
    "http://localhost:5173",    // Default Vite dev server
    "http://localhost:5174",    // Alternative Vite port
    "http://localhost:5175",    // Alternative Vite port
    "http://localhost:4173",    // Vite preview server
    "http://localhost:8787",    // API dev server
    "http://127.0.0.1:5173",    // IPv4 localhost
    // ... more variants
];

// Combined list used by Better Auth
export const ALL_ALLOWED_ORIGINS = [
    ...PRODUCTION_ORIGINS,
    ...DEVELOPMENT_ORIGINS,
];
```

## How It Works

### 1. CORS Middleware (Hono)

The CORS middleware checks the `Origin` header:

```typescript
app.use("*", cors({
    origin: getAllowedOrigin,  // Uses centralized config
    credentials: true,
    // ...
}));
```

### 2. Better Auth Trusted Origins

Better Auth validates origins at the application level:

```typescript
betterAuth({
    trustedOrigins: [...ALL_ALLOWED_ORIGINS],
    // ...
});
```

This prevents the `INVALID_ORIGIN` error that occurs when Better Auth receives a request from an origin not in its trusted list.

## Allowed Origins

### Production Origins

- `https://account.piecelet.app` - Account management frontend
- `https://online.piecelet.app` - Online services
- `https://services.piecelet.app` - Services platform
- `https://www.piecelet.app` - Main website
- `https://piecelet.app` - Root domain

### Development Origins

- `http://localhost:5173` - Default Vite dev server
- `http://localhost:5174-5175` - Alternative Vite ports
- `http://localhost:4173` - Vite preview server
- `http://localhost:8787` - API dev server (same-origin)
- `http://127.0.0.1:*` - IPv4 localhost variants

## CORS Headers

### Allowed Headers
- `Content-Type`
- `Authorization`
- `Cookie`

### Allowed Methods
- `GET`
- `POST`
- `PUT`
- `DELETE`
- `OPTIONS`

### Exposed Headers
- `Content-Length`
- `Set-Cookie`

### Additional Settings
- **Credentials**: `true` (allows cookies and authentication headers)
- **Max Age**: `600` seconds (10 minutes for preflight caching)

## Testing

### Development Testing

```bash
# Terminal 1: Start API server
cd apps/api
pnpm dev

# Terminal 2: Start account frontend
cd apps/account
pnpm dev

# The frontend at http://localhost:5173 should work without CORS errors
```

### Verify Origins

You can test if an origin is allowed:

```typescript
import { isOriginAllowed } from './config/origins';

console.log(isOriginAllowed('http://localhost:5173')); // true
console.log(isOriginAllowed('https://account.piecelet.app')); // true
console.log(isOriginAllowed('https://evil.com')); // false
```

## Troubleshooting

### Error: "INVALID_ORIGIN"

This error comes from **Better Auth**, not CORS. It means the origin is not in the `trustedOrigins` list.

**Solution:**
1. Add the origin to `PRODUCTION_ORIGINS` or `DEVELOPMENT_ORIGINS` in `src/config/origins.ts`
2. The change will automatically apply to both CORS and Better Auth

### Error: "No 'Access-Control-Allow-Origin' header"

This is a **CORS middleware** error.

**Solution:**
1. Check the origin is in `src/config/origins.ts`
2. Ensure the origin matches exactly (including protocol and port)
3. Check browser console for the actual origin being sent

### Credentials Not Working

Ensure:
1. `credentials: true` is set in CORS config
2. Frontend sends `credentials: 'include'` in fetch requests
3. Origin is explicitly allowed (not using wildcard `*`)

## Adding New Origins

To add a new allowed origin, edit `src/config/origins.ts`:

### For Production Domains

```typescript
export const PRODUCTION_ORIGINS = [
    "https://account.piecelet.app",
    "https://new-app.piecelet.app", // Add here
    // ...
];
```

### For Development Localhost

```typescript
export const DEVELOPMENT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000", // Add here
    // ...
];
```

**The change will automatically apply to:**
- ✅ Hono CORS middleware
- ✅ Better Auth trustedOrigins
- ✅ All API endpoints

## Architecture Benefits

### Centralized Management
- Single source of truth for all origins
- No risk of mismatch between CORS and Better Auth
- Easy to add/remove origins

### Type Safety
- Origins are defined as `const` arrays
- TypeScript ensures consistency
- Compile-time validation

### Automatic Propagation
- Change in one place updates everywhere
- Reduces configuration errors
- Maintains consistency

## Security Considerations

- ✅ Never use wildcard (`*`) with credentials
- ✅ Always use HTTPS in production (HTTP only for localhost)
- ✅ Keep allowed origins list minimal
- ✅ Regularly review and audit origins
- ✅ Use exact matches for production domains
- ✅ Both CORS and Better Auth check origins independently
