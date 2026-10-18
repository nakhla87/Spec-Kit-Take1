# Tasks: Personal Work Management Application — MVP

**Input**: Design documents from `specs/001-work-management-mvp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by Constitution Principle VII ("MVP MUST be ... tested"). Not strict TDD: each user story phase ends with automated tests for its business rules and endpoints (T097–T105). Test projects per plan.md.

**Task numbering**: T095–T109 were added after `/speckit-analyze` (2026-10-05) and are placed in the phase where they run; existing IDs are unchanged. T092 (follow-up index migration) was removed on 2026-10-17 and its indexes were folded into T019 (findings U3, D2).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Exact file paths are included in every task description

## Path Conventions

- **Backend**: `backend/src/WorkManager.Api/`, `backend/src/WorkManager.Application/`, `backend/src/WorkManager.Domain/`, `backend/src/WorkManager.Infrastructure/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold both projects, configure tooling, and wire up cross-cutting configuration before any feature work begins.

- [X] T001 Create `backend/WorkManager.sln` and four .NET 10 class library / web API projects: `WorkManager.Api`, `WorkManager.Application`, `WorkManager.Domain`, `WorkManager.Infrastructure` with correct project references (Api → Application; Api → Infrastructure; Application → Domain; Infrastructure → Application)
- [X] T002 Create Vite + React + TypeScript frontend project in `frontend/` using `npm create vite@latest` with the `react-ts` template
- [X] T003 [P] Add NuGet packages to each backend project: `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Tools` (Infrastructure); `Microsoft.AspNetCore.OpenApi` (Api); no third-party packages beyond EF Core and the test stack in T095
- [X] T004 [P] Install frontend npm packages: `react-router-dom`, `@tanstack/react-query`, `@tanstack/react-query-devtools` in `frontend/package.json`
- [X] T005 [P] Create `backend/src/WorkManager.Api/appsettings.json` (placeholder connection string; optional `App:TimeZoneId`, empty = machine local timezone, per FR-042) and `appsettings.Development.json.example` (documented real connection string format); add `appsettings.Development.json` to `.gitignore`
- [X] T006 [P] Configure CORS policy in `backend/src/WorkManager.Api/Program.cs` allowing `http://localhost:5173`; add JSON serialisation options (camelCase, ignore cycles)
- [X] T007 [P] Create `frontend/.env.example` with `VITE_API_BASE_URL=http://localhost:5080` and document usage; add `.env.local` to `frontend/.gitignore`
- [X] T008 [P] Configure global exception-handling middleware returning RFC 7807 ProblemDetails in `backend/src/WorkManager.Api/Program.cs`
- [X] T009 [P] Create `frontend/src/api/apiClient.ts` — a typed base fetch wrapper reading `VITE_API_BASE_URL` from env, handling JSON serialisation and throwing typed errors on non-2xx responses
- [X] T095 [P] Create test projects under `backend/tests/`: `WorkManager.Application.Tests`, `WorkManager.Api.Tests`, `WorkManager.Integration.Tests` (xUnit); add `FluentAssertions` and `Microsoft.AspNetCore.Mvc.Testing`; add them to `backend/WorkManager.sln`. Integration tests use a dedicated `WorkManager_Test` database on the local SQL Server, created via migrations in a shared fixture and reset between test classes. Unit tests use hand-written in-memory fake repositories and a fake `ILocalClock` (no mocking library)
- [X] T096 [P] Add Vitest + React Testing Library + jsdom to `frontend/`; configure the `test` block in `frontend/vite.config.ts` and an `npm run test` script in `frontend/package.json`

