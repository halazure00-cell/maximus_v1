# Project Structure

This guide describes the folder layout and responsibilities.

## Root

- `src/` - application source
- `public/` - static assets
- `supabase/` - migrations and seeds
- `scripts/` - build and maintenance scripts
- `docs/` - project documentation

## Source Layout

- `src/main.jsx` - app bootstrap and provider wiring
- `src/App.jsx` - routes and top-level layout
- `src/pages/` - page-level screens
- `src/components/` - reusable UI components
- `src/context/` - React context providers
- `src/lib/` - utilities, data access, and domain logic
- `src/test/` - test setup and helpers
- `src/index.css` - Tailwind base and design tokens

## Naming Conventions

- Components: `PascalCase.jsx`
- Hooks: `useSomething.js`
- Utilities: `camelCase.js`
- Tests: `*.test.js` or `*.test.jsx` under `__tests__/`

## Recommended Module Boundaries

- UI components should be stateless where possible.
- Data access and sync logic should live in `src/lib/`.
- Context providers should manage cross-cutting state only.
