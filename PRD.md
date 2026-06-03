# Web Mail — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-06-03  
**Owner:** shahrear@navigatus.com.au

---

## 1. Purpose

A self-hosted, single-tenant email utility that serves three overlapping goals:

1. **SMTP Tester** — validate that a given set of SMTP credentials can actually deliver mail (handshake, TLS, auth, acceptance).
2. **Lightweight Email Client** — compose and send email via any saved provider; browse sent history.
3. **Email Template Previewer + Sender** — preview and send React Email templates with live typed-prop injection.

The primary audience is a developer or small team verifying cross-provider deliverability (e.g. Gmail → Outlook, Outlook → Gmail).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 — App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Component library | Shadcn UI |
| Email rendering | React Email |
| Email sending | Nodemailer |
| Database | MongoDB (Atlas for prod) + Mongoose |
| Auth | Better Auth — email/password + magic link |
| Encryption | AES-256-GCM (app-level, master key from env) |
| Deployment | Vercel (serverless) |

---

## 3. Authentication

### 3.1 Flows
- **Email + password** — classic credentials via Better Auth.
- **Magic link** — passwordless; Better Auth emails a login link.

### 3.2 Session
- Better Auth manages sessions via secure HTTP-only cookies.
- All API routes are protected by Better Auth middleware.
- No public routes except `/login` and `/magic-link`.

### 3.3 Scope
- Single-tenant (personal / small team).
- No multi-tenancy or per-user SMTP segregation needed.
- No rate limiting required.

---

## 4. SMTP Provider Management (BYOK)

### 4.1 Concept
Users register multiple SMTP providers in the app. Credentials are encrypted at rest using **AES-256-GCM** with a master key stored only in the environment variable `ENCRYPTION_MASTER_KEY`. The database never holds a plaintext password.

> **Industry standard rationale:** AES-256-GCM provides authenticated encryption (prevents tampering) and is the standard used by credential managers and relay services (SendGrid, Mailgun internals). The weakness is that compromise of both the DB dump *and* the .env file exposes credentials — mitigated by keeping the env key out of source control and using Vercel environment variables.

### 4.2 Data Model — `smtp_providers` collection

```ts
{
  _id: ObjectId,
  userId: string,              // Better Auth user ID
  name: string,                // Display name e.g. "My Gmail"
  preset: "gmail" | "outlook" | "custom",
  host: string,                // smtp.gmail.com
  port: number,                // 587
  secure: boolean,             // true = TLS on connect (465), false = STARTTLS (587)
  username: string,            // plaintext — not sensitive
  passwordCiphertext: string,  // AES-256-GCM encrypted, base64
  iv: string,                  // GCM IV, base64
  authTag: string,             // GCM auth tag, base64
  fromName: string,            // Display name in From header
  fromEmail: string,           // e.g. you@gmail.com
  isDefault: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### 4.3 Provider Presets

| Preset | Host | Port | Security |
|---|---|---|---|
| Gmail | smtp.gmail.com | 587 | STARTTLS |
| Outlook | smtp-mail.outlook.com | 587 | STARTTLS |
| Custom | (user fills) | (user fills) | (user picks) |

> Gmail requires an **App Password** if 2-Step Verification is enabled. The UI must surface this note.

### 4.4 Connection Validation
- Clicking **Save** triggers `nodemailer.createTransport().verify()` server-side before writing to DB.
- On failure, the error string is returned and shown inline — nothing is saved.
- A separate **Test Connection** button is also available when editing an existing provider.

---

## 5. Email Compose & Send

### 5.1 Addressing
- **To** — multi-value tag input (comma/Enter to add recipients).
- **CC** — collapsible field, multi-value.
- **BCC** — collapsible field, multi-value.
- **From** — pre-filled from the selected provider's `fromEmail` / `fromName`, read-only.
- **Subject** — text input.

### 5.2 Body
Two modes selectable in the compose screen:

| Mode | Description |
|---|---|
| **Rich text** | Tiptap editor. Rendered server-side wrapped in a React Email base layout before sending. |
| **Template** | Pick a pre-built React Email template; fill in typed props via an auto-generated form. |

### 5.3 Provider Selection
- Dropdown in the compose toolbar to pick which saved SMTP provider to use.
- Default provider is pre-selected.

### 5.4 No Attachments
Out of scope for v1.

---

## 6. React Email Templates

### 6.1 Template Catalogue (v1)

| Template | Props |
|---|---|
| **OTP / Verification Code** | `code: string`, `expiry: string`, `appName: string` |
| **Welcome / Onboarding** | `userName: string`, `ctaUrl: string`, `appName: string`, `logoUrl?: string` |
| **Password Reset** | `userName: string`, `resetUrl: string`, `expiry: string` |
| **Newsletter / Announcement** | `subject: string`, `bodyHtml: string`, `footerText?: string` |

### 6.2 Rendering Flow
1. User selects a template in compose view.
2. A form auto-renders one field per prop (type-aware: string → text input, URL → url input).
3. On send: server renders the React Email component to HTML with the supplied props.
4. The rendered HTML is passed to Nodemailer as `html`, with a plain-text fallback generated via `@react-email/render`.

### 6.3 Template Preview
- An inline iframe preview in the compose panel updates in real time as props are filled in.
- Preview is rendered server-side via a `/api/templates/preview` route that returns raw HTML.

---

## 7. SMTP Send & Diagnostics

### 7.1 Send Flow
```
Client compose → POST /api/send
  → decrypt SMTP password
  → build Nodemailer transport
  → render HTML (rich text or template)
  → transport.sendMail()
  → capture SMTPResponse
  → write SentEmail record to MongoDB
  → return result to client
