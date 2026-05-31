# Phase 4 — Claude Code Kickoff Prompt

> Paste everything below the line into Claude Code. Scoped to **Phase 4 only**. **Prerequisite:
> Phases 0–3 are merged.** This phase finalizes the communication model and per-node icon visibility.
> Update `SOCIAL_PLATFORM_BUILD_SPEC.md` to reflect the model below as part of this work.

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` and `SOCIAL_PLATFORM_BUILD_SPEC.md` first.
Phase 4 reworks the three communication surfaces and adds owner-aware icon visibility.

**Final communication model:**

| App | What it is | Account to use? | Owner sees | Visitor sees |
|---|---|---|---|---|
| **Guestbook** | Open public wall | No (anonymous OK) | All signatures | Can sign; sees all |
| **Mail** | Contact form that **emails the owner's real address** | No (enters their own email + message) | Reads it in their email — **no in-app inbox** | Send-only form |
| **Messages** | 1:1 **AOL-style** real-time chat | **Yes — both sides logged in** | **All their conversations** (buddy-list) | **Only their own thread** with the owner |

This **retires the public Message Board forum** (fold it into Messages) and **repurposes ChemMail
into Mail** (the old in-app DM inbox moves to Messages).

## HARD GUARDRAILS (do not violate)

1. **Never touch `public.*` / Eric's tables or content.** Additive/member-side only. (Eric's flagship
   `message_threads`/`message_posts` stay as-is even though the member board is retired.)
2. All client DB access goes through the **repo layer** (`useRepo()`); **apps receive NO props** —
   node/repo/isOwner/currentUser/isAuthed come from context.
3. **The email provider API key and the owner's email address are server-only.** The key lives in
   Edge Function secrets, never in client code. The owner's email is looked up **inside** the Edge
   Function and **never returned to the client / never shown to a visitor**.
4. **RLS stays the security boundary.** The "visitor sees only their own thread" guarantee must come
   from RLS, not client filtering.
5. Out of scope: no new social features, no L3 custom apps. Don't expand beyond the four items below.
6. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Phase 4 deliverables

### A. Mail — contact form that emails the owner

- Repurpose the ChemMail app → **Mail** (keep the envelope icon). It is a **send-only contact form**:
  visitor enters *their* email, optional name, subject, message. **No account required. No in-app
  inbox** (delete/hide the old messages-based inbox UI — that role moves to Messages).
- Edge Function `send_mail` (service role):
  - input `{ handle, fromEmail, fromName, subject, body }`
  - resolve `handle → platform.profiles.id → auth.users.email` **server-side**; if the owner set
    `profiles.mail_enabled = false`, reject.
  - send via **Resend** (`RESEND_API_KEY` from Edge Function secrets), `reply-to` = visitor's email so
    the owner replies from their normal inbox. Use a verified domain (`ericchemwor.com`) for DKIM/SPF.
  - **Anti-spam (mandatory):** per-IP + per-recipient rate limit, validate `fromEmail`, cap subject/body
    length. Log each send to a `members.mail_log` row (recipient_id, from_email, sent_at, status) for
    audit. Leave a clearly-marked hook for an hCaptcha token if added later.
- Add `profiles.mail_enabled boolean default true` (additive migration) + a toggle in Customize.
- The owner's email is **never** sent to the browser.

### B. Messages — 1:1 AOL-style chat

- Rename the retired Message Board → **Messages** (reuse the green chat-bubble icon). Build on the
  existing `members.messages` table (`sender_id`, `recipient_id`, `body`, `read`, `created_at`). No
  schema change unless you need a conversation key — if so, derive it from the participant pair.
- **RLS already gives the privacy guarantee** — keep: select where `auth.uid()` is sender or recipient;
  insert where `sender_id = auth.uid()`. Do not weaken it.
- **Owner view (`isOwner`):** a buddy-list of all conversations (group messages by the other
  participant), open any thread, reply.
- **Visitor view (logged-in, not owner):** a single thread with the node owner only — "Start a chat"
  if none exists. They must not be able to see or reach any other conversation (RLS enforces this;
  the UI just shows the one thread).
- **Logged-out:** a "Sign in to start a chat" state (links to the existing auth flow).
- **Real-time:** Supabase Realtime subscription on the current user's messages; retro AOL IM styling
  (buddy-list panel, classic chat window, send on Enter). Sending requires login.

### C. Guestbook — truly open on member nodes

- Relax `members.guestbook_entries` insert RLS to allow **anonymous** signing (nullable `author_id`,
  no auth requirement), guarded by: the target `profile_id` must be a **public** profile, a **rate
  limit**, and a **body length cap**. Owner/admin can still delete. (Flagship already allows anon.)

### D. Owner-aware icon visibility (hide private apps from visitors)

Add a `visibility` field to each `APP_REGISTRY` entry and have **both shells filter icons** using the
current `{ node, isOwner, isAuthed }`:

| `visibility` | Shows when | Apps |
|---|---|---|
| `public` | always (any visitor) | About, Blog, Pictures, Music, Reviews, Food List, Car Mods, Wish List, Travel Log, Daily Digest, Projects, Manifestations, Games, README.sh, Terminal, **Guestbook**, **Profile**, **Mail** |
| `authed` | viewer is logged in (content RLS-scoped) | **Messages** |
| `owner` | `isOwner` (the node's owner, viewing their own node, logged in) | **Notifications**, **ChemFeed**, **Customize** |
| `hidden` | never in menus (unchanged) | **Admin** |
| `guest` | viewer is logged out OR has no node yet; hide on your own node | **Make Your Own** |

Rules:
- A logged-in **visitor** on someone else's node must **not** see that owner's `owner`-visibility apps
  (Notifications/ChemFeed/Customize) — those belong on the visitor's *own* node. Gate on `isOwner`,
  not merely "logged in."
- On the **flagship hub**, `owner` apps show only when Eric (admin) is logged in.
- `public` apps remain **view-only** for visitors; their create/edit affordances already gate on
  `isOwner` (Phase 1) — keep that.

## Acceptance criteria

- **Mail:** a logged-out visitor can submit the form on `/u/<handle>`; the owner receives a real email
  (reply-to = visitor); the owner's address never appears in any client response/network payload;
  rate limiting blocks rapid repeats; `mail_enabled=false` disables it. No in-app inbox remains.
- **Messages:** two logged-in users can hold a real-time 1:1 chat; the owner sees all their
  conversations, a visitor sees only their own thread and cannot load another; logged-out users see
  "sign in to chat." RLS (not the client) enforces the scoping.
- **Guestbook:** a logged-out visitor can sign a public member node; abuse controls (rate limit,
  length cap) hold.
- **Visibility:** on another user's node, a visitor never sees Notifications/ChemFeed/Customize;
  Messages shows (scoped); Mail/Guestbook/Profile show; "Make Your Own" shows only when logged
  out / node-less. Flagship unchanged for anonymous viewers.
- `/` (flagship) still works; **no `public.*` table or content modified.** `npm run build` and
  `npm run lint` pass.

## Suggested order

1. Registry `visibility` + shell filtering (D) → 2. Messages from `members.messages` + Realtime +
owner/visitor views (B) → 3. Mail contact form + `send_mail` Edge Function + Resend + anti-spam (A) →
4. Guestbook anonymous RLS relax (C) → 5. update `SOCIAL_PLATFORM_BUILD_SPEC.md` to document the
final comms model + visibility matrix.

When done, summarize: files/migrations/functions changed, the Resend setup steps the human must do
(domain verification, `RESEND_API_KEY` secret), the rate-limit thresholds chosen, and anything needing
a human decision.
