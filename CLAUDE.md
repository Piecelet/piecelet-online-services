# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Piecelet Online Services, a SvelteKit application deployed on Cloudflare Workers with D1 database and Better Auth authentication. The project integrates a custom NeoDB OAuth plugin for federated authentication with Mastodon-compatible instances.

## Commands

### Development
```bash
# Start development server using Wrangler (Cloudflare local development)
pnpm dev

# Alternative: Start with Vite dev server
pnpm dev:vite
```

### Database Management
```bash
# Full database setup (auth schema + generate + migrate)
pnpm prepare:db:dev

# Update Better Auth schema only
pnpm auth:update  # Generates and formats auth.schema.ts

# Generate Drizzle migrations
pnpm db:generate

# Apply migrations to local D1 database
pnpm db:migrate:dev

# Apply migrations to production D1 database
pnpm db:migrate:prod

# Open Drizzle Studio for local development
pnpm db:studio:dev

# Open Drizzle Studio for production
pnpm db:studio:prod
```

### Build & Deploy
```bash
# Type check only (no build artifacts)
pnpm build

# Build with Vite (creates actual build artifacts)
pnpm build:vite

# Deploy to Cloudflare Workers
pnpm deploy

# Generate Cloudflare Worker types
pnpm cf-typegen
```

### Code Quality
```bash
# Run linter and check formatting
pnpm lint

# Auto-format code
pnpm format

# Type check with svelte-check
pnpm check
pnpm check:watch
```

## Architecture

### Authentication System

The project uses Better Auth with a custom dual-mode configuration to support both CLI schema generation and runtime execution:

- **Auth Configuration**: `src/lib/auth/index.ts` exports both a default `auth` instance (for CLI) and `createAuth()` function (for runtime)
- **Runtime Initialization**: `src/hooks.server.ts` calls `createAuth()` with Cloudflare env bindings and populates `event.locals.session` and `event.locals.user`
- **Client**: `src/lib/auth-client.ts` provides client-side auth utilities
- **Schema Generation**: Run `pnpm auth:update` to regenerate `src/lib/db/auth.schema.ts` from Better Auth configuration

### Database Architecture

Uses Drizzle ORM with Cloudflare D1 (SQLite):

- **Schema Definition**: `src/lib/db/schema.ts` aggregates all schemas (auth + neodb)
- **Generated Auth Schema**: `src/lib/db/auth.schema.ts` (auto-generated, do not edit manually)
- **NeoDB Schema**: `src/lib/neodb/schema.ts` stores OAuth client registrations
- **Configuration**: `drizzle.config.ts` uses conditional logic for local vs production D1 access
  - Local: Reads from `.wrangler/` directory
  - Production: Requires `CLOUDFLARE_D1_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_API_TOKEN` env vars

### NeoDB OAuth Plugin

Custom Better Auth plugin for federated login via Mastodon-compatible instances (including NeoDB):

- **Plugin**: `src/lib/neodb/plugin.ts` defines OAuth endpoints (`/neodb/start`, `/neodb/callback`)
- **Mastodon API Client**: `src/lib/neodb/mastodon.ts` handles app registration and token exchange
- **State Storage**: `src/lib/neodb/store.ts` manages OAuth state in database
- **Utilities**: `src/lib/neodb/util.ts` validates instance URLs and implements PKCE

Key flow:
1. User initiates login via `/neodb/start?instance=<domain>`
2. System registers/retrieves OAuth client for that instance
3. Redirects to instance authorization page
4. Callback at `/neodb/callback` exchanges code for tokens
5. Fetches user info and creates/updates Better Auth session

### Cloudflare Workers Integration

- **Adapter**: Uses `@sveltejs/adapter-cloudflare` configured in `svelte.config.js`
- **Wrangler Config**: `wrangler.jsonc` defines:
  - D1 database binding: `ACCOUNT_DATABASE`
  - KV namespace binding: `ACCOUNT_KV` (configured but not yet used)
  - Node.js compatibility enabled
- **Worker Entry**: `.svelte-kit/cloudflare/_worker.js` (generated during build)
- **Types**: `src/worker-configuration.d.ts` (generate with `pnpm cf-typegen`)

### UI Framework

- **SvelteKit**: SSR-enabled framework
- **Melt UI**: Headless component library (`@melt-ui/svelte`) with preprocessing
- **Tailwind CSS v4**: Using `@tailwindcss/vite` plugin

## Important Patterns

### Auth Schema Regeneration

When modifying Better Auth configuration in `src/lib/auth/index.ts`:
1. Run `pnpm auth:update` to regenerate schema
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate:dev` to apply locally

### Database Access in Better Auth Context

The auth system expects the D1 database instance from `event.platform.env.ACCOUNT_DATABASE`. The `createAuth()` function in `src/lib/auth/index.ts` handles this by accepting optional `env` and `cf` parameters.

### Handling CLI vs Runtime

The auth configuration uses conditional logic to support both Better Auth CLI tools and runtime execution:
- CLI tools require a `database` adapter with empty DB
- Runtime uses the Cloudflare D1 instance via `withCloudflare()` plugin
