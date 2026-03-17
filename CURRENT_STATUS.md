# CURRENT_STATUS

Last Updated: 2026-03-17
Document Owner: Platform Operating Memory
Authority: Operational snapshot for daily execution

---

## 0. Purpose

This file exists to answer one question quickly and accurately:

**Where exactly is the platform right now, what is already established, what must not be broken, and what should be done next?**

This file is **not** an architecture rewrite, not a brainstorming note, and not a marketing summary.
It is the operational state document used to continue work safely from one day to the next.

---

## 1. Reading Rule

When this file is used together with the other operating documents, the precedence order is:

1. `ARCHITECTURE.md` — final architectural baseline
2. `DECISIONS_LOG.md` — locked and active engineering/business decisions
3. `CURRENT_STATUS.md` — current working state and immediate continuation
4. `WORK_RULES.md` — execution discipline for engineering + ChatGPT workflow

If any section here conflicts with `ARCHITECTURE.md`, the architecture file wins.

---

## 2. Snapshot Type

This document is a **repository-grounded operational snapshot**.

It reflects:

- verified repo structure
- verified file/package existence
- verified architectural baseline
- verified migration/history signals visible in the repository
- operational continuation priorities inferred from the current codebase shape

It does **not** claim that every listed feature is fully QA-verified in production.
It records what is present, what is structurally in progress, and what the next work should protect or complete.

---

## 3. Platform Identity

The platform is a:

**WhatsApp-first, multi-service, owner-controlled, subscription-based marketplace SaaS**
with approval-based booking flow, payment-agnostic billing design, and long-term super-app / omni-channel expansion intent.

The core business trajectory is:

**WhatsApp bot → owner web/admin surfaces → scalable multi-channel platform → global marketplace / super app**.

This identity is locked by architecture and must not be diluted into a simple single-service bot or a one-off website.

---

## 4. Verified Repository State

### 4.1 Monorepo foundation exists

The repository is already organized as a real monorepo with:

- `apps/bot-api`
- `apps/owner-web`
- `packages/db`
- `packages/i18n-core`
- `packages/i18n-message`
- `packages/i18n-react`

This means the project is **already beyond MVP-sprawl stage** and has a shared-platform direction established. fileciteturn4file10 fileciteturn4file12

### 4.2 Backend application surface exists

The API layer currently exposes route/service surfaces for at least:

- billing
- owner profile
- owner properties
- booking
- owner bookings
- messages
- favorites
- webhook handling
- health checks
- background worker processing
- payment provider adapters
- WhatsApp handler/signature/client services

This indicates that the system already has meaningful operational vertical slices, not just schema-only planning. fileciteturn4file7 fileciteturn4file8

### 4.3 Owner web application surface exists

The owner web currently has pages for at least:

- dashboard
- services
- billing
- pay
- bookings
- booking detail
- receipt
- profile
- properties list
- property creation

This indicates that owner-facing operational control is already materially underway. fileciteturn4file12 fileciteturn4file13

### 4.4 Shared i18n platform foundation exists

The repository already contains shared i18n layers:

- `i18n-core`
- `i18n-message`
- `i18n-react`

and expanded locale files across multiple languages.
This is not theoretical planning anymore; the language platform is already an active structural concern of the monorepo. fileciteturn4file5 fileciteturn4file9

### 4.5 Database and migration history show real platform evolution

The Prisma schema and migration history show that the codebase has already evolved through multiple critical business concerns, including signals for:

- core schema initialization
- conversation state
- booking draft
- favorites
- owner UUID / owner identity work
- subscription core
- invoice and `paidUntil`
- approval expiry window
- subscription tier + billing cycle
- owner profile / bio / property location / media
- demand rate limit

This confirms the project is in active platform migration/evolution, not in blank-slate concept mode. fileciteturn4file5 fileciteturn4file6 fileciteturn4file11

---

## 5. Verified Architectural Baseline

The architecture document locks the following baseline:

- extend the existing foundation; do not rewrite it
- service pricing is server-controlled only
- subscription is per-service, not global
- owner must have active subscription to use a service
- booking is approval-based; auto-approval is forbidden
- billing must be payment-agnostic and secure
- omni-channel expansion must be adapter-based, not rewrite-based
- the shared i18n platform is mandatory
- locale resolution must be centralized
- system default locale remains `en`

