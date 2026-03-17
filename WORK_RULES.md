# WORK_RULES

Last Updated: 2026-03-17
Document Owner: Engineering Execution Discipline
Authority: Daily operating rules for code work and ChatGPT collaboration

---

## 0. Purpose

This file defines **how the platform must be worked on**.

It exists to prevent:

- context drift between chats
- dangerous refactors
- invented progress summaries
- architecture violations hidden inside “quick fixes”
- inconsistent instructions across work sessions

This file is the execution contract for the repo.

---

## 1. Authority Order

When multiple instructions exist, use this precedence:

1. `ARCHITECTURE.md`
2. `DECISIONS_LOG.md`
3. `WORK_RULES.md`
4. `CURRENT_STATUS.md`
5. task-specific instructions for the current work item

If a task request conflicts with architecture or a locked decision, the task request must be reinterpreted safely instead of blindly followed.

---

## 2. Core Working Identity

This project must always be treated as a:

- production-grade monorepo
- multi-tenant SaaS foundation
- WhatsApp-first marketplace core
- owner-controlled booking/subscription system
- long-term omni-channel / super-app candidate
- architecture-first system, not a throwaway prototype

All engineering decisions must be made at that level.

---

## 3. Mandatory Engineering Mindset

Every code task must be handled with this reasoning order:

1. **Risk** — what can break?
2. **Cause** — what is structurally wrong or incomplete?
3. **Impact** — what user/business/system behavior is affected?
4. **Fix** — what is the safest implementation path?
5. **Compatibility** — what cross-file and cross-layer contracts must remain intact?

No shallow fix is acceptable if it creates hidden platform debt.

---

## 4. Non-Negotiable Platform Rules

### 4.1 No foundation rewrite
The existing core must be extended, not rewritten.

### 4.2 No client-trusted price or payment amount
All pricing remains server authoritative.

### 4.3 No auto-approval booking shortcuts
Booking activation always respects owner-controlled approval architecture.

### 4.4 No pre-payment mutation of valid subscriptions
Checkout creation must not corrupt active subscription state.

### 4.5 No isolated i18n islands
No page, route, worker, or panel may create its own disconnected translation architecture.

### 4.6 No transport-layer business logic leakage
Core business logic must not become WhatsApp-specific, Telegram-specific, or UI-specific.

### 4.7 No weak identity assumptions
Owner or user identity must not depend solely on fragile client-side hints.

### 4.8 No hidden multi-package breakage
Any app-level change must preserve shared package compatibility.

### 4.9 No architecture-hostile shortcuts for speed
Fast implementation is allowed; architectural sabotage is not.

### 4.10 No invented progress or fictional validation claims
Only write what is actually verified.

---

## 5. Repository Modification Rules

### 5.1 Default mode is single-file controlled work
Unless a task explicitly demands otherwise, work should proceed with **one next file at a time**.

Reason:

- lower blast radius
- easier review
- better rollback safety
- less hidden drift
- better ChatGPT accuracy

### 5.2 Full corrected file over vague patch fragments
When fixing a file in the focused workflow, prefer returning the complete corrected file instead of partial patch fragments.

### 5.3 Preserve cross-file contracts
Even in single-file mode, the solution must stay compatible with:

- Prisma schema/domain rules
- route/page payload contracts
- shared package exports
- i18n types/contracts
- owner flow state transitions

### 5.4 No silent contract changes
If a response shape, enum meaning, identifier format, or state machine rule changes, that change must be called out explicitly and usually logged in `DECISIONS_LOG.md` if it is durable.

---

## 6. Monorepo Rules

### 6.1 Shared packages are platform contracts
Treat these as protected shared foundations:

- `packages/db`
- `packages/i18n-core`
- `packages/i18n-message`
- `packages/i18n-react`

### 6.2 App code must consume shared contracts, not fork them
If a page or route needs logic already belonging to shared infrastructure, migrate toward the shared layer instead of duplicating it locally.

### 6.3 Avoid contract drift between apps
`apps/bot-api` and `apps/owner-web` must evolve coherently around the same business truth.

### 6.4 Repo-wide refactor requires explicit justification
Do not perform broad refactors just because they feel cleaner.
Only do them when the risk reduction or architectural gain is clear.

---

## 7. I18n Rules

### 7.1 Shared i18n remains the source of truth
Visible text should continue moving into the shared language platform.

### 7.2 Default locale remains `en`
This must not be changed casually.

### 7.3 User-visible text standard
All newly introduced user-visible and owner-visible text should be written in **formal Azerbaijani** where the target surface expects Azerbaijani.

### 7.4 No page-local translation chaos
Do not create scattered ad hoc dictionaries or repeated UI text objects across unrelated files.

### 7.5 Locale behavior must stay centralized
Normalization, fallback, resolution, formatting locale mapping, and direction handling belong in shared infrastructure.