**Checkpoint**: Both projects compile/start (empty). CORS preflight succeeds from `localhost:5173` to `localhost:5080`. `dotnet test` and `npm run test` run (zero tests) successfully.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: All domain entities, EF Core context, migrations, repository contracts, and DI wiring. MUST be complete before any user story can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T010 Create `backend/src/WorkManager.Domain/Entities/WorkItem.cs` — all fields per data-model.md: Id, Title, Description, PriorityId, StatusId, ProjectId, CategoryId, DueDate, DueTime, ReminderAt, ReminderAcknowledgedAt, PreSnoozeStatusId, SnoozeUntil, CreatedAt, UpdatedAt, CompletedAt; navigation properties for Priority, Status, Project, Category, Tags (ICollection\<Tag\>), ActivityRecords
- [ ] T011 [P] Create `backend/src/WorkManager.Domain/Entities/Priority.cs` — Id, Name, SortOrder, IsActive, WorkItems navigation
- [ ] T012 [P] Create `backend/src/WorkManager.Domain/Entities/Status.cs` — Id, Name, SystemKey (string?, immutable; set only by seed data), SortOrder, IsActive, WorkItems navigation
- [ ] T013 [P] Create `backend/src/WorkManager.Domain/Entities/Project.cs` — Id, Name, SortOrder, IsArchived, WorkItems navigation
- [ ] T014 [P] Create `backend/src/WorkManager.Domain/Entities/Category.cs` — Id, Name, SortOrder, IsArchived, WorkItems navigation
- [ ] T015 [P] Create `backend/src/WorkManager.Domain/Entities/Tag.cs` — Id, Name, SortOrder, IsArchived, WorkItems many-to-many navigation
- [ ] T016 [P] Create `backend/src/WorkManager.Domain/Entities/WorkItemTag.cs` — composite PK (WorkItemId, TagId), FK navigations to WorkItem and Tag
- [ ] T017 [P] Create `backend/src/WorkManager.Domain/Entities/ActivityRecord.cs` — Id, WorkItemId, EventType (string), OldValue (string?), NewValue (string?), OccurredAt
- [ ] T018 [P] Create `backend/src/WorkManager.Domain/Enums/WorkItemEventType.cs` — values: Created, StatusChanged, PriorityChanged, DueDateChanged, ProjectChanged, Completed, Postponed, Snoozed, SnoozeExpired
- [ ] T109 [P] Create `backend/src/WorkManager.Domain/Enums/SystemStatus.cs` — values: Open, InProgress, Done, Postponed, Snoozed, Cancelled (string values match `Status.SystemKey`)
- [ ] T019 Create `backend/src/WorkManager.Infrastructure/Persistence/WorkManagerDbContext.cs` — register all DbSets; configure WorkItemTag composite PK; configure all FK relationships and cascade behaviours; configure field lengths from data-model.md; configure a filtered unique index on `Status.SystemKey` (where not null); configure all recommended indexes from data-model.md (IX_WorkItem_StatusId, IX_WorkItem_DueDate, IX_WorkItem_ProjectId, IX_WorkItem_CategoryId, IX_WorkItem_PriorityId, IX_Priority_SortOrder, IX_WorkItem_CompletedAt, IX_WorkItem_ReminderAt as a composite on ReminderAt + ReminderAcknowledgedAt, IX_ActivityRecord_WorkItemId)
- [ ] T020 Run `dotnet ef migrations add InitialSchema` and `dotnet ef database update` from `backend/`; verify seed data inserts for 6 default priorities and 6 default statuses (with SystemKey and SortOrder per data-model.md) in the migration's `Up()` method
- [ ] T021 [P] Create repository interfaces in `backend/src/WorkManager.Application/Interfaces/`: `IWorkItemRepository.cs`, `IPriorityRepository.cs`, `IStatusRepository.cs`, `IProjectRepository.cs`, `ICategoryRepository.cs`, `ITagRepository.cs`, `IActivityRepository.cs` — each with typed CRUD + query methods matching the contracts; `IStatusRepository` includes `GetBySystemKeyAsync(SystemStatus key)`
- [ ] T022 Create repository implementations in `backend/src/WorkManager.Infrastructure/Repositories/`: `WorkItemRepository.cs`, `PriorityRepository.cs`, `StatusRepository.cs`, `ProjectRepository.cs`, `CategoryRepository.cs`, `TagRepository.cs`, `ActivityRepository.cs` — each implementing its interface using `WorkManagerDbContext`; no lazy loading (use explicit `.Include()`)
- [ ] T108 Create `backend/src/WorkManager.Application/Interfaces/ILocalClock.cs` and `backend/src/WorkManager.Infrastructure/Time/LocalClock.cs` (built on .NET `TimeProvider`): `UtcNow`, `LocalNow`, `LocalToday`, `ToLocal(DateTime utc)`, `ToUtc(DateOnly date, TimeOnly? time)`; timezone from `App:TimeZoneId` (empty = machine local, FR-042). Services MUST NOT call `DateTime.UtcNow` / `DateTime.Today` directly
- [ ] T023 Register `WorkManagerDbContext`, all repositories, `ILocalClock` (T108), and all application services in DI in `backend/src/WorkManager.Api/Program.cs`; configure SQL Server connection string from `appsettings`; complete the T095 integration fixture (`backend/tests/WorkManager.Integration.Tests/Fixtures/WorkManagerApiFactory.cs`): apply migrations to `WorkManager_Test` once per run and reset data between test classes

**Checkpoint**: `dotnet build` succeeds; `dotnet run` starts the API; `GET http://localhost:5080/api/priorities` returns the 6 seeded priorities.

---

## Phase 3: User Story 1 — Create and Manage Work Items (Priority: P1) 🎯 MVP

**Goal**: A user can create, view, edit, delete, and complete work items through the UI.

**Independent Test**: Create a work item with title, description, priority and status (the lookups seeded in Phase 2), edit it, mark it done, delete it — all via the browser — without needing any other feature working. Project/category/tags arrive with US2 and due date/reminder with US3 (I5). See quickstart.md S1.

