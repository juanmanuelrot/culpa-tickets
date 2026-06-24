# Date Handling Clarity + Montevideo Timezone + Keith Haring Redraw

**Date:** 2026-06-24
**Status:** Approved design

## Problem

1. **Timezone is wrong / inconsistent.** The app serves a Montevideo (`America/Montevideo`, UTC-3, no DST) audience, but no date code pins a timezone:
   - `formatDate()` in `src/lib/utils.ts` and the welcome-email formatter in `src/lib/email.ts` use `Intl.DateTimeFormat("es-AR", …)` with **no `timeZone`**, so server-rendered dates and emails render in the **server's** TZ (UTC in production).
   - ~15 client-side `new Date(x).toLocaleString("es-AR", …)` call sites have no `timeZone`, so they render in the **viewer's** browser TZ.
   - 3 admin forms parse `datetime-local` inputs with `new Date(value).toISOString()`, which interprets the entered wall-clock time in the **admin's** browser TZ — an admin outside Uruguay stores the wrong instant.

2. **Dates are unclear.** Three distinct date concepts exist and are easily confused:
   - **Event date** — when the party happens (`Event.date`).
   - **Link expiry** — when a free-invite link stops working (`FreeInviteLink.expiresAt`).
   - **Ticket scan-validity** — when an issued ticket can no longer be scanned (`Ticket.validUntil` / `TicketType.validUntil` / `FreeInviteLink.ticketValidUntil`).

   The `/invite/[token]` acceptance page shows **only** the ticket validity ("Válido hasta …") and never the event date, even though `eventDate` is fetched — this is the reported "generated a ticket for event date X but the page showed date Y" bug. The success page likewise shows only the expiry. Labels across forms and displays don't consistently distinguish the three concepts.

3. **Optional vs required is inconsistent.** Some optional fields have an "Opcional" hint (invite-links `ticketValidUntil`), others don't (ticket-type `validUntil`); required fields have no marker. This causes "says optional but is required" confusion.

4. **Keith Haring drawings** are messy abstract filled silhouettes rather than authentic Haring figures.

## Goals

- All displayed dates render in `America/Montevideo` regardless of viewer location.
- All admin `datetime-local` inputs are interpreted as Montevideo wall-clock time before storage.
- Event date is shown prominently and clearly everywhere; the three date concepts are consistently labeled.
- Optional/required form fields are consistently marked.
- Keith Haring figures redrawn as authentic, bold, uniform-stroke figures.

## Non-Goals

- No DB schema changes.
- No change to what any date *means* (only how it is displayed/parsed/labeled).
- No new third-party date dependency — use native `Intl`.

## Design

### 1. Central date library — `src/lib/date.ts` (new)

Single source of truth. Constant `MONTEVIDEO_TZ = "America/Montevideo"`.

Display helpers (all pass `timeZone: MONTEVIDEO_TZ`, locale `es-UY` with `es-AR` fallback behavior preserved):
- `formatEventDateTime(date: Date | string): string` — full form, e.g. `"martes, 30 de junio de 2026, 22:00"` (weekday, day, month, year, hour, minute). Used for event dates.
- `formatDateTime(date: Date | string): string` — day, month, year, hour, minute. Generic displays, expiries, scan timestamps.
- `formatDateShort(date: Date | string): string` — compact (e.g. `"30 jun, 22:00"`) for dense admin lists.

Helpers accept `Date | string` so client components can pass ISO strings directly.

Input conversion helpers:
- `localInputToUtc(value: string): Date` — takes a `datetime-local` value (`"2026-06-30T22:00"`), interprets it as Montevideo wall-clock time, returns the correct UTC `Date`. Implementation: compute the Montevideo UTC offset for the target instant via `Intl.DateTimeFormat(..., { timeZone, timeZoneName })` / `formatToParts`, then subtract it. Robust if Uruguay's offset ever changes; correct today at -03:00.
- `utcToLocalInput(date: Date | string): string` — reverse; produces a `datetime-local`-compatible string in Montevideo time, for pre-filling edit forms.

`src/lib/utils.ts#formatDate` is replaced by re-exporting/delegating to `formatEventDateTime` so existing importers (`free-invite`, `checkout`, `mercadopago` routes) keep working unchanged.

### 2. Fix all display sites

