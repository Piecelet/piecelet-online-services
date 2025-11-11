# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Better Auth integration

This project is configured with Better Auth (TypeScript-first auth) using a local SQLite database.

- Server config: `src/lib/auth.ts`
- SvelteKit hook: `src/hooks.server.ts`
- Client: `src/lib/auth-client.ts`
- Example UI: `src/routes/login/+page.svelte` and `src/routes/+page.svelte`

Setup the database schema and run:

```
pnpm install

# approve build scripts for prisma when prompted by pnpm (one-time)
pnpm approve-builds

# generate and migrate schema for SQLite (creates database.sqlite)
pnpm dlx @better-auth/cli generate
pnpm dlx @better-auth/cli migrate

pnpm dev
```

Open `/login` to sign up or sign in. Session state is exposed via `authClient.useSession()` on the client and via `event.locals.session`/`event.locals.user` on the server.