- [ ] T024 [P] [US1] Create request/response DTOs in `backend/src/WorkManager.Application/DTOs/WorkItemDtos.cs`: `CreateWorkItemRequest`, `UpdateWorkItemRequest`, `WorkItemResponse` (with nested priority, status incl. `SystemKey`, project, category, tag summaries, and computed `DueState` / `IsOverdue`), `PagedWorkItemResponse`
- [ ] T025 [P] [US1] Create `backend/src/WorkManager.Application/DTOs/ActivityRecordDto.cs` — mirrors ActivityRecord fields for API response
- [ ] T107 [US1] Implement `backend/src/WorkManager.Application/Services/DueStateCalculator.cs` — single source of truth for `DueState` (Overdue, DueToday, Upcoming, Completed, None) and the overdue rule per data-model.md (Due State, Overdue Logic; FR-025/FR-026), evaluated with `ILocalClock` (T108) and status `SystemKey`; used by WorkItemService response mapping (T026) and view queries (T070)
- [ ] T026 [US1] Implement `backend/src/WorkManager.Application/Services/WorkItemService.cs` with: `CreateAsync`, `GetByIdAsync`, `GetAllAsync` (returns paged list, no filtering yet — extended in US4), `UpdateAsync`, `DeleteAsync`, `CompleteAsync`; resolve special statuses via `IStatusRepository.GetBySystemKeyAsync` (never by name); `CompleteAsync` sets CompletedAt = `ILocalClock.UtcNow` and status to the Done system status; `UpdateAsync` clears CompletedAt when status changes away from Done; map `DueState` via `DueStateCalculator` (T107); all mutating methods record an ActivityRecord (Created on create; StatusChanged, PriorityChanged, DueDateChanged, ProjectChanged on relevant updates; Completed when marking done); on create and update, validate that each referenced lookup is active/non-archived (on update, only lookups that change are checked so an item keeps an already-assigned archived value — FR-017), otherwise 400 (G1); reject a `ReminderAt` in the past with 400 (G2); clear `ReminderAcknowledgedAt` whenever `ReminderAt` changes so a rescheduled reminder fires again (G3); reject a status change to the Snoozed or Postponed system status with 400 pointing to `/snooze` or `/postpone` (G4)
- [ ] T027 [US1] Implement `backend/src/WorkManager.Api/Controllers/WorkItemsController.cs` with: `GET /api/work-items`, `POST /api/work-items`, `GET /api/work-items/{id}`, `PUT /api/work-items/{id}`, `DELETE /api/work-items/{id}`, `PATCH /api/work-items/{id}/complete`; validate `CreateWorkItemRequest` and `UpdateWorkItemRequest` using DataAnnotations or FluentValidation (field rules, including `reminderAt` not in the past); surface WorkItemService validation failures (inactive/archived lookups, Snoozed/Postponed status via PUT) as 400 ProblemDetails; return 404 when item not found
- [ ] T028 [P] [US1] Create TypeScript type definitions in `frontend/src/types/workItem.ts` mirroring `WorkItemResponse`, `CreateWorkItemRequest`, `UpdateWorkItemRequest`, `PagedWorkItemResponse`, tag/priority/status/project/category summary types
- [ ] T029 [P] [US1] Implement API client functions in `frontend/src/api/workItemsApi.ts`: `getWorkItems`, `getWorkItemById`, `createWorkItem`, `updateWorkItem`, `deleteWorkItem`, `completeWorkItem` — all typed, all using the `apiClient` from T009
- [ ] T030 [US1] Create React Query hooks in `frontend/src/hooks/useWorkItems.ts`: `useWorkItems` (query), `useWorkItem` (single item query), `useCreateWorkItem` (mutation), `useUpdateWorkItem` (mutation), `useDeleteWorkItem` (mutation), `useCompleteWorkItem` (mutation); all mutations invalidate the work items query cache
- [ ] T031 [P] [US1] Create `frontend/src/components/DueStateBadge.tsx` (renders `dueState` as Overdue / Due Today / Upcoming / Completed, each with a distinct colour AND text label — not colour alone; renders nothing for `None`) and `frontend/src/components/WorkItemList.tsx` — renders a list of `WorkItemResponse` rows with title, priority badge, status badge, project, due date, `DueStateBadge`; clickable rows; complete and delete actions per row
- [ ] T032 [P] [US1] Create `frontend/src/components/WorkItemForm.tsx` — controlled form for create/edit with fields: title (required), description, priority selector, status selector (excludes the Snoozed and Postponed system statuses — those are set only via the snooze/postpone dialogs, G4); form validation; submit calls create or update mutation. Project, category and tag selectors are added in US2 (T051) and due date/time/reminder in US3 (T056) — I5
- [ ] T033 [P] [US1] Create `frontend/src/components/WorkItemDetail.tsx` — read-only detail panel showing all work item fields; edit button (opens WorkItemForm), complete button, delete button with confirmation
- [ ] T034 [US1] Create `frontend/src/pages/InboxPage.tsx` integrating `WorkItemList`, `WorkItemForm` (slide-over or modal for create), and `WorkItemDetail`; manages selected item state; shows create button
- [ ] T035 [US1] Configure React Router in `frontend/src/App.tsx` with `QueryClientProvider`, router setup, and initial route `/` → `InboxPage`; add `ReactQueryDevtools` in development mode
- [ ] T097 [US1] Create `backend/tests/WorkManager.Application.Tests/WorkItemServiceTests.cs`: title required; complete sets CompletedAt + Done system status; changing status away from Done clears CompletedAt; Created and Completed ActivityRecords written; renaming the Done status does not change completion behaviour (SystemKey)
- [ ] T098 [US1] Create `backend/tests/WorkManager.Integration.Tests/WorkItemsEndpointTests.cs`: CRUD + complete; 404 on missing id; 400 ProblemDetails on missing title; 400 on a past `reminderAt` (G2); 400 when PUT sets the Snoozed or Postponed system status (G4); response includes `dueState`

**Checkpoint**: User can create, view, edit, mark complete, and delete a work item entirely via browser. No other features needed to verify. T097–T098 pass. Validates quickstart.md S1.

---

## Phase 4: User Story 2 — Configure Organizational Lookup Values (Priority: P2)

