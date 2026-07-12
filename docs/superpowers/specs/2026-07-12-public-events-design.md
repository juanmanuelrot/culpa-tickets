# Public Events — Design Spec

**Date:** 2026-07-12

## Goal

Allow events to be sold to the general public, not only whitelisted members.
A non-registered buyer still provides **first name, last name, ID (cédula),
and email**. Admins can later add chosen public buyers to the whitelist.

## Decisions (from brainstorming)

- **Public scope:** event-level flag. An event is either fully invite-only or
  fully public; no mixed events.
- **Add to database:** admin promotes chosen public purchasers to the whitelist
  later. Buyers are not asked to opt in.
- **Purchase limits:** no per-person limit on public events. Only the ticket
  type's `capacity` limits total sales.
- **Buyer flow:** tickets-first. The public event page shows the event and all
  active ticket types immediately (no gate); the identity form appears when the
  buyer picks a ticket, then payment.

## Data model

Add one field to `Event`:

```prisma
isPublic Boolean @default(false)
```

Buyer identity reuses existing `Ticket` columns:
- `purchaserName` stores the combined `"First Last"` string.
- `purchaserEmail`, `purchaserGovId` already exist.
- `whitelistedPersonId` stays `null` for public tickets.

No `lastName` column is added; first/last are collected separately in the form
for data quality and joined before storage. When a public buyer is promoted,
`WhitelistedPerson.name` receives that same combined string.

## Buyer flow — `/event/[slug]`

The page branches on `event.isPublic`:

- **Public:** render event + all active ticket types with no gov-ID gate.
  Clicking a ticket opens a form (first name, last name, ID, email), then
  proceeds to payment. Free ticket types are claimed instantly.
- **Private:** unchanged (gov-ID lookup).

## APIs

- **`/api/public/lookup`** (or a sibling path): for a public event, return the
  event and its active ticket types to anyone, without whitelist filtering.
  Private events keep the existing whitelist-gated behavior.
- **`/api/public/checkout`:** add a public branch. When the event is public,
  skip whitelist verification; require `firstName`, `lastName`, `govIdNumber`,
  `email`; build `purchaserName` from first+last. Enforce only ticket-type
  `capacity` (existing count of PAID/USED). Free → create PAID + QR email now;
  paid → PENDING_PAYMENT + MercadoPago preference, confirmed by the existing
  webhook (no webhook change needed — it already uses `purchaser*` fields).

## Admin

- **Event create/edit:** an `Es público` toggle, following the existing
  `isActive` / `locationRevealed` single-field PATCH pattern.
- **Promote to whitelist:** on the admin Tickets page, tickets with no
  `whitelistedPersonId` show an "Agregar a la lista" action calling
  `POST /api/admin/whitelist/from-ticket`. It creates a `WhitelistedPerson`
  from the ticket's purchaser fields. If a person with that `govIdNumber`
  already exists, no-op with a clear message (govId is unique).

## Edge cases

- Sold out / capacity → existing "Agotado" behavior.
- Missing/blank identity fields → 400 + form validation.
- Free public tickets: claimable by anyone up to capacity.
- Inactive event → not purchasable (existing `isActive` check).
