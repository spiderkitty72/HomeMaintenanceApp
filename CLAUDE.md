# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build (uses --webpack flag)
npm start            # Start production server
npx prisma migrate dev --name <name>  # Create and apply a migration
npx prisma db seed   # Seed DB (admin@example.com / maintenance)
npx prisma studio    # GUI for database
npm run docker:build # Bump version + build Docker image
npm run docker:up    # Full Docker deploy
./docker-push.sh     # Build and push version + latest tags to Docker Hub
```

No test runner is configured. Linting uses Next.js's built-in ESLint flat config.

## Architecture Overview

Full-stack **Next.js 16 App Router** app for tracking maintenance on assets (vehicles, equipment, property). Uses **React Server Components** with **Server Actions** for all data mutations — there are no dedicated API routes for CRUD.

**Stack**: Next.js 16 · React 19 · Prisma 5 (SQLite) · NextAuth.js v5 · Tailwind CSS 4 · Shadcn UI · Zod · react-hook-form

### Data Layer

- **Database**: SQLite at `./dev.db` (dev) or `/app/data/dev.db` (Docker)
- **ORM**: Prisma — schema at `prisma/schema.prisma`, migrations in `prisma/migrations/`
- All mutations go through Server Actions in `src/lib/actions/`. Each action calls `ensurePermission()` or `checkPermission()` before touching the DB, then calls `revalidatePath("/dashboard")` to bust the Next.js cache.

### Auth & Permissions

- **NextAuth.js v5** (credentials only — email + bcrypt password). Config at `src/auth.ts`. JWT sessions; `user.role` is injected into the session token.
- Two roles: `ADMIN` (bypasses all checks) and `USER`.
- Group-based RBAC: `Permission` rows define which groups can `CREATE/EDIT/DELETE/VIEW` each resource (`ASSET/SERVICE/FUEL/PART`). All users default to CREATE + VIEW. Logic lives in `src/lib/permissions.ts`.
- Asset sharing: `AssetShare` table gives per-asset `READ/WRITE/ADMIN` to specific users.

### Core Domain Modules

| Domain | Actions file | Key entities |
|---|---|---|
| Assets | `src/lib/actions/assets.ts` | `Asset`, `AssetShare`, `AssetSpec` |
| Service Records | `src/lib/actions/service.ts` | `ServiceRecord`, `Attachment` |
| Fuel | `src/lib/actions/fuel.ts` | `FuelRecord` |
| Parts / Inventory | `src/lib/actions/parts.ts`, `inventory.ts` | `Part`, `InventorySystem`, `InventoryItem` |
| Schedules | `src/lib/actions/schedules.ts` | `ServiceSchedule` |
| Admin | `src/lib/actions/admin.ts` | `User`, `Group`, `Permission`, `SystemSetting` |

### Usage Tracking

Assets track `currentUsage` (mileage/hours), `dailyUsage`, and `usageUpdatedAt`. `src/lib/usage.ts` recalculates the rolling daily usage rate from fuel/service history. Schedules use this to predict `nextDueDate` via `predictNextDueDate()`.

### Maintenance Reminders

`processServiceReminders()` runs daily (cron) and emails users about schedules due within 7 days. SMTP settings are stored in the `SystemSetting` DB table (not env vars).

### Component Conventions

- **Feature folders** under `src/app/dashboard/` — each has its own page + components.
- **Shared UI** in `src/components/ui/` (Shadcn primitives) and `src/components/` (app-level shared).
- **Forms**: always `react-hook-form` + Zod resolver + Shadcn `<Form>` components.
- **Toasts**: Sonner via `toast.success()` / `toast.error()`.
- Asset `details` is stored as a JSON string with dynamic keys (make, model, year, vin, address, etc.) — parse/stringify at component boundaries.
- `Attachment` is polymorphic — single table with optional FKs to service records, fuel records, part purchases, and assets.

## Environment Variables

```
DATABASE_URL=file:./dev.db
AUTH_SECRET=<generate with: npx auth secret>
AUTH_TRUST_HOST=true
AUTH_URL=https://your-domain.com   # required in production
```