These are not optional preferences. They are binding platform rules. fileciteturn4file0 fileciteturn4file1 fileciteturn2file2

---

## 6. What Is Already Established

The following should be treated as **already established platform direction**:

### 6.1 Foundation-first engineering is active

The system already has a protected core and cannot be safely handled as a rewrite-friendly toy project.
The existing DB structure, worker flow, invoice logic, owner model, property model, favorites model, and billing router are part of the preserved foundation. fileciteturn4file0

### 6.2 Owner journey is already a serious product surface

The architecture requires professional owner access, active services continuity, secure recovery, and long-term multi-profile readiness.
The owner web page surface confirms this direction is not abstract. fileciteturn4file2 fileciteturn4file12

### 6.3 Billing is a core integrity zone

Plan changes, renewal separation, same-plan blocking, pre-payment immutability, and post-payment authoritative state change are all locked rules.
Billing work must therefore be treated as high-risk and transactionally sensitive. fileciteturn4file1 fileciteturn4file3

### 6.4 Omni-channel expansion is a long-term requirement

The system is WhatsApp-first, but the core must remain platform-agnostic and expandable through adapters.
Any work that hardcodes business rules into one transport/channel is architectural debt. fileciteturn4file4

### 6.5 Shared i18n is platform infrastructure, not UI sugar

The architecture requires one shared language system across owner/user/admin/backend/channels.
The repo packages confirm that this direction has already begun structurally. fileciteturn2file5 fileciteturn4file5

---

## 7. Current Working Interpretation

Based on the architecture baseline and current repository shape, the platform should be interpreted as being in this stage:

### Stage Name
**Foundation locked, core monorepo operational, platform migration active, feature hardening still in progress.**

### What that means

The project is **not** at idea stage.
It is also **not yet safely “finished”** in the sense of full-system stabilization.

The repository suggests the current reality is:

- foundational architecture exists
- real owner/backend surfaces exist
- shared platform packages exist
- business-critical flows exist
- the system still needs controlled continuation, hardening, consistency work, and cross-surface discipline

This is exactly the phase where careless edits create the most hidden damage.

---

## 8. Current Strategic Tracks

The following tracks should be treated as the main active program of work.
These are the most natural continuation lines implied by the repo + architecture combination.

### 8.1 Owner access, recovery, and continuation maturity

Reason:

- architecture explicitly requires secure owner access, account/profile separation, active services card, and deterministic continuation
- owner web already exposes dashboard/services/billing/profile/property surfaces

Interpretation:

This platform is transitioning from onboarding-only owner behavior toward durable professional owner operations. fileciteturn4file2 fileciteturn4file12

### 8.2 Subscription gating and billing correctness

Reason:

- active subscription is mandatory for service usage
- billing transition rules are explicitly locked
- repo contains billing routes/pages and subscription-related migrations

Interpretation:

Billing and subscription state synchronization remain a top integrity surface. fileciteturn4file1 fileciteturn4file8

### 8.3 Listing / property / resource management hardening

Reason:

- owner property routes and owner-web property pages already exist
- migrations indicate profile/media/location evolution
- architecture treats Property as the first resource implementation in a future universal resource model

Interpretation:

The property/listing flow is an active real surface and must be hardened as the first scalable resource vertical. fileciteturn4file0 fileciteturn4file12

### 8.4 Shared i18n migration continuation

Reason:

- architecture locks one shared language platform
- repo already contains shared i18n packages and expanded locale set

Interpretation:

The migration must continue away from scattered/local translation patterns and toward typed shared catalogs/adapters. fileciteturn2file5 fileciteturn2file7 fileciteturn4file9

### 8.5 Time / expiry / lifecycle consistency

Reason:

- the domain includes bookings, approvals, reminders, subscription expiry, `paidUntil`, approval-expire windows, calendar behavior, booking detail pages, and dashboard ordering concerns
- these systems are inherently date/time sensitive

Interpretation:

Date, timezone, expiry, sorting, and lifecycle behavior should be treated as a systemic integrity concern, not a UI formatting detail. fileciteturn4file1 fileciteturn4file5

---

## 9. Non-Negotiable Invariants

