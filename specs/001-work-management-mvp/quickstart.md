# Quickstart Validation Guide: Personal Work Management Application — MVP

**Feature**: `001-work-management-mvp` | **Date**: 2026-09-29

This guide describes how to set up and run the application and validates that the MVP works end-to-end. It covers prerequisites, startup, and scenario-by-scenario acceptance checks mapped to the spec's user stories.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| .NET SDK | 9.0+ | `dotnet --version` to verify |
| Node.js | 20 LTS+ | `node --version` to verify |
| SQL Server | 2019+ (local) | Windows: SQL Server Express or Developer Edition |
| Git | Any | For branch management |

---

## Backend Setup

1. **Restore and build**:
   ```
   cd backend
   dotnet restore
   dotnet build
   ```

2. **Configure connection string** (never commit this file):
   - Copy `src/WorkManager.Api/appsettings.Development.json.example` to `appsettings.Development.json`
   - Set `ConnectionStrings:DefaultConnection` to your local SQL Server instance:
     ```
     Server=localhost;Database=WorkManager;Trusted_Connection=True;TrustServerCertificate=True;
     ```

3. **Apply EF Core migrations**:
   ```
   dotnet ef database update --project src/WorkManager.Infrastructure --startup-project src/WorkManager.Api
   ```
   This creates the `WorkManager` database and seeds default priorities, statuses, projects, categories, and tags.

4. **Run the API**:
   ```
   dotnet run --project src/WorkManager.Api
   ```
   API is available at `http://localhost:5000`.

5. **Verify API health**:
   ```
   GET http://localhost:5000/api/priorities
   ```
   Expected: 200 OK with the 6 seeded priority records.

---

## Frontend Setup

1. **Install dependencies**:
   ```
   cd frontend
   npm install
   ```

2. **Configure API base URL** (if not defaulting to `http://localhost:5000`):
   - Copy `.env.example` to `.env.local`
   - Set `VITE_API_BASE_URL=http://localhost:5000`

3. **Start the dev server**:
   ```
   npm run dev
   ```
   Frontend is available at `http://localhost:5173`.

---

## Running Tests

**Backend unit tests**:
```
cd backend
dotnet test tests/WorkManager.Application.Tests
```

**Backend integration tests** (requires running SQL Server):
```
dotnet test tests/WorkManager.Integration.Tests
```

**Frontend tests**:
```
cd frontend
npm run test
```

---

## Acceptance Scenario Validation

Work through each scenario in order. Each maps to a user story in the spec.

### S1 — Create and manage a work item (User Story 1, P1)

1. Open `http://localhost:5173`.
2. Create a new work item:
   - Title: `Review EDA API specification`
   - Description: `Check against latest requirements document`
   - Priority: High
   - Project: EDA
   - Category: Document Review
   - Tags: Azure, Documentation
   - Due date: 5 days from today
   - Reminder: 1 day before due date
3. **Expected**: Work item appears in Inbox view immediately.
4. Edit the work item — change Priority to Critical.
5. **Expected**: Priority updates and the change appears in history (EventType: PriorityChanged).
6. Mark the work item as completed.
7. **Expected**: `CompletedAt` is set; item disappears from Inbox; appears in Completed Today view.

**Validates**: FR-001, FR-002, FR-003, FR-004, FR-037, FR-038, SC-001

---

### S2 — Configure lookup values (User Story 2, P2)

1. Open the Configuration area.
2. Create a new project: `Internal`.
3. **Expected**: `Internal` appears in the project dropdown when creating/editing a work item.
4. Archive the project `Internal`.
5. **Expected**: `Internal` no longer appears in the project dropdown for new items; existing items retain the reference.
6. Add a new priority: `Immediate+` with SortOrder = 5.
7. **Expected**: `Immediate+` appears first in the priority list and in the priority sort order.
8. Reorder priorities using the up/down controls (or the reorder API).
9. **Expected**: Work items sorted by priority reflect the new ordering.
10. Create a category `Architecture`, a status `Blocked`, and a tag `RabbitMQ`.
11. **Expected**: Each appears in its selector on the work item form.
12. Reorder projects, categories, statuses, and tags (move the last item of each to the top).
13. **Expected**: Configuration lists and work item form selectors show the new order.
14. Rename the `Done` status to `Finished`, then complete a work item.
15. **Expected**: The item is completed normally (`CompletedAt` set, appears in Completed Today) — behaviour keys off the system status, not its name.
16. Try to deactivate `Finished` (a system status).
17. **Expected**: The action is not offered in the UI; the API returns 409 Conflict.

**Validates**: FR-008, FR-009, FR-012, FR-012a, FR-015, FR-017, FR-018, FR-021, FR-040, FR-041, FR-041a, SC-009 · Workflows W01, W02

---

### S3 — Due dates and reminders (User Story 3, P3)

1. Create a work item with `DueDate = yesterday`.
2. **Expected**: Item appears in the Overdue view; the due-state badge shows "Overdue".
3. Create a work item with `DueDate = today`.
4. **Expected**: Item appears in the Today view; badge shows "Due Today". An item due next week shows "Upcoming"; a Done item shows "Completed".
5. Create a work item with a reminder set 1 minute in the future.
6. Wait 1–2 minutes (polling interval).
7. **Expected**: An in-app notification appears for the reminder.
8. Dismiss/acknowledge the notification.
9. **Expected**: The notification does not reappear on subsequent polls or page refresh.

**Validates**: FR-025, FR-026, FR-027, FR-028, SC-003, SC-005, SC-006

---

### S4 — Snooze and postpone (User Story 3, P3 — advanced)

