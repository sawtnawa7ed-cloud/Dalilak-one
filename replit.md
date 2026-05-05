# Workspace

## Overview

pnpm workspace monorepo using TypeScript with two products:
1. **صوتنا واحد** — Arabic RTL Lebanese media mobile app (Expo)
2. **دليلك** — Lebanon accessibility guide website (React+Vite + Express backend)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build composite libs (needed before leaf typechecks)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed:dalilak` — seed Lebanese geo + places data

## Artifacts

| Artifact | Preview | Description |
|---|---|---|
| dalilak | /dalilak/ | Lebanon accessibility guide website |
| mobile | (Expo) | صوتنا واحد mobile app |
| api-server | /api/ | Express REST API for dalilak |

## دليلك — Architecture

### User Roles
- **visitor**: no login required, can search/view places, submit complaints
- **expert**: field evaluator, needs admin approval, can add places + evaluations + photos
- **admin**: full control, manages experts, sees complaints, can delete places

### Key Features
- 8 Lebanese governorates, 22+ cities, 18+ areas in DB
- GPS-based "take me there" → Google Maps directions
- Field evaluation checklist: ramps, elevators, accessible bathrooms, parking, sign language, braille
- Photo upload by experts (URL-based)
- Complaint system (stored in DB, admin can reply by email)
- Star ratings from expert evaluations

### Auth System
- **Admin (owner)**: logs in with email + password. Can change name/password from settings tab.
- **Experts/Associations**: Admin creates them (name only), generates a unique code (`DAL-XXXXXX`). Expert logs in with code only via "دخول بالكود" tab.
- **Visitors**: self-register with email + password.

### Test Credentials
- Admin: `majdi@dalilak.lb` / `dalilak2o26`
- Expert (code login): `DAL-AB3X7Y`
- Visitor: `ali@dalilak.lb` / `visitor123`

### DB Schema (lib/db/src/schema/dalilak.ts)
Tables: governorates, cities, areas, users, places, place_photos, evaluations, complaints

### API (lib/api-spec/openapi.yaml)
Endpoints: /auth/*, /geo/*, /places/*, /experts/*, /complaints, /stats

### Auth
Simple token: base64 of `userId:timestamp:dalilak` (no JWT library dependency)
Password: sha256 hash with `dalilak_salt` suffix

## صوتنا واحد — Architecture
- Default admin password: `sawtna2024`
- AuthContext with login/logout
- 4-tab admin panel: publish, profile, manage, security
- Home feed, posts tab, post detail screen

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