**Goal**: A user can manage priorities, statuses, projects, categories, and tags via the configuration area.

**Independent Test**: Navigate to configuration, create/edit/archive each entity type, verify changes appear in work item form dropdowns. See quickstart.md S2.

- [ ] T036 [P] [US2] Create `backend/src/WorkManager.Application/DTOs/ConfigurationDtos.cs` — request/response DTOs for Priority, Status (with read-only SystemKey), Project, Category, Tag — all with SortOrder; a shared `ReorderRequest` DTO (array of id + sortOrder) used by all five types
- [ ] T037 [P] [US2] Implement `backend/src/WorkManager.Application/Services/PriorityService.cs` — `GetAllAsync` (ordered by SortOrder), `CreateAsync`, `UpdateAsync`, `DeactivateAsync`, `ActivateAsync`, `ReorderAsync` (bulk SortOrder update)
- [ ] T038 [P] [US2] Implement `backend/src/WorkManager.Application/Services/StatusService.cs` — `GetAllAsync` (ordered by SortOrder), `CreateAsync` (SystemKey always null), `UpdateAsync` (SystemKey immutable), `DeactivateAsync` (rejects system statuses → 409 Conflict), `ActivateAsync`, `ReorderAsync`
- [ ] T039 [P] [US2] Implement `backend/src/WorkManager.Application/Services/ProjectService.cs` — `GetAllAsync` (ordered by SortOrder), `CreateAsync` (default SortOrder = max + 10), `UpdateAsync`, `ArchiveAsync`, `UnarchiveAsync`, `ReorderAsync`
- [ ] T040 [P] [US2] Implement `backend/src/WorkManager.Application/Services/CategoryService.cs` — `GetAllAsync` (ordered by SortOrder), `CreateAsync` (default SortOrder = max + 10), `UpdateAsync`, `ArchiveAsync`, `UnarchiveAsync`, `ReorderAsync`
- [ ] T041 [P] [US2] Implement `backend/src/WorkManager.Application/Services/TagService.cs` — `GetAllAsync` (ordered by SortOrder), `CreateAsync` (default SortOrder = max + 10), `UpdateAsync`, `ArchiveAsync`, `UnarchiveAsync`, `ReorderAsync`
- [ ] T042 [P] [US2] Implement `backend/src/WorkManager.Api/Controllers/PrioritiesController.cs` per `contracts/api-configuration.md`: GET, POST, PUT /{id}, PATCH /{id}/deactivate, PATCH /{id}/activate, PUT /reorder
- [ ] T043 [P] [US2] Implement `backend/src/WorkManager.Api/Controllers/StatusesController.cs` per `contracts/api-configuration.md`: GET, POST, PUT /{id}, PATCH /{id}/deactivate (409 for system statuses), PATCH /{id}/activate, PUT /reorder
- [ ] T044 [P] [US2] Implement `backend/src/WorkManager.Api/Controllers/ProjectsController.cs` per `contracts/api-configuration.md`: GET, POST, PUT /{id}, PATCH /{id}/archive, PATCH /{id}/unarchive, PUT /reorder
- [ ] T045 [P] [US2] Implement `backend/src/WorkManager.Api/Controllers/CategoriesController.cs` per `contracts/api-configuration.md`: GET, POST, PUT /{id}, PATCH /{id}/archive, PATCH /{id}/unarchive, PUT /reorder
- [ ] T046 [P] [US2] Implement `backend/src/WorkManager.Api/Controllers/TagsController.cs` per `contracts/api-configuration.md`: GET, POST, PUT /{id}, PATCH /{id}/archive, PATCH /{id}/unarchive, PUT /reorder
- [ ] T047 [P] [US2] Create `frontend/src/api/configurationApi.ts` — typed API client functions for all 5 entity types (get, create, update, deactivate/archive, activate/unarchive, reorder)
- [ ] T048 [P] [US2] Create `frontend/src/hooks/useConfiguration.ts` — React Query hooks for all 5 entity types; mutations (including reorder for each type) invalidate their respective query caches
- [ ] T106 [P] [US2] Create `frontend/src/components/ReorderableList.tsx` — generic list with up/down buttons emitting a `ReorderRequest`; used by all five configuration pages (T050, T051)
- [ ] T049 [P] [US2] Create `frontend/src/pages/configuration/ConfigurationLayout.tsx` — layout with sub-navigation tabs: Priorities, Statuses, Projects, Categories, Tags; add `/config/*` routes to `frontend/src/App.tsx` and a Configuration link in the sidebar
- [ ] T050 [US2] Create `frontend/src/pages/configuration/PrioritiesPage.tsx` — inline list with name and sort order; add, edit, deactivate/activate per row; reorder via `ReorderableList` (T106); deactivated priorities shown with muted style
- [ ] T051 [US2] Create `frontend/src/pages/configuration/StatusesPage.tsx`, `ProjectsPage.tsx`, `CategoriesPage.tsx`, `TagsPage.tsx` — each with inline add, edit, archive/unarchive (deactivate/activate for statuses) and reorder via `ReorderableList` (T106); on StatusesPage, system statuses show a "System" marker and no Deactivate action; archived items shown with muted style; add project selector, category selector and tag multi-selector to `WorkItemForm.tsx` (I5); all WorkItemForm selectors exclude archived/deactivated values (filter by `isActive`/`isArchived`) and present values in `sortOrder`
- [ ] T099 [US2] Create `backend/tests/WorkManager.Integration.Tests/ConfigurationEndpointTests.cs`: create/edit/archive/reorder for all five lookup types; GET returns sortOrder ascending; archived/deactivated values rejected (400) when assigned to a work item; deactivating a system status returns 409; renaming a system status keeps its systemKey

