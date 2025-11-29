# better-auth-neodb

NeoDB OAuth plugin for [Better Auth](https://www.npmjs.com/package/better-auth).

It provides:

- A `neodbOAuthPlugin` that plugs into Better Auth
- NeoDB-specific schema extensions for `user`, `account`, `neodbClient`, and `neodbState`
- A secure access token reveal endpoint with a short-lived window
- Sign-out hooks that revoke NeoDB tokens and redact them in your database

> This package is currently developed inside the Piecelet monorepo, but is designed to be usable in any Better Auth project.

## Installation

```bash
npm install better-auth better-auth-neodb
# or
pnpm add better-auth better-auth-neodb
```

## Basic usage

```ts
import { betterAuth } from "better-auth";
import { neodbOAuthPlugin } from "better-auth-neodb";

export const auth = betterAuth({
  /* your Better Auth config */,
  plugins: [
    neodbOAuthPlugin,
  ],
});
```

This will:

- Extend your Better Auth schema with NeoDB-related models and fields
- Add `/neodb/start`, `/neodb/callback`, and `/neodb/token/reveal` endpoints
- Register a sign-out hook that revokes NeoDB access tokens and redacts them in your `account` table

## Endpoints

The plugin currently wires the following endpoints into your Better Auth API routes:

- `GET /neodb/start`
  - Starts the NeoDB OAuth flow.
  - Expects `?instance=` (NeoDB instance, e.g. `neodb.social`) and optional `?callbackURL=`.
- `GET /neodb/callback`
  - Handles the OAuth callback, exchanges the code for tokens, and links/creates the user.
  - Syncs NeoDB profile data into your Better Auth `user` and `account` records.
  - Clears any previous token reveal timestamp so the user gets a fresh reveal window.
- `GET /neodb/token/reveal`
  - Returns the raw NeoDB access token for the authenticated user.
  - First reveal sets `tokenRevealedAt`.
  - Subsequent reveals are only allowed for 5 minutes after `tokenRevealedAt`.
  - After that window passes, the endpoint returns an error and requires the user to re-authenticate.

## Schema extensions

The plugin augments the Better Auth schema with:

- `user`:
  - `externalAcct?: string` – NeoDB external account handle.
  - `realEmail?: string` – original email without instance suffix.
- `account`:
  - `isAccessTokenRedacted?: boolean` – whether the access token has been redacted.
  - `instance?: string` – NeoDB instance domain (e.g. `neodb.social`).
  - `tokenRevealedAt?: Date` – last time the access token was revealed to the user.
- `neodbClient`:
  - Stores per-instance OAuth client credentials and redirect URI.
- `neodbState`:
  - Stores OAuth state/instance/callback URL for the PKCE flow.

Your database adapter must support these additional models/fields. If you use the Better Auth CLI to generate schema, the plugin’s `schema` definition will be included automatically.

## Security behavior

- **Instance validation** – The plugin verifies the target instance is a real NeoDB instance via `/api/v2/instance`.
- **PKCE** – Uses PKCE `code_challenge` / `code_verifier` for OAuth.
- **Token reveal window** – Raw access token can be revealed only within a 5-minute window from the first reveal.
- **Reveal reset on login** – Each successful login clears `tokenRevealedAt`, giving the user a fresh reveal window.
- **Sign-out revocation** – On `/sign-out`, the plugin:
  - Finds all NeoDB accounts for the current user
  - Revokes each access token against the NeoDB instance
  - Redacts the stored token as `ACCESS_TOKEN_REDACTED_AT_<timestamp>` and marks `isAccessTokenRedacted = true`

## Cron / maintenance helpers

The package also exports lower-level helpers that you can use in scheduled jobs, for example:

- `getClient`, `saveClient`, `saveState`, `popState`
- `getOrCreateClient`, `buildAuthorizeUrl`, `exchangeToken`, `fetchMe`, `revokeToken`

These let you implement background maintenance (e.g. revoking stale tokens) without re-implementing NeoDB-specific logic.

## Requirements

- Node 18+ (ES2022, ESM)
- `better-auth` `^1.3.34`
- A Better Auth adapter that exposes the models required by the plugin’s schema.

## License

MIT (or the license of your host project; adjust as needed before publishing).