The following invariants must remain true during all continuation work:

1. **No rewrite of the existing core foundation.**
2. **No client-trusted pricing or client-authoritative billing amount.**
3. **No auto-approval booking behavior.**
4. **No pre-payment mutation of a valid active subscription.**
5. **No isolated panel-specific language architecture.**
6. **No platform/channel-specific business logic leakage into the core domain.**
7. **No identity model that depends only on temporary local storage or weak client hints.**
8. **No hidden breaking change to monorepo shared packages or contracts.**
9. **No partial shortcut that violates the adapter-based omni-channel direction.**
10. **No uncontrolled free-form WhatsApp chat behavior that undermines cost/spam architecture.**

These are baseline safety rails taken directly from the system architecture. fileciteturn4file0 fileciteturn4file1 fileciteturn4file4

---

## 10. High-Risk Zones

These areas require extra caution because they can create hidden system-wide breakage:

### 10.1 Billing / pay / renew / receipt / webhook chain

Why risky:

- state synchronization is locked by architecture
- payment success and plan change semantics are strict
- invoices and provider references are integrity-critical

### 10.2 Date / time / expiry / booking lifecycle logic

Why risky:

- booking status, approval windows, reminders, active/expired sorting, and subscription `paidUntil` all depend on consistent time semantics

### 10.3 Owner identity and service continuation context

Why risky:

- incorrect owner resolution causes access bugs, subscription confusion, wrong-profile actions, and future multi-profile debt

### 10.4 Shared i18n contracts and locale resolution

Why risky:

- fragmented translation or locale handling quickly creates cross-surface inconsistency and migration debt

### 10.5 Shared contracts across apps/packages

Why risky:

- monorepo drift can silently break owner-web ↔ bot-api ↔ db ↔ i18n interoperability

---

## 11. What “Done” Means for the Current Phase

For the current phase, work should be considered meaningfully complete only if:

- architecture invariants are preserved
- owner flow state and service continuation are deterministic
- billing transitions behave exactly as locked
- listing/property flows are stable and cross-surface compatible
- shared i18n remains the source of truth for visible text behavior
- date/time/expiry behavior is consistent across API, DB, worker, and owner-web surfaces
- no new hidden monorepo drift is introduced

“UI appears to work” is **not** sufficient.
“Single endpoint works locally” is **not** sufficient.
The platform phase requires **behavioral correctness + architectural consistency**.

---

## 12. Immediate Next-Step Policy

When continuing work from this snapshot, use this order:

### Priority 1 — protect invariants
First confirm that the next task does not violate locked architecture.

### Priority 2 — resolve one vertical slice at a time
Work in focused slices such as:

- owner identity / continuation
- billing state / plan transition
- property/listing creation/editing
- booking lifecycle / approval visibility
- shared i18n migration of one surface
- date/expiry audit of one subsystem

### Priority 3 — prefer single-file controlled changes
Do not introduce uncontrolled repo-wide refactors unless the task explicitly demands it.

### Priority 4 — update operating memory immediately after meaningful change
After material progress, update:

- `CURRENT_STATUS.md` if the operational stage changed
- `DECISIONS_LOG.md` if a new decision was made
- `WORK_RULES.md` if execution discipline changed

---

## 13. Practical Next Concrete Step

If no other higher-priority bug or production issue interrupts the plan, the safest next continuation move is:

**Continue with one tightly scoped, high-integrity vertical slice that touches owner continuation, billing consistency, property/resource management, or date/expiry behavior — while preserving monorepo shared contracts and the shared i18n direction.**

Recommended default question before the next code change:

> Which single file is currently the highest-risk bottleneck for owner continuation, billing correctness, listing flow stability, or date/expiry consistency?

That should be the next file worked on.

---

## 14. Daily Update Rules for This File

When updating this file at the end of a workday:

### Allowed updates

- operational stage changed
- new verified surface was added
- a strategic track moved from “active” to “stabilized”
- a new major risk appeared
- a previous risk was genuinely closed
- next-step policy changed due to real repo progress

### Forbidden updates

- invented progress
- vague claims like “many improvements were made”
- emotional commentary
- low-value diary style notes
- duplicating the full architecture here

This file must stay **sharp, current, and decision-useful**.
