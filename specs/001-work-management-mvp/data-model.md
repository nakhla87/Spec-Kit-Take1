# Data Model: Personal Work Management Application — MVP

**Feature**: `001-work-management-mvp` | **Date**: 2026-09-29

All entities are persisted in SQL Server via EF Core code-first migrations. EF entities live in `WorkManager.Domain/Entities/`. DTOs used at the API boundary live in `WorkManager.Application/DTOs/`.

---

## Entities

### WorkItem

The core entity of the application.

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| Id | int | No | PK, auto-increment |
| Title | string(200) | No | Required |
| Description | string(max) | Yes | Free text notes |
| PriorityId | int | Yes | FK → Priority |
| StatusId | int | No | FK → Status; defaults to the status with SystemKey = Open |
| ProjectId | int | Yes | FK → Project |
| CategoryId | int | Yes | FK → Category |
| DueDate | DateOnly | Yes | Date component of deadline; local wall-clock date (see Time Handling) |
| DueTime | TimeOnly | Yes | Optional time component; local wall-clock time; only meaningful when DueDate is set |
| ReminderAt | DateTime | Yes | UTC datetime when reminder fires |
| ReminderAcknowledgedAt | DateTime | Yes | UTC datetime when user dismissed the reminder; null = not yet acknowledged |
| PreSnoozeStatusId | int | Yes | FK → Status; saved when item is snoozed; cleared on snooze expiry |
| SnoozeUntil | DateTime | Yes | UTC datetime until which item is hidden; cleared on expiry |
| CreatedAt | DateTime | No | UTC, set on insert |
| UpdatedAt | DateTime | No | UTC, updated on every save |
| CompletedAt | DateTime | Yes | UTC; set when status changes to Done; cleared when status changes away from Done |

**Relationships**:
- Many-to-one: Priority, Status, Project, Category (each nullable except Status)
- Many-to-one: PreSnoozeStatus → Status (nullable)
- Many-to-many: Tags (via WorkItemTag junction)
- One-to-many: ActivityRecords

**Validation rules**:
- `Title` must not be empty or whitespace.
- `DueTime` is only persisted when `DueDate` is also set.
- `SnoozeUntil` must be a future datetime at time of setting.
- `ReminderAt` must not be set in the past at time of saving (warn or reject).
- `PreSnoozeStatusId` is set only by the snooze operation; cleared by snooze expiry.

---

### Priority

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| Id | int | No | PK, auto-increment |
| Name | string(50) | No | Unique, required |
| SortOrder | int | No | Lower = higher urgency; used for sorting work items by priority |
| IsActive | bool | No | false = deactivated/archived; cannot be assigned to new items |

**Seed data** (SortOrder ascending = most urgent first):

| Name | SortOrder |
|------|-----------|
| Immediate | 10 |
| Critical | 20 |
| High | 30 |
| Medium | 40 |
| Low | 50 |
| Very Low | 60 |

**Validation rules**:
- `Name` must be unique across active and inactive priorities.
- Deactivating a priority does not affect existing work items that reference it.
- `SortOrder` values are non-negative integers; gaps are permitted to allow reordering without renumbering.

---

### Status

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| Id | int | No | PK, auto-increment |
| Name | string(50) | No | Unique, required |
| SystemKey | string(20) | Yes | Unique when not null (filtered unique index); one of Open, InProgress, Done, Postponed, Snoozed, Cancelled; immutable; null for user-created statuses |
| SortOrder | int | No | Display order, ascending; gaps allowed (same rules as Priority) |
| IsActive | bool | No | false = cannot be assigned to new items |

**Seed data**:

| Name | SystemKey | SortOrder |
|------|-----------|-----------|
| Open | Open | 10 |
| In Progress | InProgress | 20 |
| Done | Done | 30 |
| Postponed | Postponed | 40 |
| Snoozed | Snoozed | 50 |
| Cancelled | Cancelled | 60 |

**Validation rules**:
- `Name` must be unique.
- System statuses (SystemKey not null) can be renamed and reordered but MUST NOT be deactivated (deactivate returns 409 Conflict). All application logic resolves statuses by `SystemKey`, never by `Name`.
- `SystemKey` cannot be set or changed through the API; user-created statuses always have SystemKey = null.
- No status is terminal: any work item may transition to any other status regardless of current status.

---

### Project

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| Id | int | No | PK, auto-increment |
| Name | string(100) | No | Unique among non-archived, required |
| SortOrder | int | No | Display order, ascending; gaps allowed; new records default to max(SortOrder) + 10 |
| IsArchived | bool | No | Archived projects are read-only; cannot be assigned to new items |

**Validation rules**:
- `Name` must be unique among non-archived projects.
- Archiving a project does not modify work items already assigned to it.

---

### Category

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| Id | int | No | PK, auto-increment |
| Name | string(100) | No | Unique among non-archived, required |
| SortOrder | int | No | Display order, ascending; gaps allowed; new records default to max(SortOrder) + 10 |
| IsArchived | bool | No | Archived categories cannot be assigned to new items |

**Validation rules**:
- `Name` must be unique among non-archived categories.
- Archiving a category does not modify work items already assigned to it.

---

### Tag

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| Id | int | No | PK, auto-increment |
| Name | string(50) | No | Unique among non-archived, required |
| SortOrder | int | No | Display order, ascending; gaps allowed; new records default to max(SortOrder) + 10 |
| IsArchived | bool | No | Archived tags cannot be assigned to new items |