Replace every `new Date(x).toLocaleString/...("es-AR", …)` and inline `Intl.DateTimeFormat` date call with the appropriate helper:

- `src/app/page.tsx` (local `formatDate`, lines ~19-30)
- `src/app/validator/page.tsx` (first-scan, expired)
- `src/app/validator/scans/page.tsx` (scannedAt)
- `src/app/admin/tickets/page.tsx` (createdAt)
- `src/app/admin/invite-links/page.tsx` (expiresAt, ticketValidUntil)
- `src/app/admin/users/page.tsx` (createdAt — currently no locale at all)
- `src/app/admin/events/page.tsx` (event date)
- `src/app/admin/events/[id]/page.tsx` (event date, ticket-type validUntil)
- `src/app/event/[slug]/page.tsx` (event date, ticket-type validUntil)
- `src/app/invite/[token]/page.tsx` (see §4)
- `src/app/event/[slug]/checkout/success/page.tsx` (see §4)
- `src/lib/email.ts` (welcome-email per-event date — add `timeZone`; ticket email already uses the now-fixed `formatDate` via route params)

### 3. Fix all input sites

In the 3 admin forms, parse `datetime-local` via `localInputToUtc()` instead of `new Date(value)`:
- `src/app/admin/events/page.tsx` — event `date`
- `src/app/admin/events/[id]/page.tsx` — ticket-type `validUntil`
- `src/app/admin/invite-links/page.tsx` — `expiresAt`, `ticketValidUntil`

Where an edit form pre-fills an existing UTC value into a `datetime-local` input, use `utcToLocalInput()`. Add a small "(hora de Montevideo)" hint under each `datetime-local` input.

### 4. Date clarity

- **`/invite/[token]`**: Add the **event date** as the primary, prominent date block (it is already fetched as `inviteInfo.eventDate` but never rendered — root cause of the X/Y bug). Demote ticket validity to a clearly-labeled secondary note. Labels: **"Fecha del evento"** primary; **"Ticket válido hasta"** secondary.
- **Success page** (`checkout/success`): Add event name + event date. To do so, pass `eventName` and event date through the success URL (alongside the existing `validUntil` param) from both claim flows (`/invite/[token]` and `/event/[slug]`), or fetch by `ticketId`. Chosen approach: extend the success-redirect query params (no new endpoint needed). Keep the validity note, clearly labeled.
- **Consistent labels** across forms and displays for the three concepts:
  - Event date → **"Fecha del evento"**
  - Free-invite link expiry → **"El link expira"** (replaces ambiguous "Expira El")
  - Ticket scan validity → **"Ticket válido hasta"**
- **Optional/required markers:** required fields get a `*` after the label; optional fields get an "(opcional)" suffix/hint. Apply consistently across `admin/events`, `admin/events/[id]`, `admin/invite-links`.

### 5. Keith Haring redraw

In `src/components/decorative/haring-border.tsx`, redraw the 4 `HaringFigure` variants as authentic Haring figures using **bold uniform-width strokes** (stroke-based, `fill="none"` + `stroke="currentColor"` with consistent `strokeWidth`, round caps/joins) and classic poses:
- variant 0: dancing figure (arms/legs splayed, motion lines)
- variant 1: second dancing figure (different pose)
- variant 2: radiant baby (crawling figure with radiating lines)
- variant 3: barking dog

Preserve the `HaringFigure` named export, its `{ variant, className }` props, and the `HaringBorder` layout component so all existing usages (full borders + small dividers in `invite/[token]`) keep working. Figures must look correct under `rotate-90/180/-90` and at small sizes.

## Testing / Verification

- **Unit:** `localInputToUtc` and `utcToLocalInput` round-trip correctly; `localInputToUtc("2026-06-30T22:00")` yields `2026-07-01T01:00:00Z` (Montevideo -03:00). Display helpers produce Montevideo-local output for a known UTC instant.
- **Manual:** With browser TZ forced to a non-Montevideo zone (e.g. America/Los_Angeles), confirm displayed dates still show Montevideo time and admin-entered dates store the intended Montevideo instant.
- **Manual:** Invite acceptance page shows event date prominently and ticket validity as a clearly-labeled secondary note; success page shows event name + date.
- **Visual:** Haring figures render correctly in borders and dividers, at all rotations and sizes.
- `npm run lint` and `npm run build` pass.
