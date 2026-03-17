# DECISIONS_LOG

Last Updated: 2026-03-17
Document Owner: Platform Decision Memory
Authority: Engineering/business decision ledger for the monorepo

---

## 0. Purpose

This file records the decisions that should **not be rediscovered from scratch** in future chats, future sessions, or future refactors.

It exists to answer:

- what was decided
- why it was decided
- whether it is locked or still active
- what must remain compatible because of that decision

This is **not** a changelog.
This is **not** a task list.
This is the platform’s **decision memory**.

---

## 1. Status Legend

- `LOCKED` → do not change unless there is an explicit architectural override
- `ACTIVE` → current active direction; can still evolve with controlled justification
- `TEMPORARY` → short-term operational decision; may be replaced later
- `RETIRED` → no longer active, but kept for historical traceability

---

## 2. Decision Entries

### DEC-001 — Foundation must be extended, not rewritten
- Status: `LOCKED`
- Decision:
  Existing platform foundation must be preserved and extended; it must not be rewritten.
- Why:
  The architecture explicitly protects the Prisma DB structure, queue/worker system, invoice system, owner model, property model, favorites model, and billing router.
- Consequence:
  Any new work must layer on top of the current core instead of replacing it wholesale. fileciteturn4file0

---

### DEC-002 — Platform identity is WhatsApp-first, not WhatsApp-only
- Status: `LOCKED`
- Decision:
  The platform launches WhatsApp-first but is designed for later omni-channel expansion.
- Why:
  Architecture explicitly defines the system as WhatsApp-first and omni-channel ready.
- Consequence:
  Business logic must remain channel-agnostic and future platforms must be added through adapters, not core rewrites. fileciteturn4file0 fileciteturn4file4

---

### DEC-003 — Service model is multi-service and service-agnostic
- Status: `LOCKED`
- Decision:
  The core system is one service-agnostic engine capable of supporting many services.
- Why:
  The architecture defines `Service` as dynamic and not hardcoded.
- Consequence:
  No feature should be implemented in a way that permanently assumes rent-home is the only service. fileciteturn4file0

---

### DEC-004 — Client can never control pricing
- Status: `LOCKED`
- Decision:
  Prices and billable amounts are server-controlled only.
- Why:
  The architecture explicitly forbids client-authoritative pricing and amount submission.
- Consequence:
  UI may select plans, but server-side data remains the only billing source of truth. fileciteturn4file0 fileciteturn4file3

---

### DEC-005 — Subscription is per service, not platform-global
- Status: `LOCKED`
- Decision:
  Owner subscription access is scoped per service.
- Why:
  The architecture defines subscription as per-service and requires active subscription for service usage.
- Consequence:
  Service gating, renewal, billing, and dashboard continuation must remain service-context aware. fileciteturn4file0

---

### DEC-006 — Booking flow is approval-based and auto-approval is forbidden
- Status: `LOCKED`
- Decision:
  Booking activation requires explicit owner approval.
- Why:
  The architecture defines the booking flow as request → draft → owner approval → active booking and explicitly forbids auto-approval.
- Consequence:
  No shortcut implementation may silently activate bookings without owner action. fileciteturn4file0

---

### DEC-007 — Owner approvals must stay synchronized across channels
- Status: `LOCKED`
- Decision:
  Web-panel approval and WhatsApp quick-approve must operate on the same central booking state.
- Why:
  The architecture defines dual approval channels that must remain synchronized.
- Consequence:
  UI differences are allowed; booking authority fragmentation is not. fileciteturn3file0

---

### DEC-008 — Billing router remains payment-agnostic
- Status: `LOCKED`
- Decision:
  Billing must support pluggable providers and must not hardcode one gateway into the business core.
- Why:
  Architecture defines payment-agnostic design with provider adapters.
- Consequence:
  Provider implementations remain adapters around billing/invoice rules, not the source of billing truth. fileciteturn3file0 fileciteturn3file1

---

### DEC-009 — Same active plan cannot be repurchased while still valid
- Status: `LOCKED`
- Decision:
  If the active subscription is valid and the selected plan is identical, checkout must be blocked.
- Why:
  Architecture explicitly defines same-plan blocking.
- Consequence:
  Billing UI and backend eligibility checks must stay aligned on this rule. fileciteturn4file1 fileciteturn4file3

---

