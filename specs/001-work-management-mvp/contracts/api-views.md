# API Contract: Views & Completed Work

**Base URL**: `http://localhost:5000/api`
**Content-Type**: `application/json`

---

## Predefined Views

All view endpoints return an array of work item summary objects (same shape as `GET /api/work-items` items). They apply snooze expiry resolution before returning results.

"Today" and "now" in this contract mean the user's local date/time in the configured timezone (FR-042: `App:TimeZoneId`, default = machine local), never UTC. Status names below refer to the status's `SystemKey`.

### GET /api/views/inbox

Returns all non-completed, non-cancelled work items (Status ≠ Done, ≠ Cancelled).

**Response 200**: Array of work items

---

### GET /api/views/today

Returns work items where `DueDate = today` (regardless of status, excluding Done and Cancelled).

**Response 200**: Array of work items

---

### GET /api/views/upcoming

Returns work items where `DueDate > today` and status is not Done, Cancelled, or Snoozed.

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| days | int | Look-ahead window in days (default: 30) |

**Response 200**: Array of work items

---

### GET /api/views/overdue

Returns work items where effective due datetime is in the past and status is not Done, Cancelled, or Snoozed. Postponed items are included once their (new) due date has passed.

**Overdue logic**: `DueDate` is set AND (`DueDate` < today OR (`DueDate` = today AND `DueTime` is set AND effective local datetime < now)). Implemented once in `DueStateCalculator` (see data-model.md, Due State).

**Response 200**: Array of work items

---

### GET /api/views/in-progress

Returns work items with Status = "In Progress".

**Response 200**: Array of work items

---

### GET /api/views/snoozed

Returns work items with Status = "Snoozed" where `SnoozeUntil > now`. Items where `SnoozeUntil <= now` are resolved (snooze expired) before filtering.

**Response 200**: Array of work items

---

### GET /api/views/completed-today

Returns a summary of work items completed today (where `CompletedAt`, converted to local time, falls on local today).

**Response 200**:
```json
{
  "totalCompleted": 5,
  "byProject": [
    { "projectName": "EDA",     "count": 2 },
    { "projectName": "Learning","count": 1 },
    { "projectName": null,      "count": 2 }
  ],
  "byCategory": [
    { "categoryName": "Development",     "count": 2 },
    { "categoryName": "Document Review", "count": 1 },
    { "categoryName": null,              "count": 2 }
  ],
  "items": [
    {
      "id": 7,
      "title": "Review EDA API specification",
      "completedAt": "2026-09-29T14:23:00Z",
      "project": { "id": 1, "name": "EDA" },
      "category": { "id": 4, "name": "Document Review" }
    }
  ]
}
```

---

## Completed Work

### GET /api/completed

Returns completed work items filtered by date or date range.

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| date | date (YYYY-MM-DD) | Returns items completed on this specific date |
| from | date (YYYY-MM-DD) | Start of date range (inclusive) |
| to | date (YYYY-MM-DD) | End of date range (inclusive) |

**Notes**:
- Provide either `date` alone, or both `from` and `to`. Providing all three is a validation error.
- If neither is provided, defaults to today.
- Dates are local calendar dates: an item matches date D when `CompletedAt` converted to local time falls on D.

**Response 200**: Array of work item summary objects where `completedAt` falls within the requested period.

**Response 400**: Validation error (conflicting parameters)
