# Web Mail — Progress Tracker

**Started:** 2026-06-03  
**Stack:** Next.js 16 App Router · TS · Tailwind v4 · Shadcn UI · React Email · Nodemailer · MongoDB/Mongoose · Better Auth

---

## Phase 0 — Project Setup

- [ ] `npx create-next-app@latest` (TypeScript, Tailwind, App Router, src/ dir, no ESLint changes)
- [ ] Install and configure Shadcn UI (`npx shadcn@latest init`)
- [ ] Install dependencies: `nodemailer`, `@types/nodemailer`, `mongoose`, `better-auth`, `@react-email/components`, `@react-email/render`, `react-email`
- [ ] Set up `.env.local` with all required variables (see PRD §10)
- [ ] Configure Tailwind v4 dark mode (`class` strategy)
- [ ] Add `ENCRYPTION_MASTER_KEY` to `.env.local` (generate 32-byte hex)

---

## Phase 1 — Database Layer

- [ ] Mongoose connection singleton (`lib/db.ts`)
- [ ] `SmtpProvider` model + schema (with encrypted password fields)
- [ ] `SentEmail` model + schema (full snapshot + SMTP response)
- [ ] Mongoose indexes: `smtp_providers.userId`, `sent_emails.userId + sentAt`

---

## Phase 2 — Encryption Utility

- [ ] `lib/crypto.ts` — AES-256-GCM encrypt / decrypt functions
- [ ] Unit-test the round-trip (encrypt → decrypt returns original)

---

## Phase 3 — Better Auth

- [ ] Install and configure `better-auth` with MongoDB adapter
- [ ] Enable email/password provider
- [ ] Enable magic link provider (requires a working SMTP config in env)
- [ ] Auth middleware in `middleware.ts` protecting all routes except `/login`
- [ ] Login page `/login` with tabs: Email/Password | Magic Link

---

## Phase 4 — SMTP Provider API

- [ ] `GET /api/providers` — list providers for current user (passwords stripped)
- [ ] `POST /api/providers` — validate via `transport.verify()`, encrypt password, save
- [ ] `PUT /api/providers/[id]` — update (re-validate and re-encrypt if password changed)
- [ ] `DELETE /api/providers/[id]` — delete provider
- [ ] `POST /api/providers/[id]/test` — re-test existing saved provider

---

## Phase 5 — React Email Templates

- [ ] Create `emails/` directory with 4 template components:
  - [ ] `OtpEmail.tsx` — props: `code`, `expiry`, `appName`
  - [ ] `WelcomeEmail.tsx` — props: `userName`, `ctaUrl`, `appName`, `logoUrl?`
  - [ ] `PasswordResetEmail.tsx` — props: `userName`, `resetUrl`, `expiry`
  - [ ] `NewsletterEmail.tsx` — props: `subject`, `bodyHtml`, `footerText?`
- [ ] `lib/templates.ts` — template registry with prop schemas (for form generation)
- [ ] `GET /api/templates` — return template list + schemas
- [ ] `POST /api/templates/preview` — render template to HTML, return raw HTML

---

## Phase 6 — Send API

- [ ] `POST /api/send` — full send pipeline:
  - Validate request body
  - Fetch + decrypt provider
  - Render HTML (rich text wrapper or template)
  - `transport.sendMail()` with timing
  - Save `SentEmail` record
  - Return diagnostic response

---

## Phase 7 — Sent History API

- [ ] `GET /api/sent` — paginated list (20/page), newest first
- [ ] `GET /api/sent/[id]` — full record including `htmlSnapshot`

---

## Phase 8 — UI Shell

- [ ] App layout with sidebar nav (Compose, Sent, Providers, Templates)
- [ ] Dark mode toggle + localStorage persistence + `next-themes`
- [ ] User menu (avatar, sign out)
- [ ] Mobile responsive (sidebar collapses to bottom nav or hamburger)

---

## Phase 9 — Compose View (`/compose`)

- [ ] Provider selector dropdown (top of compose)
- [ ] Mode toggle: Rich Text | Template
- [ ] **Rich text mode:** Tiptap editor, To/CC/BCC multi-tag inputs, Subject field
- [ ] **Template mode:** template picker, auto-generated prop form, live iframe preview
- [ ] Send button → optimistic loading state → diagnostic result panel
- [ ] Diagnostic panel: status badge, Message-ID, SMTP response, latency, accepted/rejected

---

## Phase 10 — Providers View (`/providers`)

- [ ] Provider list (name, host, from email, default badge, status indicator)
- [ ] Add provider form (preset selector → auto-fills host/port/TLS)
- [ ] Gmail App Password hint notice
- [ ] Connection test on save (inline error display)
- [ ] Edit / delete actions
- [ ] Set default provider

---

## Phase 11 — Sent History View (`/sent`)

- [ ] Paginated email list (to, subject, provider, status, timestamp)
- [ ] Click row → detail drawer/panel
- [ ] Detail panel: all metadata + sanitized HTML preview (iframe with sandbox)
- [ ] Status badge: Sent ✓ / Failed ✗

---

## Phase 12 — Templates View (`/templates`)

- [ ] Template gallery cards (name, description, preview thumbnail)
- [ ] Click → open preview modal with live prop form
- [ ] "Use this template" → opens compose in template mode with template pre-selected

---

## Phase 13 — Polish & Deploy

- [ ] Error boundaries on all main views
- [ ] Toast notifications (Sonner or Shadcn toast) for send success/failure
- [ ] Form validation (Zod schemas for all API inputs)
- [ ] Vercel deployment config (`vercel.json` if needed)
- [ ] Environment variables set in Vercel dashboard
- [ ] MongoDB Atlas connection string configured
- [ ] Smoke test: Gmail → Outlook send, Outlook → Gmail send

---

## Completed

_(nothing yet — project not started)_

---

## Notes & Decisions Log

| Date | Decision |
|---|---|
| 2026-06-03 | SMTP credentials encrypted with AES-256-GCM (app-level master key in env) — see PRD §4.1 for rationale |
| 2026-06-03 | IMAP / inbox deferred to v2 — architecture should not block this addition |
| 2026-06-03 | No attachments in v1 — removes file upload complexity and Vercel body size concerns |
| 2026-06-03 | No rate limiting — personal / small-team use only |
| 2026-06-03 | Magic link auth requires a separate dedicated SMTP config in env (not a user-saved provider) |
