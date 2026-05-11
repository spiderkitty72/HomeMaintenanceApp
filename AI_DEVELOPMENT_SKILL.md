# Maintenance App - AI & Developer Guidelines

This file serves as a core "Skill" and checklist for AI assistants and developers working on this repository. Before starting or concluding a major task, review this checklist to ensure consistency and prevent common errors.

## 1. Database & Prisma Operations
Whenever `prisma/schema.prisma` is modified, you MUST NOT forget to:
- [ ] **Generate a Migration:** Generate the raw SQL migration using Prisma (`npx prisma migrate dev` or by manually generating a diff and placing it in `prisma/migrations`).
- [ ] **Deploy Locally:** Apply the migration to the local `dev.db` using `npx prisma migrate deploy`.
- [ ] **Update TypeScript Client:** Run `npx prisma generate` to ensure the TypeScript types reflect the new schema. 
*Failure to do this will cause runtime crashes and persistent linting errors.*

## 2. Server Actions & Permissions
When creating new backend logic (`src/lib/actions`):
- [ ] **Auth Check:** Ensure the user session exists (`const session = await auth();`).
- [ ] **Permission Gate:** Use `ensurePermission` or `checkPermission` for CRUD operations based on the user's Role or Group membership.
- [ ] **Shared Asset Logic:** Always account for the `AssetShare` table when determining if a user has access to edit/view an asset they do not strictly own.
- [ ] **Cache Revalidation:** Use `revalidatePath` to ensure the Next.js cache updates immediately after mutations.

## 3. UI & Aesthetics
When building or modifying components:
- [ ] **Theme Consistency:** Use Tailwind's CSS variables (e.g., `bg-background`, `text-muted-foreground`, `border-muted`) to ensure native support for both Light and Dark modes.
- [ ] **Premium Feel:** Utilize Lucide icons, rounded cards, and subtle hover effects (`hover:bg-muted/30 transition-colors`).
- [ ] **Shadcn UI:** Always prefer importing from `@/components/ui` rather than building custom raw HTML inputs/buttons.

## 4. Smart Forms & State
When building forms with interdependent math (e.g., Fuel Logging: Gallons * Price = Total):
- [ ] **History Tracking:** Implement a 3-way auto-calculation using a `useRef<string[]>` to track the exact order the user modifies fields. This ensures you only auto-calculate the *oldest* unmodified field.
- [ ] **Zero-Clearing:** Use `onFocus` to clear inputs that only contain a `0`, preventing the user from accidentally typing `015` when they meant `15`.

## 5. Docker & Deployment
Before pushing new features to production:
- [ ] **Dependencies:** Ensure all new packages are properly installed and saved in `package.json`.
- [ ] **Next.js Build:** Verify that the app builds successfully without Next.js/Webpack errors by running `npm run build`.