**Checkpoint**: All 5 entity types can be created, edited, reordered, and archived via the UI. Work item form dropdowns reflect the current active values in display order. T099 passes. Validates quickstart.md S2.

---

## Phase 5: User Story 3 — Schedule Work with Due Dates and Reminders (Priority: P3)

**Goal**: A user can set due dates and reminders, snooze or postpone items, and receive in-app reminder notifications.

**Independent Test**: Set a 1-minute reminder, wait, see toast notification, dismiss. Set a snooze expiring in 2 minutes, verify item restores to prior status. See quickstart.md S3 and S4.

- [ ] T052 [P] [US3] Add `SnoozeAsync` and `PostponeAsync` to `backend/src/WorkManager.Application/Services/WorkItemService.cs`: `SnoozeAsync` saves PreSnoozeStatusId, sets status to the Snoozed system status (by SystemKey), sets SnoozeUntil, records ActivityRecord (Snoozed); `PostponeAsync` updates DueDate/DueTime, sets status to the Postponed system status, records ActivityRecord (Postponed + DueDateChanged)
- [ ] T053 [P] [US3] Add snooze expiry lazy resolution to `WorkItemService.GetByIdAsync` and `GetAllAsync`: for any item whose status SystemKey = Snoozed and SnoozeUntil ≤ `ILocalClock.UtcNow`, restore StatusId from PreSnoozeStatusId, clear SnoozeUntil and PreSnoozeStatusId, record ActivityRecord (SnoozeExpired), save before returning
- [ ] T054 [P] [US3] Implement `backend/src/WorkManager.Application/Services/ReminderService.cs` — `GetPendingAsync(int lookbackMinutes)`: returns WorkItems where ReminderAt ≤ `ILocalClock.UtcNow`, ReminderAt ≥ UtcNow minus lookbackMinutes, and ReminderAcknowledgedAt is null; `AcknowledgeAsync(int workItemId)`: sets ReminderAcknowledgedAt = UtcNow
- [ ] T055 [US3] Add to `backend/src/WorkManager.Api/Controllers/WorkItemsController.cs`: `PATCH /api/work-items/{id}/snooze`, `PATCH /api/work-items/{id}/postpone`, `GET /api/work-items/reminders/pending?lookbackMinutes=2`, `PATCH /api/work-items/{id}/reminder/acknowledge` per `contracts/api-work-items.md`
- [ ] T056 [P] [US3] Extend `frontend/src/components/WorkItemForm.tsx` with due date (date picker), due time (time picker, optional), and reminder datetime (datetime picker, optional) fields; validate that DueTime requires DueDate and ReminderAt is not in the past; send ReminderAt as a UTC ISO string and DueDate/DueTime as local wall-clock values; display all timestamps in local time (FR-042)
- [ ] T057 [P] [US3] Add snooze and postpone action buttons to `frontend/src/components/WorkItemDetail.tsx`; wire to `SnoozeDialog` and `PostponeDialog`
- [ ] T058 [P] [US3] Create `frontend/src/components/SnoozeDialog.tsx` — modal with datetime picker for snooze-until; validates future date; calls snooze mutation from `useWorkItems`
- [ ] T059 [P] [US3] Create `frontend/src/components/PostponeDialog.tsx` — modal with date picker for new due date; calls postpone mutation from `useWorkItems`
- [ ] T060 [US3] Create `frontend/src/hooks/useReminderPolling.ts` — React Query query polling `GET /api/work-items/reminders/pending` every 60 seconds via `refetchInterval`; returns array of pending reminder work items
- [ ] T061 [US3] Create `frontend/src/components/ReminderNotification.tsx` — renders a toast/banner for each pending reminder (title, scheduled time); shows each (workItemId, reminderAt) pair at most once per session even if polling returns it again (FR-028, G3); dismiss button calls acknowledge mutation and removes the notification; wire to `useReminderPolling` in `frontend/src/App.tsx`
- [ ] T100 [US3] Create `backend/tests/WorkManager.Application.Tests/SchedulingTests.cs` (fake `ILocalClock`): snooze stores PreSnoozeStatusId; expiry restores it and logs SnoozeExpired; postpone updates DueDate and logs Postponed + DueDateChanged; pending reminders exclude acknowledged ones and ones outside the lookback window; changing `ReminderAt` on an acknowledged item clears `ReminderAcknowledgedAt` so it is pending again at the new time (G3)

**Checkpoint**: Due dates and reminders can be set via the form. Due-state badge shows Overdue/Due Today/Upcoming correctly. Snooze/postpone dialogs work. Reminder toast fires and is dismissable. T100 passes. Validates quickstart.md S3 and S4.

---

## Phase 6: User Story 4 — Find Work Quickly via Search, Filter, and Sort (Priority: P4)

**Goal**: A user can search, filter, and sort the work item list.

**Independent Test**: Populate 5+ items; search for a keyword; filter by project; sort by priority — each produces the correct subset. See quickstart.md S5.

