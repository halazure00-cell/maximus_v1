# Data and Supabase

This document covers the data layer and Supabase conventions.

## Supabase Overview

- Supabase provides auth and Postgres storage
- Client uses `@supabase/supabase-js`
- Auth is required for user-owned tables

## Migrations and Seeds

- Migrations live in `supabase/migrations/`
- Seeds live in `supabase/seeds/`
- Apply migrations before deploying new code

## Table Conventions

- User-owned rows include `user_id`
- Sync tables include `updated_at` and `deleted_at`
- Client-side sync uses `client_tx_id` where applicable

## Environment Configuration

Set required variables in `.env` or hosting provider:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL` (for hosted environments)

## Data Safety Rules

- Do not store secrets in client code
- Keep PII to a minimum
- Prefer soft-delete over hard delete
