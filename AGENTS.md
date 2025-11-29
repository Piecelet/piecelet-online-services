# Repository Guidelines

This monorepo contains the Piecelet account web app and auth API. Use this guide when contributing or creating agents that modify code here.

## Project Structure & Modules
- Root tooling and config: `package.json`, `turbo.json`, `pnpm-workspace.yaml`.
- Frontend account app: `apps/account` (SvelteKit, Vite, Cloudflare Workers).
- Auth / API worker: `apps/api` (Hono + better-auth, D1/Drizzle).
- Shared packages: `packages/eslint-config`, `packages/types`, `packages/typescript-config`, `packages/utils`.

## Build, Test & Development
- Root dev: `pnpm dev` – run all dev tasks via Turborepo.
- App dev: `pnpm dev --filter account` / `--filter api`.
- Build: `pnpm build` – builds all apps and packages.
- Lint: `pnpm lint` – runs shared ESLint/Prettier config.
- Type check: `pnpm type-check`.
- App-specific: `pnpm dev`, `pnpm build`, `pnpm deploy` in `apps/account` or `apps/api` as defined in each `package.json`.

## Coding Style & Naming
- Use TypeScript everywhere; prefer explicit types on public APIs.
- Formatting: Prettier (`pnpm format` at root, `pnpm format` in apps/account).
- Follow existing patterns in `packages/eslint-config` and `typescript-config`.
- Components, routes, and handlers use PascalCase for Svelte components, camelCase for functions/variables, and kebab-case for file/route names.

## Testing Guidelines
- Use framework-native tools (Svelte Check, type-checking, and any future test suites).
- Before pushing, run at least `pnpm lint` and `pnpm type-check`; for frontend changes also run `pnpm check --filter account` when available.

## Commits & Pull Requests
- Write concise, imperative commit messages (e.g., `feat: add password reset flow`, `fix(api): handle expired sessions`).
- Keep changes scoped to a single concern; update docs or config alongside code.
- PRs should include: a short summary, related issues, testing notes (commands run), and screenshots or API examples for UI or behavior changes.