- [ ] T062 [US4] Extend `backend/src/WorkManager.Application/Services/WorkItemService.GetAllAsync` to accept a `WorkItemQuery` parameter with fields: `search` (string?), `priorityId` (int?), `statusId` (int?), `projectId` (int?), `categoryId` (int?), `tagId` (int?), `dueBefore` (DateOnly?), `dueAfter` (DateOnly?), `sortBy` (string?), `sortDir` (string?), `page` (int), `pageSize` (int); implement LINQ filtering and ordering; full-text search checks title, description, project name, category name, tag names
- [ ] T063 [US4] Update `GET /api/work-items` in `backend/src/WorkManager.Api/Controllers/WorkItemsController.cs` to bind all `WorkItemQuery` parameters from the query string and pass to service; return `PagedWorkItemResponse`
- [ ] T064 [P] [US4] Create `frontend/src/components/SearchBar.tsx` — controlled text input with debounce (300ms); updates search query param in parent state
- [ ] T065 [P] [US4] Create `frontend/src/components/FilterPanel.tsx` — dropdowns for priority, status, project, category, tag, due-before date, due-after date; each selector populated from the configuration hooks; "Clear all" button resets all filters
- [ ] T066 [P] [US4] Create `frontend/src/components/SortControls.tsx` — dropdown for sort field (priority, dueDate, createdAt, updatedAt, project, status) and toggle for sort direction (asc/desc)
- [ ] T067 [US4] Integrate `SearchBar`, `FilterPanel`, and `SortControls` into `frontend/src/pages/InboxPage.tsx`; pass combined query state to `useWorkItems` hook so the GET /api/work-items request reflects all active filters; apply same filters to other predefined view pages via shared `useWorkItemsQuery` hook in `frontend/src/hooks/useWorkItems.ts`
- [ ] T068 [US4] Add active filter summary display to `frontend/src/components/FilterPanel.tsx` — shows human-readable labels for active filters (e.g., "Project: EDA", "Priority: High"); individual × dismiss per filter
- [ ] T101 [US4] Create `backend/tests/WorkManager.Integration.Tests/WorkItemQueryTests.cs`: search across title, description, project, category, and tag names; each filter (priority, status, project, category, tag, dueBefore, dueAfter); each sort field in both directions; pagination

**Checkpoint**: Search, filter, and sort each produce correct, immediate results. Clearing filters restores the full list. T101 passes. Validates quickstart.md S5.

---

## Phase 7: User Story 5 — Navigate Predefined Work Views (Priority: P5)

**Goal**: A user can switch between all 7 predefined views via a sidebar in under 2 seconds.

**Independent Test**: Navigate to each view; verify only appropriate items appear; measure navigation time. See quickstart.md S6.

- [ ] T069 [P] [US5] Implement `backend/src/WorkManager.Api/Controllers/ViewsController.cs` with all 7 view endpoints per `contracts/api-views.md`: `GET /api/views/inbox`, `GET /api/views/today`, `GET /api/views/upcoming?days=30`, `GET /api/views/overdue`, `GET /api/views/in-progress`, `GET /api/views/snoozed`, `GET /api/views/completed-today`
- [ ] T070 [US5] Implement view query methods in `backend/src/WorkManager.Application/Services/WorkItemService.cs`: `GetInboxAsync`, `GetTodayAsync`, `GetUpcomingAsync(int days)`, `GetOverdueAsync`, `GetInProgressAsync`, `GetSnoozedAsync`, `GetCompletedTodayAsync`; "today"/"now" come from `ILocalClock` (local timezone, FR-042); statuses are matched by SystemKey; overdue logic is delegated to `DueStateCalculator` (T107): DueDate < local today OR (DueDate = local today AND DueTime set AND effective local datetime < local now), excluding Done/Cancelled/Snoozed (Postponed items ARE included once their new due date has passed); "completed today" = CompletedAt converted to local time falls on local today; `GetCompletedTodayAsync` returns `CompletedTodaySummary` with totalCompleted, byProject, byCategory, items; all view methods apply snooze expiry resolution (T053) before filtering
- [ ] T071 [P] [US5] Create `frontend/src/pages/TodayPage.tsx` — uses `GET /api/views/today`; displays filtered work item list
- [ ] T072 [P] [US5] Create `frontend/src/pages/UpcomingPage.tsx` — uses `GET /api/views/upcoming`; displays filtered work item list
- [ ] T073 [P] [US5] Create `frontend/src/pages/OverduePage.tsx` — uses `GET /api/views/overdue`; highlights overdue items
- [ ] T074 [P] [US5] Create `frontend/src/pages/InProgressPage.tsx` — uses `GET /api/views/in-progress`
- [ ] T075 [P] [US5] Create `frontend/src/pages/SnoozedPage.tsx` — uses `GET /api/views/snoozed`; shows snooze-until datetime per item
- [ ] T076 [US5] Create `frontend/src/pages/CompletedTodayPage.tsx` — uses `GET /api/views/completed-today`; renders summary card (total count), by-project breakdown table, by-category breakdown table, and the full completed items list
- [ ] T077 [US5] Create `frontend/src/components/Sidebar.tsx` — vertical nav listing all 7 predefined views with icons/labels: Inbox, Today, Upcoming, Overdue, In Progress, Snoozed, Completed Today; active route highlighted; add Completed and Configuration links; register all view routes in `frontend/src/App.tsx`
- [ ] T102 [US5] Create `backend/tests/WorkManager.Application.Tests/ViewRulesTests.cs` (fake `ILocalClock`): membership of each of the 7 predefined views; overdue includes a Postponed item whose new due date has passed and excludes Done/Cancelled/Snoozed; local-midnight boundary cases with a non-UTC timezone (e.g., UTC+3 at 22:30 UTC) for Today, Overdue, and Completed Today; `DueStateCalculator` returns each DueState value