1. Create an "In Progress" work item.
2. Snooze it until 2 minutes from now.
3. **Expected**: Item moves to Snoozed view; disappears from Inbox and In Progress views.
4. Wait 2 minutes.
5. Refresh the app (or wait for the polling cycle).
6. **Expected**: Item returns to In Progress status; appears in In Progress view; ActivityRecord shows SnoozeExpired.
7. Postpone the item to a date 1 week from today.
8. **Expected**: DueDate updates; status changes to Postponed; DueDateChanged and Postponed ActivityRecords appear in history.
9. Postpone a different item to yesterday's date (or adjust its DueDate via API to the past while it stays Postponed).
10. **Expected**: The postponed item appears in the Overdue view again.

**Validates**: FR-013, FR-014, FR-026, SC-004

---

### S5 — Search, filter, and sort (User Story 4, P4)

1. Create at least 5 work items with different priorities, statuses, and projects.
2. Search for a keyword that appears in one item's title.
3. **Expected**: Only matching items are returned; search completes in < 5 seconds.
4. Filter by a specific project.
5. **Expected**: Only items in that project are shown.
6. Sort by due date ascending.
7. **Expected**: Items reorder with earliest due dates first.
8. Clear all filters.
9. **Expected**: Full unfiltered list is restored.

**Validates**: FR-029, FR-030, FR-031, SC-002

---

### S6 — Predefined views (User Story 5, P5)

1. Ensure work items exist with varying statuses and due dates.
2. Navigate to each predefined view and verify contents:
   - **Inbox**: shows non-Done, non-Cancelled items.
   - **Today**: shows items due today only.
   - **Upcoming**: shows items due in the future.
   - **Overdue**: shows items whose due datetime has passed and are not Done/Cancelled/Snoozed (Postponed items whose new date has passed are included).
   - **In Progress**: shows only In Progress items.
   - **Snoozed**: shows only Snoozed items with future snooze-until.
   - **Completed Today**: shows the summary with total count, by-project and by-category breakdown.
3. **Expected**: Each view loads and shows only appropriate items. Navigation between views completes in < 2 seconds.

**Validates**: FR-032, FR-033, SC-004

---

### S7 — Completed work review (User Story 6, P6)

1. Complete several work items across different days (adjust `CompletedAt` via API for past dates if needed in testing).
2. Open the Completed Work view.
3. Select today — **Expected**: Only today's completed items shown.
4. Select a specific past date — **Expected**: Only items completed on that date shown.
5. Select a date range spanning multiple days — **Expected**: All items completed in that range shown.
6. Open Completed Today summary — **Expected**: Count, by-project, and by-category groupings are accurate.

**Validates**: FR-034, FR-035, FR-036, SC-010

---

### S8 — Re-open Done and Cancelled items (Clarification Q4)

1. Mark a work item as Done.
2. **Expected**: `CompletedAt` is set.
3. Change the item's status back to "In Progress".
4. **Expected**: `CompletedAt` is cleared; item reappears in In Progress view; ActivityRecord shows StatusChanged.
5. Cancel a work item.
6. Change its status to "Open".
7. **Expected**: Item reappears in Inbox view; ActivityRecord shows StatusChanged.

**Validates**: FR-011a

---

### S9 — Activity history (User Story 7, P7)

1. Open any work item that has been created, edited, snoozed, and completed.
2. View its activity history.
3. **Expected**: All key events appear (Created, StatusChanged, PriorityChanged, Snoozed, Completed) with accurate timestamps in chronological order.

**Validates**: FR-037, FR-038, FR-039

---

## Success Criteria Verification

After completing all scenarios above, confirm:

| Criterion | Check |
|-----------|-------|
| SC-001 | Work item created in < 60 seconds |
| SC-002 | Search across 500 items returns in < 5 seconds |
| SC-003 | Overdue items visible within 5 seconds of opening app |
| SC-004 | View navigation completes in < 2 seconds |
| SC-005 | Reminder fires within 1 minute of configured time |
| SC-006 | Reminder does not repeat after acknowledgement |
| SC-007 | All 18 MVP workflows complete without errors |
| SC-008 | 90% of primary actions complete without errors |
| SC-009 | Configuration changes reflected immediately |
| SC-010 | Completed summary counts match actual completed items |

## MVP Acceptance Workflow Checklist (W01–W18)

Record pass/fail for each workflow from spec.md (MVP Acceptance Workflows). All 18 must pass for SC-007.

| ID | Workflow | Scenario | Pass? |
|----|----------|----------|-------|
| W01 | Create a project | S2 step 2 | |
| W02 | Create categories, priorities, statuses, and tags | S2 steps 6, 10 | |
| W03 | Create a work item | S1 step 2 | |
| W04 | Assign it to a project | S1 step 2 | |
| W05 | Assign a category | S1 step 2 | |
| W06 | Assign a priority | S1 steps 2, 4 | |
| W07 | Assign multiple tags | S1 step 2 | |
| W08 | Set a due date | S3 steps 1, 3 | |
| W09 | Set a reminder | S3 step 5 | |
| W10 | Change its status | S8 | |
| W11 | Snooze or postpone it | S4 | |
| W12 | Search for it | S5 step 2 | |
| W13 | Filter and sort work items | S5 steps 4, 6 | |
| W14 | See overdue work | S3 step 2, S6 | |
| W15 | See today's work | S3 step 4, S6 | |
| W16 | See completed work | S7 steps 3–5 | |
| W17 | Review what was accomplished today | S7 step 6 | |
| W18 | View basic work-item history | S9 | |

## Timezone Check (FR-042)

With `App:TimeZoneId` unset, confirm "today" matches the machine's local date. Optionally set `App:TimeZoneId` to a different zone, restart the API, and confirm the Today/Overdue boundaries shift accordingly.