### DEC-010 — Different active plan change must remain allowed
- Status: `LOCKED`
- Decision:
  If the current subscription is still active but the selected plan differs, checkout remains allowed.
- Why:
  Architecture explicitly treats plan changes as valid transitions, not duplicate purchases.
- Consequence:
  Upgrade and downgrade must both remain supported. fileciteturn4file1

---

### DEC-011 — Active subscription must not be mutated before payment success
- Status: `LOCKED`
- Decision:
  Existing valid subscription state must remain intact until payment is actually verified.
- Why:
  Architecture explicitly forbids pre-payment mutation.
- Consequence:
  Checkout creation, pay page, webhook success handling, and renewal logic must protect this invariant. fileciteturn4file1

---

### DEC-012 — Different-plan payment success is replacement logic, not stacked carry-over
- Status: `LOCKED`
- Decision:
  Successful payment for a different plan replaces the active plan starting from payment success time.
- Why:
  Architecture explicitly forbids stacking remaining time from a different plan on top of the new plan.
- Consequence:
  Upgrade/downgrade semantics must remain predictable and symmetric. fileciteturn4file1

---

### DEC-013 — Same-plan renewal and plan change are separate billing semantics
- Status: `LOCKED`
- Decision:
  Same-plan renewal uses extension logic; different-plan change uses replacement logic.
- Why:
  Architecture explicitly separates these two behaviors.
- Consequence:
  The billing system must never collapse them into one ambiguous path. fileciteturn4file1

---

### DEC-014 — Owner identity must become recoverable and verified
- Status: `ACTIVE`
- Decision:
  Owner access must evolve toward secure, recoverable identity rather than temporary client hints.
- Why:
  Architecture requires secure owner login, account recovery, and continuity across devices.
- Consequence:
  Authentication and owner continuation work must move toward verified identity channels. fileciteturn4file2

---

### DEC-015 — Owner account and owner profile are separate concepts
- Status: `LOCKED`
- Decision:
  The signing-in human identity and the operational business profile are logically distinct.
- Why:
  Architecture explicitly requires account/profile separation for future multi-profile support.
- Consequence:
  Data modeling and UI behavior must stay compatible with workspace/profile switching. fileciteturn3file1

---

### DEC-016 — Active services card is a required owner hub concept
- Status: `ACTIVE`
- Decision:
  Owner experience must surface active services, plan status, expiry, and deterministic continuation entry points.
- Why:
  Architecture explicitly requires an Active Services card.
- Consequence:
  Owner dashboard/service selection logic should continue aligning around explicit service continuation instead of guesswork. fileciteturn4file2

---

### DEC-017 — Multi-profile / workspace switching is future-compatible from now
- Status: `ACTIVE`
- Decision:
  Owner experience must remain compatible with multiple managed business contexts.
- Why:
  Architecture explicitly defines profile/workspace switching.
- Consequence:
  Any owner-context code must avoid assumptions that permanently lock the system into one-account-one-profile forever. fileciteturn4file2

---

### DEC-018 — Normalized phone is a canonical identity anchor
- Status: `LOCKED`
- Decision:
  Normalized phone remains a primary identity and routing anchor across platform interactions.
- Why:
  Architecture defines phone normalization for owner routing and cross-platform user recognition.
- Consequence:
  Phone normalization logic is not cosmetic; it is a core identity/security concern. fileciteturn4file3 fileciteturn4file4

---

### DEC-019 — Shared i18n platform is mandatory infrastructure
- Status: `LOCKED`
- Decision:
  The system must use one shared i18n platform across panels, backend, and channels.
- Why:
  Architecture explicitly forbids fragmented panel-local language systems.
- Consequence:
  No new isolated translation architecture may be introduced inside apps or routes. fileciteturn2file5 fileciteturn2file9

---

### DEC-020 — I18n is split into shared core, messages, and adapters
- Status: `LOCKED`
- Decision:
  Locale logic, message catalogs, and consumer adapters remain structurally separated.
- Why:
  Architecture requires shared i18n core, shared catalog system, and adapter layers.
- Consequence:
  Translation infrastructure should remain typed, reusable, and package-based. fileciteturn2file5 fileciteturn4file5

---

### DEC-021 — System default locale remains `en`
- Status: `LOCKED`
- Decision:
  Platform default locale is English.
