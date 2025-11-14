# Piecelet Connect

Piecelet Connect is the online service that lets users connect their NeoDB accounts to Piecelet and manage authentication and sessions for the Piecelet apps.

This repository is a Turborepo monorepo (root package name: `piecelet-online-services`) and was previously named `piecelet-account` before being renamed to `piecelet-connect`.

## Project structure

- `apps/account` – SvelteKit 2 + Svelte 5 frontend for Piecelet Connect, deployed to Cloudflare (Pages/Workers). Handles NeoDB sign‑in, a simple dashboard, and session management.
- `apps/api` – Cloudflare Workers API built with Hono, Better Auth, Drizzle ORM, Cloudflare D1, and KV. Provides auth routes, NeoDB OAuth, geolocation‑aware session handling, and CORS.
- `packages/eslint-config` – Shared ESLint configuration used across the monorepo.
- `packages/typescript-config` – Shared TypeScript configuration presets.
- `packages/types` – Shared TypeScript types.
- `packages/utils` – Shared utility functions for Workers and other packages.

## Requirements

- Node.js 18+  
- pnpm  
- Cloudflare account with Workers, D1, and KV enabled  
- Wrangler CLI (`npm install -g wrangler`)  

## Getting started

Install dependencies at the repo root:

```bash
pnpm install
```

### Run the API (Cloudflare Worker)

The API lives in `apps/api` and uses Cloudflare D1 and KV bindings configured via `wrangler.jsonc`.

1. Copy and customise the Wrangler config if needed:

   ```bash
   cd apps/api
   cp wrangler-template.jsonc wrangler.jsonc  # if you don't already have one
   # fill in ACCOUNT_DATABASE / ACCOUNT_KV details for your Cloudflare account
   ```

2. Start the API in development:

   ```bash
   pnpm dev
   ```

   This runs `wrangler dev` and serves the Better Auth + Hono API locally (see `apps/api/README.md` and `apps/api/CORS.md` for endpoints and CORS details).

### Run the account frontend (Piecelet Connect UI)

The frontend lives in `apps/account` and is a SvelteKit app configured for Cloudflare Pages/Workers.

1. Create and configure environment variables:

   ```bash
   cd apps/account
   cp .env.example .env  # first time only
   ```

   Set `VITE_API_URL` in `.env` (or via Wrangler vars) to point at your API base URL, e.g. your local `wrangler dev` URL or a deployed `apps/api` Worker.

2. Start the SvelteKit dev server:

   ```bash
   pnpm dev
   ```

   The UI will be available on the default Vite dev port (usually `http://localhost:5173`) and will talk to the API configured via `VITE_API_URL`.

### Running everything via Turborepo

From the repository root you can also use the Turborepo scripts:

```bash
# Run all dev targets (API + frontend) in watch mode
pnpm dev

# Build all apps and packages
pnpm build

# Lint and type-check
pnpm lint
pnpm type-check
```

You can filter to a single app using Turbo filters if you prefer more granular control, for example:

```bash
pnpm dev --filter api
pnpm dev --filter account
```

## Deployment

Both apps are configured for Cloudflare:

- `apps/api` – deploy with `pnpm deploy` from `apps/api` (Cloudflare Workers, D1, KV).  
- `apps/account` – deploy with `pnpm deploy` from `apps/account` (SvelteKit Cloudflare adapter).  

For production, make sure:

- The API Worker has D1 and KV bindings configured (see `apps/api/wrangler-template.jsonc`).  
- The account frontend has `VITE_API_URL` pointing at the deployed API (see `apps/account/wrangler-template.jsonc`).  
- Allowed origins are kept in sync with `apps/api/src/config/origins.ts` and documented in `apps/api/CORS.md`.

## Additional documentation

- `apps/account/README.md` – details of the Piecelet Connect SvelteKit frontend and auth flow.  
- `apps/api/README.md` – details of the Better Auth + Hono API.  
- `apps/api/CORS.md` – CORS and origin configuration used by the API.  

If you are coming from the old `piecelet-account` repository, this is the same project, now renamed and organised as `piecelet-connect` with a clearer API/frontend split.
