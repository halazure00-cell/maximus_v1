# PWA and Offline-First Model

This document describes the offline-first approach used by the app.
Use it as a reference when cloning or rebuilding the PWA.

## PWA Foundations

- Installable via browser (Vite PWA plugin)
- Static assets cached for fast startup
- Works with flaky or limited connectivity

## Local-First Data Strategy

- UI reads from local cache (IndexedDB)
- Writes are persisted locally first
- Sync runs in the background when online

## Sync Principles

- Prefer idempotent operations
- Keep a durable log of local operations
- Merge remote updates into local cache
- Use timestamps to resolve conflicts

## Soft Delete Strategy

- Records are marked with `deleted_at`
- Tombstones are required for multi-device sync
- Avoid hard DELETE in client code

## Failure Modes and Expectations

- Offline: user can create/edit data; sync later
- Network errors: operations remain queued
- Conflicts: latest timestamp wins; avoid silent data loss