**Validation rules**:
- `Name` must be unique among non-archived tags.
- Archiving a tag does not remove it from existing work items.

---

### WorkItemTag (junction)

| Field | Type | Notes |
|-------|------|-------|
| WorkItemId | int | FK → WorkItem, part of composite PK |
| TagId | int | FK → Tag, part of composite PK |

**Notes**: Composite primary key `(WorkItemId, TagId)`. Cascade delete on WorkItem deletion removes WorkItemTag rows.

---

### ActivityRecord

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| Id | int | No | PK, auto-increment |
| WorkItemId | int | No | FK → WorkItem (cascade delete) |
| EventType | string(50) | No | See EventType enum below |
| OldValue | string(500) | Yes | Human-readable representation of previous value |
| NewValue | string(500) | Yes | Human-readable representation of new value |
| OccurredAt | DateTime | No | UTC datetime of the change |

**EventType values**:

| Value | Triggered when |
|-------|---------------|
| Created | Work item is first saved |
| StatusChanged | Status field changes (includes re-opening Done/Cancelled items) |
| PriorityChanged | Priority field changes |
| DueDateChanged | DueDate or DueTime changes |
| ProjectChanged | Project assignment changes |
| Completed | Status changes specifically to Done |
| Postponed | User invokes postpone operation (sets new DueDate) |
| Snoozed | User invokes snooze operation |
| SnoozeExpired | System restores status after snooze period ends |

**Notes**: ActivityRecords are immutable after creation. Deletion of a work item cascades to delete all its ActivityRecords.

---

## State Transitions

### Work Item Status State Machine

All transitions are permitted (no terminal states). Statuses below are identified by `SystemKey`. The following transitions have special side effects:

| From | To | Side Effects |
|------|----|-------------|
| Any | SystemKey = Done | `CompletedAt` = now (UTC); ActivityRecord: Completed |
| SystemKey = Done | Any other | `CompletedAt` = null; ActivityRecord: StatusChanged |
| Any | SystemKey = Snoozed | `PreSnoozeStatusId` = current StatusId; `SnoozeUntil` = user-specified; ActivityRecord: Snoozed |
| SystemKey = Snoozed | (snooze expiry) | `StatusId` = `PreSnoozeStatusId`; `PreSnoozeStatusId` = null; `SnoozeUntil` = null; ActivityRecord: SnoozeExpired |
| Any | SystemKey = Postponed | `DueDate` updated to user-specified date; ActivityRecord: Postponed |

### Snooze Expiry Resolution

Snooze expiry is resolved lazily on the API side: when any endpoint loads a `WorkItem` whose status has `SystemKey = Snoozed` and `SnoozeUntil <= ILocalClock.UtcNow`, the service layer automatically applies the snooze expiry transition before returning the item. This ensures no background scheduler is needed.

---

## Time Handling

- `DueDate` / `DueTime`: local wall-clock values (no offset stored).
- `ReminderAt`, `SnoozeUntil`, `CreatedAt`, `UpdatedAt`, `CompletedAt`, `OccurredAt`: UTC.
- "Local today" = UTC now converted with the configured timezone: `App:TimeZoneId` in appsettings (empty = machine local timezone).
- An item was completed on local date D when `CompletedAt`, converted to local time, falls on D.
- All time access goes through `ILocalClock` (built on .NET `TimeProvider`) so it can be faked in tests; no direct `DateTime.UtcNow` / `DateTime.Today` in services.

---

## Overdue Logic

A work item is considered **overdue** when:
- `DueDate` is set AND
- The effective local due datetime (`DueDate` + `DueTime` if set, otherwise end of that local day) is before local now AND
- The status's `SystemKey` is not Done, Cancelled, or Snoozed

Postponed items ARE included once their new due date has passed (postponing resolves overdue only by moving the date).

Overdue status is computed at query time; it is not stored as a field.

## Due State

Every work item response carries a computed `DueState` (not stored), evaluated in this order:

| DueState | Rule |
|----------|------|
| Completed | Status SystemKey = Done |
| None | Status SystemKey = Cancelled, or no DueDate |
| Overdue | Overdue Logic above is true |
| DueToday | DueDate = local today (and not overdue) |
| Upcoming | DueDate > local today |

A Snoozed item with a past due date gets `None` until the snooze expires (snooze is an explicit user action to hide it).

`DueState` and the overdue rule are implemented once in `DueStateCalculator` and reused by item mapping and view queries.

---

## Database Indexes

Recommended indexes for query performance. All are created in the initial migration (T019/T020):

| Index | Columns | Reason |
|-------|---------|--------|
| IX_WorkItem_StatusId | StatusId | View filters |
| IX_WorkItem_DueDate | DueDate | Date-based views and overdue detection |
| IX_WorkItem_ProjectId | ProjectId | Project filter |
| IX_WorkItem_CategoryId | CategoryId | Category filter |
| IX_WorkItem_PriorityId | PriorityId | Priority filter and join for priority sort |
| IX_Priority_SortOrder | Priority.SortOrder | Priority sort (SQL Server indexes can't span tables, so this lives on `Priority`) |
| IX_WorkItem_CompletedAt | CompletedAt | Completed work view |
| IX_WorkItem_ReminderAt | ReminderAt, ReminderAcknowledgedAt | Pending reminder polling |
| IX_ActivityRecord_WorkItemId | WorkItemId | History lookup |