**Checkpoint**: All 7 views are navigable from the sidebar. Each shows only the correct items. Navigation is client-side (instant). T102 passes. Validates quickstart.md S6.

---

## Phase 8: User Story 6 — Review Completed Work (Priority: P6)

**Goal**: A user can browse completed work by date or date range.

**Independent Test**: Complete items across multiple days; query by today, a past date, and a date range; verify correct items appear each time. See quickstart.md S7.

- [ ] T078 [US6] Implement `GetCompletedAsync(DateOnly? date, DateOnly? from, DateOnly? to)` in `backend/src/WorkManager.Application/Services/WorkItemService.cs` — returns work items where CompletedAt (converted to local time via `ILocalClock`) falls within the requested local-date period; defaults to today when no parameters are given; rejects conflicting parameter combinations
- [ ] T079 [US6] Add `GET /api/completed?date=&from=&to=` route to `backend/src/WorkManager.Api/Controllers/ViewsController.cs` per `contracts/api-views.md`; validate parameter combinations; return array of WorkItemResponse
- [ ] T080 [P] [US6] Add `getCompletedWork(params)` API client function to `frontend/src/api/workItemsApi.ts`
- [ ] T081 [P] [US6] Create `frontend/src/hooks/useCompletedWork.ts` — React Query hook accepting `{ date?, from?, to? }` params; re-fetches when params change
- [ ] T082 [US6] Create `frontend/src/pages/CompletedPage.tsx` — date mode selector (today / specific date / date range); date picker and date-range picker inputs; renders `WorkItemList` filtered to completed items for the selected period; add `/completed` route to `frontend/src/App.tsx` and Completed link to `Sidebar`
- [ ] T103 [US6] Create `backend/tests/WorkManager.Integration.Tests/CompletedEndpointTests.cs`: today (default), single date, and date range return the right items; conflicting parameters → 400

**Checkpoint**: Completed work page shows correct items for today, a selected date, and a selected range. T103 passes. Validates quickstart.md S7.

---

## Phase 9: User Story 7 — View Work Item Activity History (Priority: P7)

**Goal**: A user can see a chronological history of key changes on any work item.

**Independent Test**: Make several changes to one item; open history; verify all events appear with correct timestamps. See quickstart.md S9.

- [ ] T083 [US7] Audit all state-changing methods in `backend/src/WorkManager.Application/Services/WorkItemService.cs` and ensure every tracked event produces an `ActivityRecord` via `IActivityRepository`: Created (on create), StatusChanged, PriorityChanged, DueDateChanged, ProjectChanged (on update), Completed (on complete), Postponed and DueDateChanged (on postpone), Snoozed (on snooze), SnoozeExpired (on lazy expiry resolution in T053); OldValue and NewValue should be human-readable (e.g., status name, priority name, date string)
- [ ] T084 [US7] Add `GET /api/work-items/{id}/history` endpoint to `backend/src/WorkManager.Api/Controllers/WorkItemsController.cs`; delegate to `IActivityRepository.GetByWorkItemIdAsync`; return list of `ActivityRecordDto` ordered by OccurredAt ascending
- [ ] T085 [P] [US7] Add `getWorkItemHistory(id)` API client function to `frontend/src/api/workItemsApi.ts`
- [ ] T086 [P] [US7] Create `frontend/src/hooks/useActivityHistory.ts` — React Query hook fetching history for a given work item id; disabled when no id provided
- [ ] T087 [US7] Create `frontend/src/components/ActivityHistory.tsx` — renders a vertical timeline of ActivityRecord entries showing EventType label, OldValue → NewValue (when applicable), and formatted OccurredAt timestamp; integrate as a collapsible section in `WorkItemDetail.tsx` (T033)
- [ ] T104 [US7] Create `backend/tests/WorkManager.Application.Tests/ActivityHistoryTests.cs`: every FR-037 event (plus SnoozeExpired) produces exactly one record with human-readable old/new values; history is ordered by OccurredAt ascending; deleting a work item removes its history

**Checkpoint**: Opening a work item's detail panel shows its full change history. T104 passes. Validates quickstart.md S9.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that cut across multiple user stories — empty states, error handling, environment hygiene, and final validation.

