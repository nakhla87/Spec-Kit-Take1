# Analysis Findings Register: Personal Work Management Application — MVP

**Feature**: `001-work-management-mvp`
**Source**: `/speckit-analyze` runs on 2026-10-03 and 2026-10-05; S1, U3, D2, G1–G4, I5 resolved 2026-10-17
**Purpose**: Track open findings across spec.md, plan.md, tasks.md, data-model.md, contracts/, and quickstart.md so they can be resolved at the right point during implementation.

Finding IDs match the analysis reports and stay the same across runs. When a finding is resolved, set **Status** to `Resolved`, fill in **Resolution**, and move it to the Resolved section.

---

## Summary

| Severity | Open | Resolved |
|----------|------|----------|
| CRITICAL | 0 | 2 |
| HIGH | 0 | 5 |
| MEDIUM | 7 | 6 |
| LOW | 5 | 2 |

## When to resolve

Each open finding has a **Resolve before** gate: the implementation phase (from tasks.md) whose tasks it changes. Resolve it before that phase starts so no completed code needs rework.

| Gate | Findings |
|------|----------|
| Before Phase 5 (US3) | I7, U4 |
| Before Phase 6 (US4) | I6 |
| Before Phase 7 (US5) | I3, I4, I9 |
| Before Phase 10 (Polish) | G5, A1, I8 |
| Anytime / post-MVP | A2, D1, D3 |

---

## Open Findings

### MEDIUM

| ID | Category | Location(s) | Finding | Recommendation | Resolve before | Decision needed? | Status |
|----|----------|-------------|---------|----------------|----------------|------------------|--------|
| I7 | Inconsistency | T052, T053 | Both are marked [P] but edit the same file, `WorkItemService.cs`, which breaks the [P] definition. | Remove [P] from T053 (runs after T052). | Phase 5 | No | Open |
| I6 | Inconsistency | FR-030 ("tags") vs api-work-items.md / T062 `tagId` | Filtering supports only a single tag. | Option A: accept `tagIds[]` (match any or all). Option B: state single-tag filtering in FR-030. | Phase 6 | **Yes** | Open |
| I3 | Inconsistency | spec US3-AS5 vs US5-AS1; api-views.md (Inbox); quickstart S4 step 3 | Snoozed items must be hidden from active views, but Inbox is "Status ≠ Done, ≠ Cancelled", which includes Snoozed. Quickstart S4 already expects them gone from Inbox. | Exclude Snoozed from Inbox in US5-AS1, api-views.md, and T070. | Phase 7 | No | Open |
| I4 | Inconsistency | spec US5-AS3; T069; api-views.md (`days=30`) | The spec says Upcoming is "due in the future"; the contract and tasks limit it to a 30-day window. | Option A: add the 30-day window to the spec. Option B: remove the default (unbounded). | Phase 7 | **Yes** | Open |
| I8 | Inconsistency | research.md Decision 10 vs T095; T097–T104 | research.md says unit tests use mocked repositories (Moq/NSubstitute); T095 says hand-written fakes and no mocking library. T095 creates `WorkManager.Api.Tests`, but no test task writes to it. | Update research.md to say fakes, and either drop `Api.Tests` or move the endpoint tests (T098, T099, T103) into it. | Phase 10 (or Phase 1 if convenient) | No | Open |
| G5 | Coverage | SC-002, SC-004 | No task seeds data or measures the performance criteria (search across 500 items, <2s view switch). | Add a task: a dev-only seed script for 500 work items, used by T094 for the SC-002/SC-004 checks. | Phase 10 | No | Open |
| A1 | Ambiguity | SC-008 | "90% of primary actions complete without errors in normal usage" can't be measured for a single local user. | Replace with: "All primary actions exercised in W01–W18 complete without error." | Phase 10 | **Yes** (confirm wording) | Open |

### LOW

| ID | Category | Location(s) | Finding | Recommendation | Resolve before | Status |
|----|----------|-------------|---------|----------------|----------------|--------|
| U4 | Underspecification | T058 SnoozeDialog | The local → UTC conversion for snooze-until isn't stated; T056 covers it only for the main form. | Add "send as UTC ISO string" to T058. | Phase 5 | Open |
| I9 | Inconsistency | spec US5-AS4 vs FR-026 | The Overdue view acceptance scenario says "not completed or cancelled" and leaves out Snoozed. | Align the wording with FR-026. | Phase 7 | Open |
| A2 | Ambiguity | Constitution I and Development Workflow | Vague quality words ("fast", "reliable, intuitive"), partly bounded by SC-001 and SC-004. | Acceptable as is; optionally reference the SCs. | Anytime | Open |
| D1 | Duplication | FR-004 ≈ FR-035; FR-036 ≈ US5-AS7 ≈ US6-AS4 | Completion timestamp and Completed Today summary are stated in several places. | Consolidate into one requirement each. | Anytime | Open |
| D3 | Duplication | api-work-items.md (`isOverdue` + `dueState`) | `isOverdue` adds nothing beyond `dueState`. | Keep for convenience or remove. | Anytime | Open |

