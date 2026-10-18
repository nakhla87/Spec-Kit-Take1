# API Contract: Configuration

**Base URL**: `http://localhost:5080/api`
**Content-Type**: `application/json`

All configuration endpoints follow the same pattern. Active (non-archived/non-deactivated) records are returned by default. Pass `?includeInactive=true` to include archived or deactivated records.

All five lookup types have a user-defined display order (FR-041a): every GET returns records ordered by `sortOrder` ascending, every response object includes `sortOrder`, and every type has a `PUT /reorder` endpoint with the same body shape and validation as `PUT /api/priorities/reorder`. On create, `sortOrder` is optional for statuses, projects, categories, and tags (defaults to max + 10).

---

## Priorities

### GET /api/priorities

Returns priorities ordered by `SortOrder` ascending (most urgent first).

**Response 200**:
```json
[
  { "id": 1, "name": "Immediate", "sortOrder": 10, "isActive": true },
  { "id": 2, "name": "Critical",  "sortOrder": 20, "isActive": true },
  { "id": 3, "name": "High",      "sortOrder": 30, "isActive": true },
  { "id": 4, "name": "Medium",    "sortOrder": 40, "isActive": true },
  { "id": 5, "name": "Low",       "sortOrder": 50, "isActive": true },
  { "id": 6, "name": "Very Low",  "sortOrder": 60, "isActive": true }
]
```

### POST /api/priorities

Creates a new priority level.

**Request body**:
```json
{ "name": "Urgent", "sortOrder": 15 }
```

**Validation**: `name` required, unique. `sortOrder` required, non-negative integer.

**Response 201**: Created priority object
**Response 400**: Validation error (e.g., duplicate name)

### PUT /api/priorities/{id}

Updates a priority's name or sort order.

**Request body**:
```json
{ "name": "Urgent", "sortOrder": 15 }
```

**Response 200**: Updated priority
**Response 404**: Not found

### PATCH /api/priorities/{id}/deactivate

Deactivates (archives) a priority. Existing work items retain the reference.

**Response 200**: Updated priority with `isActive: false`
**Response 404**: Not found

### PATCH /api/priorities/{id}/activate

Reactivates a previously deactivated priority.

**Response 200**: Updated priority with `isActive: true`
**Response 404**: Not found

### PUT /api/priorities/reorder

Updates `sortOrder` for multiple priorities in a single call.

**Request body**:
```json
[
  { "id": 1, "sortOrder": 10 },
  { "id": 3, "sortOrder": 20 },
  { "id": 2, "sortOrder": 30 }
]
```

**Response 200**: Full updated priority list

---

## Statuses

### GET /api/statuses

Returns statuses ordered by `sortOrder` ascending. `systemKey` is non-null for the six system statuses (FR-012a) and null for user-created statuses.

**Response 200**:
```json
[
  { "id": 1, "name": "Open",        "systemKey": "Open",       "sortOrder": 10, "isActive": true },
  { "id": 2, "name": "In Progress", "systemKey": "InProgress", "sortOrder": 20, "isActive": true },
  { "id": 3, "name": "Done",        "systemKey": "Done",       "sortOrder": 30, "isActive": true },
  { "id": 4, "name": "Postponed",   "systemKey": "Postponed",  "sortOrder": 40, "isActive": true },
  { "id": 5, "name": "Snoozed",     "systemKey": "Snoozed",    "sortOrder": 50, "isActive": true },
  { "id": 6, "name": "Cancelled",   "systemKey": "Cancelled",  "sortOrder": 60, "isActive": true }
]
```

### POST /api/statuses

**Request body**: `{ "name": "Blocked", "sortOrder": 25 }` (`sortOrder` optional). `systemKey` cannot be supplied; created statuses always have `systemKey: null`.

**Response 201**: Created status

### PUT /api/statuses/{id}

**Request body**: `{ "name": "On Hold", "sortOrder": 25 }`. Renaming a system status is allowed; its `systemKey` is unchanged.

**Response 200**: Updated status

### PATCH /api/statuses/{id}/deactivate

**Response 200**: Updated status with `isActive: false`
**Response 409**: Conflict (ProblemDetails) — the status is a system status and cannot be deactivated

### PATCH /api/statuses/{id}/activate

**Response 200**: Updated status with `isActive: true`

### PUT /api/statuses/reorder

Same body and behaviour as `PUT /api/priorities/reorder`.

**Response 200**: Full updated status list

---

## Projects

### GET /api/projects

**Response 200**:
```json
[
  { "id": 1, "name": "EDA",      "sortOrder": 10, "isArchived": false },
  { "id": 2, "name": "Learning", "sortOrder": 20, "isArchived": false }
]
```

### POST /api/projects

**Request body**: `{ "name": "ServeBig" }`

**Response 201**: Created project

### PUT /api/projects/{id}

**Request body**: `{ "name": "ServeBig Renewed" }`

**Response 200**: Updated project

### PATCH /api/projects/{id}/archive

**Response 200**: Updated project with `isArchived: true`

### PATCH /api/projects/{id}/unarchive

**Response 200**: Updated project with `isArchived: false`

### PUT /api/projects/reorder

Same body and behaviour as `PUT /api/priorities/reorder`.

**Response 200**: Full updated project list

---

## Categories

### GET /api/categories

**Response 200**:
```json
[
  { "id": 1, "name": "Development",     "sortOrder": 10, "isArchived": false },
  { "id": 2, "name": "Document Review", "sortOrder": 20, "isArchived": false },
  { "id": 3, "name": "Meeting",         "sortOrder": 30, "isArchived": false }
]
```

### POST /api/categories

**Request body**: `{ "name": "Architecture" }`

**Response 201**: Created category

### PUT /api/categories/{id}

**Request body**: `{ "name": "System Design" }`

**Response 200**: Updated category

### PATCH /api/categories/{id}/archive

**Response 200**: Updated category with `isArchived: true`

### PATCH /api/categories/{id}/unarchive

**Response 200**: Updated category with `isArchived: false`

### PUT /api/categories/reorder

Same body and behaviour as `PUT /api/priorities/reorder`.

**Response 200**: Full updated category list

---

## Tags

### GET /api/tags

**Response 200**:
```json
[
  { "id": 1, "name": "Azure",         "sortOrder": 10, "isArchived": false },
  { "id": 2, "name": "Architecture",  "sortOrder": 20, "isArchived": false },
  { "id": 3, "name": "Documentation", "sortOrder": 30, "isArchived": false }
]
```

### POST /api/tags

**Request body**: `{ "name": "RabbitMQ" }`

**Response 201**: Created tag

### PUT /api/tags/{id}

**Request body**: `{ "name": "AMQP" }`

**Response 200**: Updated tag

### PATCH /api/tags/{id}/archive

**Response 200**: Updated tag with `isArchived: true`

### PATCH /api/tags/{id}/unarchive

**Response 200**: Updated tag with `isArchived: false`

### PUT /api/tags/reorder

Same body and behaviour as `PUT /api/priorities/reorder`.

**Response 200**: Full updated tag list
