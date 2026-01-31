# RLS Overview

This document summarizes the row level security (RLS) model used in the
app and is intended to guide future clones.

## Principles

- RLS is enabled on user-owned tables
- Users can only access rows where `user_id = auth.uid()`
- Soft-delete is enforced via `deleted_at` updates

## Recommended Policies

- SELECT: allow user-owned rows
- INSERT: allow when `user_id` matches `auth.uid()`
- UPDATE: allow when `user_id` matches `auth.uid()`
- DELETE: avoid in client apps; use soft-delete

## Soft-Delete Strategy

- Client updates `deleted_at` instead of hard delete
- Tombstones are required for offline sync
- UI should filter out `deleted_at IS NOT NULL`

## Verification Checklist

- RLS enabled on all user tables
- Policies cover SELECT/INSERT/UPDATE
- No client-usable DELETE policies