---

## 8. Billing Rules

### 8.1 Billing is a high-integrity zone
Billing-related code must be treated as security-sensitive and state-sensitive.

### 8.2 Eligibility logic must stay synchronized
The following must not drift apart:

- billing status
- selected plan context
- pay page eligibility
- renew endpoint behavior
- webhook/payment success logic
- receipt/final state output

### 8.3 Same-plan and different-plan paths must remain distinct
Never merge renewal logic and plan-change logic into a single ambiguous branch.

### 8.4 Provider adapters are implementation detail, not billing truth
Stripe/mock/local providers must remain pluggable around the same billing rules.

---

## 9. Owner Flow Rules

### 9.1 Owner continuation must be deterministic
Do not rely on memory guesswork or loose browser state when the platform should know exactly where the owner should continue.

### 9.2 Service context must be explicit
Owner actions should remain tied to a clear active service context where required.

### 9.3 Future multi-profile compatibility must be preserved
Do not hardcode assumptions that permanently prevent workspace/profile switching later.

### 9.4 Profile, billing, listings, and bookings must remain operationally coherent
The owner experience is one professional system, not a group of unrelated pages.

---

## 10. Date / Time / Lifecycle Rules

### 10.1 Treat time as domain logic, not formatting only
Date/time behavior affects:

- booking lifecycle
- approval expiry
- subscription expiry
- reminders
- sorting
- grouping
- visibility windows
- receipts/history

### 10.2 Never trust visually correct formatting as proof of logical correctness
A page can display a date correctly while backend lifecycle logic is still wrong.

### 10.3 Any date-related change must consider all layers
At minimum think across:

- DB storage
- server parsing
- business rules
- client rendering
- timezone effects
- expiry comparisons

---

## 11. ChatGPT Collaboration Rules

### 11.1 ChatGPT must work from evidence, not imagination
When asking ChatGPT to update status or make decisions, provide:

- changed files
- actual completed work
- open risks
- new decisions
- optionally `git diff --stat` or commit summary

### 11.2 ChatGPT must not invent progress
If something is not verified, it should be labeled as inferred, recommended, or unknown.

### 11.3 ChatGPT must distinguish three levels clearly
Every serious response should separate:

- **verified from repo/docs**
- **inferred from structure**
- **recommended next action**

### 11.4 ChatGPT should prefer precision over breadth
Do not ask for giant unfocused outputs when a precise single-file or single-slice answer is safer.

### 11.5 ChatGPT should surface risk early
If a dangerous bug, inconsistency, or invariant violation is detected, it should be stated before polishing suggestions.

### 11.6 ChatGPT should return complete operational artifacts when asked
For files like status docs, decision logs, workflows, and single-file fixes, prefer complete ready-to-paste outputs.

---

## 12. Daily Workflow Rules

### 12.1 Start-of-day rule
At the beginning of a work session, review:

- `CURRENT_STATUS.md`
- `DECISIONS_LOG.md`
- `WORK_RULES.md`

before starting substantive code work.

### 12.2 End-of-day rule
At the end of a work session:

- update `CURRENT_STATUS.md` if operational state changed
- update `DECISIONS_LOG.md` only if a real decision was made
- update `WORK_RULES.md` only if working discipline or constraints changed

### 12.3 Evidence-first end-of-day update input
Before asking ChatGPT to update those files, provide only factual inputs such as:

- which files changed
- what was completed
- what remains open
- which risks were found
- whether any permanent decision was made

### 12.4 Commit the operating memory
These files should live in the repo and be committed so that project memory travels with the codebase.

---

## 13. What Must Never Happen in Responses or Updates

Do **not** allow:

- invented architecture claims
- fake completion claims
- silent breaking changes
- uncontrolled multi-file rewrites presented as “cleanup”
- generic best-practice fluff with no repo grounding
- page-local i18n regressions
- pricing logic moved toward the client
- identity/security shortcuts disguised as UX improvements
- broad edits that ignore the locked architecture baseline

---

## 14. Preferred Task Framing

When asking for code help, prefer prompts like these:

- “Choose the single highest-risk next file and fix it fully.”
- “Audit this route for state, billing, timezone, and security risks.”
- “Update only these three operating documents from the facts below.”
- “Preserve architecture and cross-file compatibility; return the full corrected file.”

Avoid prompts like:

- “Refactor everything”
- “Clean the whole repo”
- “Make it enterprise”
- “Fix all issues everywhere”

Those prompts create drift and hallucination risk.

---

## 15. Definition of a Good Work Session

A work session is good only if:

- one meaningful slice moved forward
- no locked rule was violated
- no hidden compatibility damage was introduced
- the repo memory was kept current
- the next step is clearer than before

That is the standard.
