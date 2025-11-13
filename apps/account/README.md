# Piecelet Account - SvelteKit Frontend

This is the account management frontend for Piecelet, built with SvelteKit and Better Auth.

## Features

- NeoDB OAuth authentication
- Account dashboard with user info
- Session management
- Geolocation tracking
- Connected accounts overview

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Running API server at `http://localhost:8787`

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy the environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```env
VITE_API_URL=http://localhost:8787
```

### Running the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Building for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── lib/
│   └── auth.ts              # Better Auth client configuration
├── routes/
│   ├── +page.svelte         # Login page with NeoDB (server dropdown)
│   ├── +layout.svelte       # Root layout
│   ├── auth/
│   │   └── callback/
│   │       └── +page.svelte # OAuth callback handler
│   └── dashboard/
│       └── +page.svelte     # User dashboard
└── app.css                  # Global styles (Tailwind CSS)
```

## Authentication Flow

### NeoDB OAuth

1. User enters NeoDB instance (e.g., `neodb.social`)
2. User clicks "Sign in with NeoDB"
3. User is redirected to API `/api/auth/neodb/start`
4. User authorizes on NeoDB instance
5. User is redirected back to `/auth/callback`
6. Session is established and user is redirected to `/dashboard`

### Server List

On the login page, the NeoDB server field is a Combobox (unstyled Melt UI) which:
- Prefills suggestions from `https://neodb-public-api.piecelet.app/servers` (domain + description)
- Allows manual entry of a domain (e.g., `neodb.social`)

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: `http://localhost:8787`)

## Deployment

This app is configured for Cloudflare Pages deployment using the SvelteKit Cloudflare adapter.

To deploy:

```bash
pnpm deploy
```

Make sure to set the `VITE_API_URL` environment variable in your Cloudflare Pages settings to point to your production API.

## Technologies

- **SvelteKit 2**: Application framework
- **Svelte 5**: UI framework with runes
- **Better Auth**: Authentication client
- **Tailwind CSS 4**: Styling
- **TypeScript**: Type safety
- **Cloudflare Pages**: Hosting platform