```

### 7.2 Diagnostic Response (shown in UI after send)

| Field | Source |
|---|---|
| Status | Pass ✓ / Fail ✗ |
| Error message | Nodemailer error string (if failed) |
| Message-ID | `info.messageId` from Nodemailer response |
| SMTP response code | `info.response` (e.g. `250 2.0.0 OK`) |
| Accepted recipients | `info.accepted` array |
| Rejected recipients | `info.rejected` array |
| Send latency | Measured via `performance.now()` around `sendMail()` |

### 7.3 Sent History — `sent_emails` collection

```ts
{
  _id: ObjectId,
  userId: string,
  providerId: ObjectId,        // ref smtp_providers
  providerSnapshot: {          // denormalized in case provider is deleted
    name: string,
    host: string,
    fromEmail: string,
  },
  to: string[],
  cc: string[],
  bcc: string[],
  subject: string,
  htmlSnapshot: string,        // full rendered HTML that was actually sent
  mode: "richtext" | "template",
  templateId?: string,         // template name if mode === "template"
  templateProps?: Record<string, unknown>,
  smtpResponse: {
    messageId: string,
    response: string,
    accepted: string[],
    rejected: string[],
    latencyMs: number,
  },
  status: "sent" | "failed",
  errorMessage?: string,
  sentAt: Date,
}
```

---

## 8. UI Layout

### 8.1 Shell
Gmail / Outlook-style three-panel layout:

```
┌─────────────────────────────────────────────────────────────┐
│  App header (logo, dark-mode toggle, user menu)             │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Left nav    │  Main content area                           │
│              │                                              │
│  ○ Compose   │  (changes based on nav selection)            │
│  ○ Sent      │                                              │
│  ○ Providers │                                              │
│  ○ Templates │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 8.2 Dark Mode
- Respects OS `prefers-color-scheme` on first load.
- Manual toggle in the header persists to `localStorage`.
- Shadcn UI `dark` class strategy on `<html>`.

### 8.3 Key Views

| Route | View |
|---|---|
| `/` | Redirect → `/compose` |
| `/compose` | Compose panel |
| `/sent` | Sent email list + detail drawer |
| `/providers` | SMTP provider list + add/edit form |
| `/templates` | Template gallery with preview |
| `/login` | Better Auth login (email/pw + magic link tab) |

---

## 9. API Routes (Route Handlers)

| Method | Path | Description |
|---|---|---|
| POST | `/api/send` | Send email via selected provider |
| GET | `/api/sent` | Paginated sent history |
| GET | `/api/sent/[id]` | Single sent email detail |
| GET | `/api/providers` | List user's providers |
| POST | `/api/providers` | Create + validate provider |
| PUT | `/api/providers/[id]` | Update provider |
| DELETE | `/api/providers/[id]` | Delete provider |
| POST | `/api/providers/[id]/test` | Test existing provider connection |
| GET | `/api/templates` | List available templates + their prop schemas |
| POST | `/api/templates/preview` | Render template to HTML (for iframe preview) |

---

## 10. Environment Variables

```env
# Database
MONGODB_URI=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Encryption
ENCRYPTION_MASTER_KEY=   # 32-byte hex string, NEVER commit to git

# Email (for magic link sending — separate from SMTP providers)
MAGIC_LINK_SMTP_HOST=
MAGIC_LINK_SMTP_PORT=
MAGIC_LINK_SMTP_USER=
MAGIC_LINK_SMTP_PASS=
MAGIC_LINK_FROM=
```

---

## 11. Security Considerations

- SMTP passwords encrypted with AES-256-GCM before write; decrypted only in memory at send time.
- `ENCRYPTION_MASTER_KEY` lives in Vercel environment variables only — never in source or DB.
- Better Auth middleware guards all `/api/*` routes.
- `htmlSnapshot` stored in MongoDB — ensure it is not re-rendered as live HTML in the UI (render as sanitized preview only).
- CORS not required (same-origin Next.js API routes).
- Sent email BCC recipients stored in DB for audit but not included in rendered HTML headers.

---

## 12. Out of Scope (v1)

- IMAP / inbox reading
- File attachments
- Email scheduling
- Redis / rate limiting
- Drag-and-drop template builder
- Yahoo Mail preset
- Webhook delivery tracking (opens, clicks)

---

## 13. Open Questions / Future Work

- IMAP inbox integration (node-imap / imapflow) — architecture is ready, just not built.
- Delivery tracking via webhook (email opened, link clicked) — needs a pixel / redirect service.
- Attachment support — body size limit increase + temp storage strategy.
- Per-user encryption keys (envelope encryption) — upgrade path if multi-tenant.
