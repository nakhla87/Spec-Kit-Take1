# API Contract: Work Items

**Base URL**: `http://localhost:5080/api/work-items`
**Content-Type**: `application/json`

---

## GET /api/work-items

Returns a filtered, sorted, paginated list of work items.

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| view | string | Predefined view filter: `inbox`, `today`, `upcoming`, `overdue`, `in-progress`, `snoozed`, `completed-today` |
| priorityId | int | Filter by priority |
| statusId | int | Filter by status |
| projectId | int | Filter by project |
| categoryId | int | Filter by category |
| tagId | int | Filter by tag (items with this tag) |
| dueBefore | date (YYYY-MM-DD) | Filter items due on or before this date |
| dueAfter | date (YYYY-MM-DD) | Filter items due on or after this date |
| search | string | Full-text search across title, description, project name, category name, tag names |
| sortBy | string | One of: `priority`, `dueDate`, `createdAt`, `updatedAt`, `project`, `status` |
| sortDir | string | `asc` or `desc` (default: `asc`) |
| page | int | Page number, 1-based (default: 1) |
| pageSize | int | Items per page (default: 50, max: 200) |

**Response 200**:
```json
{
  "items": [
    {
      "id": 1,
      "title": "Review EDA API specification",
      "description": "Check against latest requirements document",
      "priority": { "id": 3, "name": "High", "sortOrder": 30 },
      "status": { "id": 2, "name": "In Progress", "systemKey": "InProgress" },
      "project": { "id": 1, "name": "EDA" },
      "category": { "id": 4, "name": "Document Review" },
      "tags": [
        { "id": 2, "name": "Azure" },
        { "id": 7, "name": "Documentation" }
      ],
      "dueDate": "2026-10-05",
      "dueTime": null,
      "reminderAt": "2026-10-04T09:00:00Z",
      "reminderAcknowledgedAt": null,
      "isOverdue": false,
      "dueState": "Upcoming",
      "snoozeUntil": null,
      "createdAt": "2026-09-29T10:00:00Z",
      "updatedAt": "2026-09-29T10:00:00Z",
      "completedAt": null
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 50
}
```

**Computed fields** (never stored; see data-model.md, Due State):
- `dueState`: one of `Overdue`, `DueToday`, `Upcoming`, `Completed`, `None` (FR-025).
- `isOverdue`: equals `dueState == "Overdue"`.

**Time fields**: `dueDate`/`dueTime` are local wall-clock values; `reminderAt`, `snoozeUntil`, `createdAt`, `updatedAt`, `completedAt` are UTC ISO-8601 (FR-042).

---

## POST /api/work-items

Creates a new work item.

**Request body**:
```json
{
  "title": "Review EDA API specification",
  "description": "Check against latest requirements document",
  "priorityId": 3,
  "statusId": 1,
  "projectId": 1,
  "categoryId": 4,
  "tagIds": [2, 7],
  "dueDate": "2026-10-05",
  "dueTime": null,
  "reminderAt": "2026-10-04T09:00:00Z"
}
```

**Validation**:
- `title` required, non-empty, max 200 chars
- `statusId` required; must reference an active status
- All other FK fields optional; if provided, must reference an active (non-archived) record
- `statusId` must not be the `Snoozed` or `Postponed` system status — use `/snooze` or `/postpone`
- `dueTime` only accepted when `dueDate` is also provided
- `reminderAt` must not be in the past

**Response 201**: Created work item (same shape as list item above)

**Response 400**: Validation error
```json
{
  "errors": {
    "title": ["Title is required."],
    "reminderAt": ["Reminder must be set in the future."]
  }
}
```

---

## GET /api/work-items/{id}

Returns a single work item by ID.

**Response 200**: Work item object (same shape as list item)
**Response 404**: Not found

---

## PUT /api/work-items/{id}

Full update of a work item.

**Request body**: Same shape as POST request body. All fields optional except `title` and `statusId`.

**Special behaviours**:
- If `statusId` changes to the status with `systemKey = Done`: `completedAt` is set to now (UTC).
- If `statusId` changes away from the `Done` system status: `completedAt` is cleared.
- Statuses are always identified by `systemKey`, never by name (FR-012a).
- Each significant field change produces an `ActivityRecord`.
- Lookup validation applies only to lookups that change: an item may keep an already-assigned archived project, category or tag (FR-017), but a newly assigned one must be active.
- Changing `statusId` to the `Snoozed` or `Postponed` system status returns 400; use `/snooze` or `/postpone`.
- If `reminderAt` changes, `reminderAcknowledgedAt` is cleared so the reminder fires at the new time. A new `reminderAt` must not be in the past.

**Response 200**: Updated work item
**Response 400**: Validation error
**Response 404**: Not found

---

## DELETE /api/work-items/{id}

Permanently deletes a work item and all its activity history and tag associations.

**Response 204**: No content
**Response 404**: Not found

---

## PATCH /api/work-items/{id}/complete

Marks a work item as completed (sets status to "Done" and records `completedAt`).

**Request body**: _(none)_

**Response 200**: Updated work item
**Response 404**: Not found

---

## PATCH /api/work-items/{id}/snooze

Snoozes a work item until a specified datetime.

**Request body**:
```json
{
  "snoozeUntil": "2026-10-06T09:00:00Z"
}
```

**Validation**:
- `snoozeUntil` must be in the future.

**Behaviour**: Sets `Status = Snoozed`, saves `PreSnoozeStatusId = current status`, sets `SnoozeUntil`. Records ActivityRecord (Snoozed).

**Response 200**: Updated work item
**Response 400**: Validation error
**Response 404**: Not found

---

## PATCH /api/work-items/{id}/postpone

Postpones a work item to a new due date.

**Request body**:
```json
{
  "newDueDate": "2026-10-10",
  "newDueTime": null
}
```

**Validation**:
- `newDueDate` required.

**Behaviour**: Updates `DueDate` and optionally `DueTime`. Sets `Status = Postponed`. Records ActivityRecord (Postponed, DueDateChanged).

**Response 200**: Updated work item
**Response 400**: Validation error
**Response 404**: Not found

---

## GET /api/work-items/{id}/history

Returns the activity history for a work item.

**Response 200**:
```json
[
  {
    "id": 12,
    "eventType": "Created",
    "oldValue": null,
    "newValue": null,
    "occurredAt": "2026-09-29T10:00:00Z"
  },
  {
    "id": 15,
    "eventType": "StatusChanged",
    "oldValue": "Open",
    "newValue": "In Progress",
    "occurredAt": "2026-09-30T08:30:00Z"
  }
]
```

**Response 404**: Not found

---

## GET /api/work-items/reminders/pending

Returns work items with reminders that are due and not yet acknowledged. Used by the frontend for polling.

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| lookbackMinutes | int | How many minutes back to look (default: 2, to tolerate polling lag) |

**Response 200**:
```json
[
  {
    "id": 5,
    "title": "Follow up with Ahmed",
    "reminderAt": "2026-10-04T09:00:00Z"
  }
]
```

---

## PATCH /api/work-items/{id}/reminder/acknowledge

Marks a work item's reminder as acknowledged, preventing re-delivery.

**Request body**: _(none)_

**Response 200**: Updated work item
**Response 404**: Not found
