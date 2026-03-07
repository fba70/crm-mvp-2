# CRM MVP V2 - Trufalo AI

## Project Overview
A CRM (Customer Relationship Management) application built with Next.js 16 and React 19. Manages tasks, clients, contacts, feeds, and notifications.

## Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Prisma ORM (with Accelerate extension)
- **Auth:** better-auth (email/password, Google, GitHub OAuth)
- **UI:** Tailwind CSS v4, shadcn/ui (Radix primitives), lucide-react icons
- **Forms:** react-hook-form + zod validation
- **Styling:** class-variance-authority, clsx, tailwind-merge
- **Email:** Resend
- **AI:** OpenAI API integration
- **HTTP Client:** Axios

## Commands
- `npm run dev` - Start dev server with Turbopack
- `npm run build` - Production build with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client (runs automatically on `npm install`)
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open Prisma Studio

## Project Structure
```
src/
  app/
    (auth)/          # Auth pages: sign-in, sign-up, forgot-password, reset-password
    (main)/          # Authenticated pages with Navbar/Footer layout
      admin/         # Admin panel
      clients/       # Client management (list + [id] detail)
      contacts/      # Contact management (list + [id] detail)
      dashboard/     # Dashboard
      feed/          # Feed/activity (list + [id] detail)
      profile/       # User profile settings
      tasks/         # Task management (list + [id] detail)
      transitions/   # Task transfers
    api/
      auth/[...all]/ # better-auth API route
      feed/          # Feed API endpoints
      openai/        # OpenAI API proxy
  components/
    ui/              # shadcn/ui components (DO NOT manually edit)
    business/        # Business-specific components
    icons/           # Custom icon components
  lib/
    auth.ts          # better-auth server config
    auth-client.ts   # better-auth client
    prisma.ts        # Prisma client instance
    validation.ts    # Zod schemas
    email.ts         # Email sending via Resend
    axios.ts         # Axios instance
    utils.ts         # cn() and other utilities
  hooks/             # Custom React hooks
  generated/prisma/  # Generated Prisma client (gitignored)
prisma/
  schema.prisma      # Database schema
  migrations/        # Migration files
```

## Code Style
- No semicolons (configured in .prettierrc)
- Prettier with tailwindcss plugin for class sorting
- Path alias: `@/*` maps to `./src/*`
- Components use named exports
- Server components by default; `"use client"` only when needed

## Database Models
Key entities: User, Task, Client, Contact, Feed, Like, Notification
- Tasks have type (CALL/MEET/EMAIL/OFFER/PRESENTATION), priority (LOW/MEDIUM/HIGH), status (OPEN/CLOSED/DELETED)
- Tasks support transfers between users with accept/reject flow
- Tasks can have collaborators and parent-child linking
- Feeds have types (RECOMMENDATION/CLIENT_ACTIVITY/INDUSTRY_INFO/COLLEAGUES_UPDATE)
- Prisma client output is in `src/generated/prisma` (gitignored)

## Environment Variables
Required (in .env, gitignored):
- `DATABASE_URL` - PostgreSQL connection string
- Auth-related env vars for better-auth
- `RESEND_API_KEY` - For email sending
- OpenAI API key for AI features
