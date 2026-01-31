# Architecture Overview

This document describes the high-level architecture for the MAXIMUS PWA
and is intended as a clean baseline for future clones.

## Core Goals

- Offline-first usability on low-end Android devices
- Fast, responsive UI with minimal bundle size
- Reliable sync with Supabase when online
- Clear separation of UI, domain logic, and data access

## Key Building Blocks

- **React + Vite** for UI and build pipeline
- **Tailwind CSS** for styling and design tokens
- **IndexedDB** for local persistence
- **Supabase** for auth and remote data
- **PWA plugin** for installable app and offline caching

## High-Level Data Flow

1. User interacts with UI (React components).
2. Local data is written to IndexedDB for offline reliability.
3. A sync engine pushes changes to Supabase when online.
4. Remote changes are pulled and merged into local cache.
5. UI reads from local cache for fast rendering.

## Offline-First Strategy

- Local cache is the source of truth for UI.
- All writes are recorded locally first.
- Sync runs in the background to reconcile changes.
- Soft-delete uses `deleted_at` for tombstones.

## PWA Strategy

- App is installable via the browser.
- Static assets are cached for offline startup.
- Data is cached in IndexedDB to keep UI functional offline.

## Extension Points for New Builds

- Swap or extend the sync engine for new entities.
- Add new pages by composing existing layout patterns.
- Use the design tokens in `src/index.css` for consistent UI.
