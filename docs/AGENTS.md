# AGENTS.md - Repository Guide for Coding Agents

This file is the operational handbook for automated or agentic coding
assistants working in this repo. Keep changes minimal and aligned with
existing conventions.

## Repo Summary

- App: MAXIMUS PWA (React + Vite + Tailwind)
- Runtime: Node.js 20 (see `.nvmrc`)
- Tests: Vitest + Testing Library (jsdom)
- Lint: ESLint (see `eslint.config.js`)
- Data: Supabase (migrations and seeds in `supabase/`)

## Build / Lint / Test Commands

Run commands from repo root.

### Install

- `npm ci` (CI) or `npm install` (local)

### Development

- `npm run dev`
- `npm run preview` (serve production build)

### Preflight Env Check

- `npm run preflight`
- Production build will fail if required env vars are missing.

### Build

- `npm run build`

### Lint

- `npm run lint`

### Tests (Vitest)

- `npm run test` (run all tests once)
- `npm run test:watch` (watch mode)
- `npm run test:ui` (Vitest UI)
- `npm run test:coverage`

#### Run a single test file

- `npm run test -- src/lib/__tests__/syncHelpers.test.js`
- `npm run test -- src/components/__tests__/Components.test.jsx`

#### Run a single test by name

- `npm run test -- -t "should return positive when server is newer"`

#### Run a single test file in watch mode

- `npm run test:watch -- src/lib/__tests__/financeMetrics.test.js`

## Environment Variables

See `.env.example`.
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL` (needed for some deployments/codespaces)

Never commit secrets. Do not log secrets to console.

## Code Style Guidelines

Follow existing patterns in nearby files; avoid stylistic churn.

### Language / Framework

- JavaScript (ES modules), React 18, Vite
- Functional components + hooks are the norm
- Use `StrictMode` (see `src/main.jsx`)
- Prefer lazy-loaded routes for heavy screens

### Formatting

- No enforced formatter in repo (ESLint only)
- Match the file's existing style (indentation, semicolons)
- Avoid mixing styles in the same file

### Imports

- Order: external packages first, then internal modules
- Keep related imports grouped
- Prefer named imports from React (`useEffect`, `useState`, etc.)

### File Organization

- Pages: `src/pages/`
- Reusable components: `src/components/`
- Utilities/lib: `src/lib/`
- Context providers: `src/context/`

### Tailwind + Design Tokens

- Tailwind is primary styling system
- Prefer `ui-` tokens defined in `src/index.css`
- Avoid hardcoded colors unless required for gradients/accents

### Error Handling

- Use `ErrorBoundary` for UI crashes
- Log errors with context; avoid noisy logs in production
- Prefer user-friendly error messages and fallback UI

### Testing

- Tests live in `__tests__` folders
- Prefer behavior-based tests over implementation details
- Keep tests deterministic; mock external APIs
- Test setup in `src/test/setupTests.js`

## Cursor / Copilot Rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md`
  found in this repository at time of writing.

## When Changing Code

- Prefer minimal, targeted changes
- Preserve existing behavior unless explicitly requested
- Keep UI consistent with current patterns and design tokens