- Why:
  Architecture explicitly locks the system default locale to `en` even while tenant restrictions must still be respected.
- Consequence:
  New locale work must not silently switch the platform default. fileciteturn2file2

---

### DEC-022 — Locale resolution must be centralized
- Status: `LOCKED`
- Decision:
  Locale resolution logic must not be reimplemented ad hoc across routes, pages, or workers.
- Why:
  Architecture explicitly requires centralized locale resolution strategy.
- Consequence:
  Locale fallback/order rules belong in shared infrastructure only. fileciteturn2file2

---

### DEC-023 — Tenant-aware language policy must be preserved
- Status: `LOCKED`
- Decision:
  Locale handling must remain compatible with tenant default locale, supported locales, and profile-level preferences.
- Why:
  Architecture explicitly requires tenant-aware language behavior.
- Consequence:
  No locale implementation may bypass tenant-supported locale policy. fileciteturn2file2

---

### DEC-024 — RTL direction belongs to shared i18n infrastructure
- Status: `LOCKED`
- Decision:
  Direction handling is a centralized platform concern, not scattered CSS patchwork.
- Why:
  Architecture explicitly locks centralized direction behavior and names `ar` as mandatory RTL locale.
- Consequence:
  Direction handling must stay inside shared infrastructure and consumer adapters. fileciteturn2file2

---

### DEC-025 — User-facing text must leave business-logic layers
- Status: `LOCKED`
- Decision:
  User-visible and operator-visible texts belong in the shared i18n platform, not inside business logic.
- Why:
  Architecture explicitly requires that all user-facing text leave business logic layers.
- Consequence:
  Hardcoded visible strings in routes/services/pages are technical debt and migration targets. fileciteturn2file7

---

### DEC-026 — WhatsApp interaction is structured, not open free chat
- Status: `LOCKED`
- Decision:
  Bot interaction remains flow-based, cost-aware, and anti-abuse by design.
- Why:
  Architecture explicitly defines button/list-first, controlled input behavior and anti-spam/cost-protection layers.
- Consequence:
  New message flows must optimize for structured interaction and avoid casual free-chat expansion. fileciteturn3file0 fileciteturn3file1

---

### DEC-027 — Spam enforcement is global across channels
- Status: `LOCKED`
- Decision:
  Abuse classification and bans are cross-platform, not channel-local.
- Why:
  Architecture explicitly requires global spam synchronization across WhatsApp, Telegram, and future apps.
- Consequence:
  No platform may become a bypass path for a banned actor. fileciteturn4file4

---

### DEC-028 — Brand configuration must remain centralized
- Status: `ACTIVE`
- Decision:
  Brand naming must not be hardcoded across files.
- Why:
  Architecture explicitly requires centralized brand configuration for rebranding safety.
- Consequence:
  Naming and template texts should continue moving toward one source of truth. fileciteturn3file1

---

### DEC-029 — Global readiness must be configuration-driven, not rewrite-driven
- Status: `LOCKED`
- Decision:
  Expansion by country, currency, provider, and language must happen through configuration, not core redesign.
- Why:
  Architecture explicitly guarantees global activation via configuration changes instead of rewrites.
- Consequence:
  Country-, currency-, and provider-specific shortcuts in core logic are unacceptable. fileciteturn3file1 fileciteturn4file4

---

### DEC-030 — Monorepo shared packages are part of the platform contract
- Status: `ACTIVE`
- Decision:
  `db`, `i18n-core`, `i18n-message`, and `i18n-react` are not incidental folders; they are platform contracts.
- Why:
  Repo structure clearly shows these packages as shared foundations across apps.
- Consequence:
  App-level changes must preserve compatibility with these shared packages. fileciteturn4file10 fileciteturn4file12

---

## 3. Update Rule for New Entries

When adding a new decision:

1. assign a new sequential `DEC-XXX`
2. write one concrete decision only
3. explain why it exists
4. classify it correctly (`LOCKED`, `ACTIVE`, `TEMPORARY`, `RETIRED`)
5. describe the consequence on implementation
6. never silently edit the meaning of older decisions without marking the change explicitly

---

## 4. What Must Never Go Into This File

Do **not** add:

- daily progress diary notes
- code diffs
- generic TODO lists
- emotional commentary
- temporary debugging observations
- UI polish notes that are not real platform decisions

This file must stay a **decision ledger**, not a work journal.