---

## Resolved Findings

C1–I2 were resolved on 2026-10-05 by editing spec.md, plan.md, tasks.md, data-model.md, contracts/, and quickstart.md, and confirmed by the second `/speckit-analyze` run. U3, S1, D2, G1–G4 and I5 were resolved on 2026-10-17 and have not yet been re-checked by `/speckit-analyze`.

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| C1 | CRITICAL | The constitution (Principle VII) requires the MVP to be tested; tasks.md had no tests. | Test setup T095–T096; one test task per story (T097–T104) plus T105; story checkpoints require them to pass; T094 runs `dotnet test` and `npm run test`. |
| C2 | CRITICAL | Principle V requires add, edit, reorder, and archive for every lookup type; reordering existed only for priorities. | Option A chosen: FR-012 and FR-041a; `SortOrder` on Status, Project, Category, and Tag; `PUT /reorder` for each; shared `ReorderableList` (T106). |
| C3 | HIGH | Principle III / FR-025: only overdue was visually distinguished. | FR-025 defines five due states; the API returns a computed `dueState`; `DueStateCalculator` (T107); `DueStateBadge` (T031). |
| I1 | HIGH | Postponed items never showed as overdue again after their new date passed. | FR-026 and the overdue rule exclude only Done, Cancelled, and Snoozed; T070, T102, quickstart S4. |
| U1 | HIGH | Built-in logic relied on status names, which users can edit. | FR-012a; immutable `Status.SystemKey`; system statuses can't be deactivated (409); `SystemStatus` enum (T109). |
| U2 | HIGH | "Today", "overdue", and "completed today" were computed in UTC. | Machine-local timezone with an `App:TimeZoneId` override (FR-042); `ILocalClock` (T108); Time Handling section in data-model. |
| I2 | HIGH | The 18 acceptance workflows weren't listed in the spec. | W01–W18 table in the spec; SC-007 updated; quickstart checklist; T094. |
| U3 | MEDIUM | `IX_WorkItem_PriorityId (PriorityId, Priority.SortOrder)` couldn't be built: SQL Server indexes can't include another table's column. | Resolved 2026-10-17: data-model.md now lists `IX_WorkItem_PriorityId (PriorityId)` and `IX_Priority_SortOrder (Priority.SortOrder)`; both are in T019. |
| S1 | LOW | Spec status was still "Draft". | Resolved 2026-10-17: spec.md status set to `Approved`. |
| D2 | LOW | The ReminderAt index appeared in both T019 and T092. | Resolved 2026-10-17: T092 removed; all its indexes (PriorityId, Priority.SortOrder, ReminderAt + ReminderAcknowledgedAt composite) are in T019. |
| G1 | MEDIUM | No task implemented the check that archived/deactivated lookups are rejected (tested by T099). | Resolved 2026-10-17: T026 validates referenced lookups (on update only changed ones, so an item keeps an archived value per FR-017); T027 maps failures to 400; contract PUT updated. |
| G2 | MEDIUM | A past `reminderAt` was rejected only in the frontend. | Resolved 2026-10-17: server-side check in T026/T027; covered in T098. |
| G3 | MEDIUM | Reminder polling could show duplicates; changing `ReminderAt` never cleared `ReminderAcknowledgedAt`. | Resolved 2026-10-17: T061 shows each (workItemId, reminderAt) once per session; T026 clears the acknowledgement on change; contract PUT and T100 updated. |
| G4 | MEDIUM | A plain PUT could set Snoozed/Postponed and bypass the snooze/postpone flows. | Resolved 2026-10-17: PUT returns 400 for those system statuses (T026, T027, contract); WorkItemForm excludes them (T032); covered in T098. |
| I5 | MEDIUM | US1's independent test ("create with all fields") needed US2 selectors and the US3 due date. | Resolved 2026-10-17 (Option B, recorded in spec Clarifications): US1's test covers title, description, priority and status; T051 adds the project/category/tag selectors and T056 the due date; quickstart S1 narrowed. |

---

## How to use this register

1. At the start of each phase, check the **When to resolve** table and resolve that phase's findings first. Most are one- or two-line edits to tasks.md or a contract.
2. For findings marked **Decision needed**, record the choice in spec.md (Clarifications) before editing anything else.
3. After resolving a batch, re-run `/speckit-analyze` and update this register.
4. After the initial implementation, review any remaining Open findings and either resolve them or explicitly defer them to a later phase.
