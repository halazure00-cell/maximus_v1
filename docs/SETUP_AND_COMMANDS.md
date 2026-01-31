# Setup and Commands

This is the quickstart for running the app locally or cloning a clean
baseline for a new PWA.

## Prerequisites

- Node.js 20.x
- npm (bundled with Node)

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=https://your-domain.com
```

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Tests

```bash
npm run test
```

### Run a single test file

```bash
npm run test -- src/lib/__tests__/syncHelpers.test.js
```

### Run a single test by name

```bash
npm run test -- -t "should return positive when server is newer"
```

## Preflight Check

```bash
npm run preflight
```

The production build fails if required env vars are missing.