- [ ] T088 [P] Create `frontend/src/components/EmptyState.tsx` — reusable empty-state component with icon, message, and optional action button; integrate into all list-rendering pages (Inbox, Today, Upcoming, Overdue, In Progress, Snoozed, Completed, Completed Today)
- [ ] T089 [P] Create `frontend/src/components/LoadingSpinner.tsx` — reusable loading indicator; integrate into all React Query `isLoading` states across all pages
- [ ] T090 [P] Verify all API controllers return `400 BadRequest` with RFC 7807 ProblemDetails for validation errors and `404 NotFound` for missing resources; ensure global exception handler in `backend/src/WorkManager.Api/Program.cs` (T008) catches unhandled exceptions and returns `500` ProblemDetails without stack traces in production
- [ ] T091 [P] Create `frontend/src/components/ErrorBoundary.tsx` — React error boundary wrapping the app; add API error toast in `frontend/src/App.tsx` using React Query's `onError` global handler; display human-readable error messages from ProblemDetails responses
- [ ] T093 Review `backend/src/WorkManager.Api/appsettings.json` and `appsettings.Development.json.example` for completeness; add `Logging:LogLevel` configuration; verify no secrets in committed files
- [ ] T105 [P] Create frontend tests in `frontend/src/components/__tests__/`: `WorkItemForm.test.tsx` (title required, DueTime requires DueDate, reminder not in past), `DueStateBadge.test.tsx` (renders each state with a text label), `ReminderNotification.test.tsx` (a reminder is shown once and removed on dismiss)
- [ ] T094 Run `dotnet test` (from `backend/`) and `npm run test` (from `frontend/`) — all green; then execute all acceptance scenarios in `specs/001-work-management-mvp/quickstart.md` (S1–S9) end-to-end and the W01–W18 checklist (spec.md, MVP Acceptance Workflows); record pass/fail for each W01–W18 and mark each SC-001 through SC-010 as verified or flag for follow-up

**Checkpoint**: Workflows W01–W18 all pass. All 10 success criteria are verified. All automated tests pass. Application is stable for daily personal use.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1. **BLOCKS all user stories.**
- **Phase 3–9 (User Stories)**: All depend on Phase 2 completion; can proceed in priority order (P1 → P7) or in parallel if multiple developers are available.
- **Phase 10 (Polish)**: Depends on all desired user story phases being complete.

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (P1) | Phase 2 only | Fully independent — this is the MVP core |
| US2 (P2) | Phase 2 only | Independent; adds project/category/tag selectors to WorkItemForm (T051) when built after US1 |
| US3 (P3) | US1 | Extends WorkItemService and WorkItemForm from US1 |
| US4 (P4) | US1 | Extends `GetAllAsync` and WorkItemsController from US1 |
| US5 (P5) | US1 | Extends WorkItemService with view methods; view pages reuse US1 list components |
| US6 (P6) | US1 | Extends WorkItemService with completed query |
| US7 (P7) | US1 | Audits and completes ActivityRecord recording started in US1 |

### Within Each User Story

- Backend models → backend services → backend controllers
- Frontend types → frontend API client → frontend hooks → frontend components → frontend pages
- Backend and frontend tasks within a story marked **[P]** can proceed in parallel

### Parallel Opportunities

- All Phase 1 tasks marked [P]: run simultaneously after project creation (T001, T002)
- All Phase 2 entity tasks T011–T018: run in parallel after T010 is done; T019 (DbContext) can start after all entities exist
- Within each user story: all [P] tasks run simultaneously; the unlabelled tasks run sequentially after their dependencies
- US2 backend controllers T042–T046 and US2 services T037–T041: all six pairs are fully parallel
- US5 page components T071–T075: all five fully parallel

---

## Parallel Example: User Story 1

```
After Phase 2 completes:

  Parallel group A (backend):
    T024 — Create WorkItem DTOs
    T025 — Create ActivityRecord DTO
    T107 — DueStateCalculator

  Then T026 — WorkItemService (depends on A)
  Then T027 — WorkItemsController (depends on T026)
  Then T097, T098 — US1 tests (depend on T026, T027)

  Parallel group B (frontend, starts at same time as A):
    T028 — TypeScript types
    T029 — API client functions

  Then T030 — React Query hooks (depends on B)

  Parallel group C (frontend components, after T030):
    T031 — WorkItemList
    T032 — WorkItemForm
    T033 — WorkItemDetail

  Then T034 — InboxPage (depends on C)
  Then T035 — App.tsx routing (depends on T034)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL** — blocks all stories)
3. Complete Phase 3: User Story 1 (US1)
4. **STOP and VALIDATE**: Run quickstart.md S1; verify SC-001 and SC-008
5. The application is usable as a basic personal task manager at this point

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + US1 → create/view/edit/complete/delete work items (MVP!)
3. + US2 → full lookup value configuration
4. + US3 → due dates, reminders, snooze, postpone
5. + US4 → search, filter, sort
6. + US5 → all 7 predefined views
7. + US6 → completed work date review
8. + US7 → activity history
9. Polish → production-ready personal tool

Each increment leaves the application in a fully functional, demonstrable state.

---

## Notes

- [P] tasks operate on different files; they have no dependency on incomplete sibling tasks and can run concurrently
- [Story] labels map tasks to user stories for traceability to spec.md and quickstart.md
- Test tasks (T095–T105) satisfy Constitution Principle VII; a story phase is not done until its test task passes
- Use `ILocalClock` (T108) for all time access and `SystemKey` (T109) for all status logic — never `DateTime.UtcNow`/`DateTime.Today` or status names
- Commit after each checkpoint to preserve working increments
- Do not start Phase 3+ until Phase 2 checkpoint is verified (API returns seeded priorities)
- T083 (full activity recording) extends T026 — some activity recording is seeded in US1 (Created event); US7 completes the full set
